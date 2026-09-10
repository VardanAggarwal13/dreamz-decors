import asyncHandler from 'express-async-handler';
import { getRazorpay } from '../config/razorpay.js';
import Order from '../models/Order.js';
import WebhookEvent from '../models/WebhookEvent.js';
import {
  isValidCheckoutSignature,
  isValidWebhookSignature,
  markOrderPaid,
  markPaymentFailed,
  markRefundProcessed,
  initiateRefund,
} from '../services/paymentService.js';

const requireRazorpay = (res) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503);
    throw new Error('Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }
  return razorpay;
};

const assertOwner = (order, req, res) => {
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
};

/*
 * POST /api/payments/razorpay/order
 *
 * Creates — or REUSES — the Razorpay order for a pending order. Refreshing the
 * page, hitting back, or retrying a failed payment must not spawn a new Razorpay
 * order each time (Scenarios 6 & 13), so an existing, still-open order of the
 * same amount is handed back untouched.
 */
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId).select('user total currency payment paymentStatus orderStatus events');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  assertOwner(order, req, res);

  if (order.paymentStatus === 'captured') {
    res.status(409);
    throw new Error('This order has already been paid');
  }
  if (['cancelled', 'expired', 'refunded'].includes(order.orderStatus)) {
    res.status(409);
    throw new Error(`This order is ${order.orderStatus} and can no longer be paid`);
  }

  const razorpay = requireRazorpay(res);
  const amount = Math.round(order.total * 100); // paise — always computed server-side
  const currency = order.currency || 'INR';

  // Reuse an existing Razorpay order when it's still open and the amount matches.
  if (order.payment.razorpayOrderId) {
    try {
      const existing = await razorpay.orders.fetch(order.payment.razorpayOrderId);
      if (existing && existing.status === 'created' && Number(existing.amount) === amount) {
        return res.json({
          success: true,
          data: { key: process.env.RAZORPAY_KEY_ID, orderId: existing.id, amount: existing.amount, currency: existing.currency },
        });
      }
    } catch {
      /* Couldn't fetch it (deleted / different key) — fall through and create a new one. */
    }
  }

  const rzpOrder = await razorpay.orders.create({
    amount,
    currency,
    receipt: String(order._id),
    notes: { orderId: String(order._id), userId: String(order.user) },
  });

  order.payment.razorpayOrderId = rzpOrder.id;
  order.payment.amount = amount;
  order.events.push({ type: 'payment.order_created', source: 'api', meta: { razorpayOrderId: rzpOrder.id, amount } });
  await order.save();

  res.json({
    success: true,
    data: { key: process.env.RAZORPAY_KEY_ID, orderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency },
  });
});

/*
 * POST /api/payments/razorpay/verify
 *
 * The browser reporting success. This improves UX but is NOT the source of
 * truth — the webhook is. It's safe to call twice, and safe to arrive either
 * before or after the webhook (Scenarios 21 & 22).
 */
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!isValidCheckoutSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature })) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  const order = await Order.findById(orderId).select('user payment paymentStatus orderStatus total');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  assertOwner(order, req, res);

  if (order.payment?.razorpayOrderId && order.payment.razorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error('Payment order mismatch');
  }

  const { order: updated } = await markOrderPaid(order._id, {
    paymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
    signature: razorpay_signature,
    source: 'verify',
  });

  res.json({ success: true, data: updated });
});

/*
 * GET /api/payments/status/:orderId
 *
 * Self-healing status check (Scenario 3, 8, 9). If our DB still says pending, ask
 * Razorpay what actually happened — this recovers orders where the customer paid
 * but lost their connection, closed the tab, or our server was down.
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).select('user payment paymentStatus orderStatus total');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  assertOwner(order, req, res);

  let current = order;

  if (order.paymentStatus !== 'captured' && order.payment?.razorpayOrderId) {
    const razorpay = getRazorpay();
    if (razorpay) {
      try {
        const { items = [] } = await razorpay.orders.fetchPayments(order.payment.razorpayOrderId);
        const captured = items.find((p) => p.status === 'captured');
        if (captured) {
          const result = await markOrderPaid(order._id, {
            paymentId: captured.id,
            razorpayOrderId: order.payment.razorpayOrderId,
            amount: captured.amount,
            source: 'reconcile',
          });
          current = result.order;
        }
      } catch {
        /* Razorpay unreachable — fall back to whatever the DB says. */
      }
    }
  }

  res.json({
    success: true,
    data: {
      orderId: current._id,
      orderStatus: current.orderStatus,
      paymentStatus: current.paymentStatus,
      paidAt: current.payment?.paidAt || null,
    },
  });
});

/*
 * POST /api/payments/refund/:orderId  (admin)
 *
 * Actually moves money. The order is only marked `refunded` when Razorpay's
 * `refund.processed` webhook confirms it — never optimistically here.
 */
export const refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  try {
    const { refund, amount } = await initiateRefund(order, { amount: req.body.amount, byUserId: req.user._id });
    res.json({ success: true, data: { refundId: refund.id, amount, paymentStatus: order.paymentStatus } });
  } catch (err) {
    res.status(400);
    throw err;
  }
});

// ── Webhook ──────────────────────────────────────────────────────────────────

// Locate the order a webhook payload refers to, without trusting the body blindly.
const findOrderForEvent = async (payload) => {
  const payment = payload?.payment?.entity;
  const refund = payload?.refund?.entity;

  if (refund?.payment_id) {
    const byPayment = await Order.findOne({ 'payment.razorpayPaymentId': refund.payment_id });
    if (byPayment) return byPayment;
  }
  if (payment?.order_id) {
    const byOrder = await Order.findOne({ 'payment.razorpayOrderId': payment.order_id });
    if (byOrder) return byOrder;
  }
  // Fall back to the notes we attached when creating the Razorpay order.
  const noteId = payment?.notes?.orderId || payload?.order?.entity?.notes?.orderId;
  if (noteId) return Order.findById(noteId).catch(() => null);
  return null;
};

/*
 * POST /api/payments/webhook
 *
 * The authoritative confirmation channel. Mounted with a RAW body parser before
 * express.json() (the signature is over the exact bytes Razorpay sent) and
 * outside `protect` — Razorpay has no session.
 *
 * Rules: verify the signature, dedupe by event id, and ALWAYS answer 200 for an
 * event we've already handled so Razorpay stops retrying (Scenarios 4, 5, 20).
 */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.get('x-razorpay-signature');
  const eventId = req.get('x-razorpay-event-id');
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? '');

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    res.status(503);
    throw new Error('Webhook secret not configured');
  }
  if (!signature || !isValidWebhookSignature(raw, signature)) {
    res.status(400);
    throw new Error('Invalid webhook signature');
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    res.status(400);
    throw new Error('Malformed webhook payload');
  }

  const { event, payload } = body;

  // Claim the event. An event we already finished is acknowledged and dropped;
  // one that previously FAILED is retried, so we must not dedupe those away.
  const key = eventId || `${event}:${payload?.payment?.entity?.id || Date.now()}`;
  let record = await WebhookEvent.findOne({ eventId: key });
  if (record?.status === 'processed') {
    return res.status(200).json({ success: true, deduped: true });
  }
  if (!record) {
    try {
      record = await WebhookEvent.create({ eventId: key, event, payload });
    } catch (err) {
      // Concurrent delivery of the same event won the race — it owns processing.
      if (err?.code === 11000) return res.status(200).json({ success: true, deduped: true });
      throw err;
    }
  } else {
    record.status = 'processing';
    record.error = undefined;
    await record.save();
  }

  try {
    const order = await findOrderForEvent(payload);

    if (order) {
      record.order = order._id;

      if (event === 'payment.captured' || event === 'order.paid') {
        const entity = payload.payment.entity;
        await markOrderPaid(order._id, {
          paymentId: entity.id,
          razorpayOrderId: entity.order_id,
          amount: entity.amount,
          source: 'webhook',
        });
      } else if (event === 'payment.failed') {
        const entity = payload.payment.entity;
        await markPaymentFailed(order._id, {
          paymentId: entity.id,
          reason: entity.error_description || entity.error_reason,
          source: 'webhook',
        });
      } else if (event === 'refund.processed') {
        const entity = payload.refund.entity;
        await markRefundProcessed(order._id, { refundId: entity.id, amount: entity.amount, source: 'webhook' });
      }
    }

    record.status = 'processed';
    record.processedAt = new Date();
    await record.save();
  } catch (err) {
    // Mark it failed and let Razorpay retry — but never 500 on a signature-valid
    // event we've already recorded, or we'd wedge the retry loop.
    record.status = 'failed';
    record.error = err.message;
    await record.save().catch(() => {});
    res.status(500);
    throw err;
  }

  res.status(200).json({ success: true });
});
