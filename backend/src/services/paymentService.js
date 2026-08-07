import crypto from 'node:crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { getRazorpay } from '../config/razorpay.js';
import { notify, notifyAdmins } from '../services/notificationService.js';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Constant-time string comparison. A plain `!==` on an HMAC leaks timing
 * information about how many leading bytes matched.
 */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''), 'utf8');
  const bufB = Buffer.from(String(b ?? ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** HMAC-SHA256 hex digest — the scheme Razorpay uses for both checkout and webhooks. */
export const hmac = (payload, secret) =>
  crypto.createHmac('sha256', secret).update(payload).digest('hex');

/** Checkout signature: HMAC over `order_id|payment_id`. */
export const isValidCheckoutSignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
  safeEqual(hmac(`${razorpay_order_id}|${razorpay_payment_id}`, process.env.RAZORPAY_KEY_SECRET), razorpay_signature);

/** Webhook signature: HMAC over the RAW request body. */
export const isValidWebhookSignature = (rawBody, signature) =>
  safeEqual(hmac(rawBody, process.env.RAZORPAY_WEBHOOK_SECRET), signature);

const logEvent = (order, type, source, meta) => {
  order.events.push({ type, at: new Date(), source, meta });
};

/**
 * Mark an order paid — exactly once, no matter how many times it's called or
 * from where (frontend verify, webhook, or reconciliation).
 *
 * The transition is claimed with an atomic conditional update, so when the
 * verify API and the webhook race (both orderings are possible and normal), only
 * one of them performs the side effects: clearing the cart and notifying.
 *
 * Never regresses orderStatus — an order already `shipped` stays `shipped`.
 *
 * @returns {{ changed: boolean, order: object, duplicate?: boolean }}
 */
export async function markOrderPaid(orderId, { paymentId, razorpayOrderId, signature, amount, source }) {
  // Atomic claim: only the first caller flips paymentStatus to 'captured'.
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: 'captured' } },
    { $set: { paymentStatus: 'captured' } },
    { new: true }
  );

  if (!claimed) {
    // Someone already captured this order. Idempotent no-op — unless a DIFFERENT
    // payment id arrives, which means the customer paid twice (Scenario 27).
    const order = await Order.findById(orderId);
    if (order && paymentId && order.payment?.razorpayPaymentId && order.payment.razorpayPaymentId !== paymentId) {
      logEvent(order, 'payment.duplicate', source, { existing: order.payment.razorpayPaymentId, incoming: paymentId });
      await order.save();
      await notifyAdmins({
        type: 'admin_order_paid',
        title: 'Duplicate payment detected',
        message: `Order ${String(order._id).slice(-8).toUpperCase()} received a second payment (${paymentId}). Refund required.`,
        data: { orderId: order._id },
        link: '/admin/orders',
      }).catch(() => {});
      return { changed: false, duplicate: true, order };
    }
    return { changed: false, order };
  }

  // We own the transition.
  claimed.payment.razorpayPaymentId = paymentId || claimed.payment.razorpayPaymentId;
  claimed.payment.razorpayOrderId = razorpayOrderId || claimed.payment.razorpayOrderId;
  if (signature) claimed.payment.razorpaySignature = signature;
  if (amount != null) claimed.payment.amount = amount;
  claimed.payment.paidAt = new Date();

  // Advance the order only from `pending` — never move a shipped order backwards.
  if (claimed.orderStatus === 'pending') claimed.orderStatus = 'confirmed';

  logEvent(claimed, 'payment.captured', source, { paymentId, amount });
  await claimed.save();

  await Cart.findOneAndUpdate({ user: claimed.user }, { items: [] });

  const amountLabel = inr(claimed.total);
  await notify({
    user: claimed.user,
    type: 'order_paid',
    title: 'Payment received',
    message: `We've received your payment of ${amountLabel}.`,
    data: { orderId: claimed._id },
    link: `/account/orders/${claimed._id}`,
    email: true,
    push: true,
    emailContext: { order: claimed },
  });

  await notifyAdmins({
    type: 'admin_order_paid',
    title: 'Payment received',
    message: `Payment of ${amountLabel} was confirmed for an order.`,
    data: { orderId: claimed._id },
    link: '/admin/orders',
    emailContext: { order: claimed },
  });

  return { changed: true, order: claimed };
}

/**
 * Record a failed payment. Leaves the order `pending` so the customer can retry
 * against the same order — a failed attempt is not a dead order.
 */
export async function markPaymentFailed(orderId, { paymentId, reason, source }) {
  const order = await Order.findOne({ _id: orderId, paymentStatus: { $nin: ['captured', 'refunded'] } });
  if (!order) return { changed: false };

  order.paymentStatus = 'failed';
  order.payment.failedAt = new Date();
  order.payment.failureReason = reason || 'Payment failed';
  logEvent(order, 'payment.failed', source, { paymentId, reason });
  await order.save();
  return { changed: true, order };
}

/**
 * Ask Razorpay to move the money back. This only marks the payment
 * `refund_initiated` — the order is not considered refunded, and the customer is
 * not told it happened, until the `refund.processed` webhook confirms it.
 *
 * @param {number} [amount] rupees to refund; defaults to the full charge.
 * @throws when the order was never captured or Razorpay rejects the refund.
 */
export async function initiateRefund(order, { amount, byUserId } = {}) {
  if (order.paymentStatus !== 'captured') {
    throw new Error(`Cannot refund an order whose payment is "${order.paymentStatus}"`);
  }
  if (!order.payment?.razorpayPaymentId) {
    throw new Error('No Razorpay payment on this order to refund');
  }

  const razorpay = getRazorpay();
  if (!razorpay) throw new Error('Razorpay not configured — cannot issue a refund');

  const chargedPaise = order.payment.amount ?? Math.round((order.total || 0) * 100);
  const paise = amount != null ? Math.round(Number(amount) * 100) : chargedPaise;
  if (!Number.isFinite(paise) || paise <= 0 || paise > chargedPaise) {
    throw new Error('Refund amount must be greater than zero and no more than the amount charged');
  }

  const refund = await razorpay.payments.refund(order.payment.razorpayPaymentId, {
    amount: paise,
    speed: 'normal',
    notes: { orderId: String(order._id), initiatedBy: String(byUserId || 'system') },
  });

  order.paymentStatus = 'refund_initiated';
  order.payment.refundId = refund.id;
  logEvent(order, 'refund.initiated', 'admin', { refundId: refund.id, amount: paise });
  await order.save();

  return { refund, amount: paise };
}

/**
 * Finalise a refund once Razorpay confirms it. Called from the webhook, which is
 * the only thing that knows the money actually moved.
 */
export async function markRefundProcessed(orderId, { refundId, amount, source }) {
  const order = await Order.findById(orderId);
  if (!order) return { changed: false };
  if (order.paymentStatus === 'refunded') return { changed: false, order }; // idempotent

  const refunded = (order.payment.refundedAmount || 0) + Number(amount || 0);
  const chargedPaise = order.payment.amount ?? Math.round((order.total || 0) * 100);
  const full = refunded >= chargedPaise;

  order.payment.refundId = refundId || order.payment.refundId;
  order.payment.refundedAmount = refunded;
  order.payment.refundedAt = new Date();
  order.paymentStatus = full ? 'refunded' : 'partially_refunded';
  order.orderStatus = full ? 'refunded' : 'partially_refunded';

  logEvent(order, 'refund.processed', source, { refundId, amount });
  await order.save();

  await notify({
    user: order.user,
    type: 'order_refunded',
    title: 'Refund processed',
    message: `Your refund of ${inr(refunded / 100)} has been processed.`,
    data: { orderId: order._id },
    link: `/account/orders/${order._id}`,
    email: true,
    push: true,
    emailContext: { order },
  });

  return { changed: true, order };
}
