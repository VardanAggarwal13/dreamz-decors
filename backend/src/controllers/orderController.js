import asyncHandler from 'express-async-handler';
import Order, { ORDER_STATUS } from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import ProductReview from '../models/ProductReview.js';
import { buildPagination, buildPaginationMeta, paginationPresets, escapeRegex } from '../utils/query.js';
import { notify, notifyAdmins } from '../services/notificationService.js';
import { initiateRefund } from '../services/paymentService.js';
import { normalizeOrigin } from '../services/emailTemplates.js';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/*
 * Notifications fired when an ADMIN moves the order along. Deliberately absent:
 *   • `confirmed` — payment notifications are sent by paymentService.markOrderPaid,
 *     the moment the money is actually captured.
 *   • `refunded`  — sent only when Razorpay's refund.processed webhook confirms
 *     the money moved. Telling a customer "refund processed" before that is a lie.
 */
const STATUS_NOTIFICATION = {
  processing: { type: 'order_processing', title: 'Order processing & shipping', message: () => 'Your order is being processed and prepared for shipping.', email: false },
  shipped:    { type: 'order_shipped',    title: 'Order processed & shipped', message: () => 'Your order has been processed and dispatched, and is on its way.', email: true },
  delivered:  { type: 'order_delivered',  title: 'Order delivered',   message: () => 'Your order has been delivered. We hope you love it!', email: true },
  cancelled:  { type: 'order_cancelled',  title: 'Order cancelled',   message: () => 'Your order has been cancelled.', email: true },
};

// The admin UI speaks generic stages; translate them to canonical orderStatus.
const LEGACY_TO_ORDER_STATUS = {
  pending: 'pending',
  paid: 'confirmed',
  processing: 'shipped',
  shipped: 'shipped',
  'processing & shipping': 'shipped',
  'processing_shipping': 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  refunded: 'refunded',
};

const FULFILLMENT_FOR = { shipped: 'shipped', delivered: 'delivered' };

// Two carts are "the same order" when the money and the line items both match.
const sameCart = (order, items, total) =>
  Number(order.total) === Number(total) &&
  order.items.length === items.length &&
  items.every((it) =>
    order.items.some(
      (o) => String(o.product) === String(it.product) && o.qty === it.qty && Number(o.price) === Number(it.price)
    )
  );

const ORDER_LIST_SELECT =
  'items subtotal shipping discount total currency status orderStatus paymentStatus fulfillmentStatus payment createdAt updatedAt';

export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'razorpay', notes } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'title price images isActive',
    options: { lean: true },
  });
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }
  if (cart.items.some((item) => !item.product || item.product.isActive === false)) {
    res.status(400);
    throw new Error('Cart contains unavailable products');
  }

  const items = cart.items.map((i) => ({
    product: i.product._id,
    title: i.product.title,
    image: i.product.images?.[0]?.url,
    price: i.product.price,
    qty: i.qty,
    options: i.options,
  }));

  // Prices always come from the DB, never the request body — a client that tampers
  // with amounts changes nothing here.
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = 0; // Free delivery on all orders
  const total = subtotal + shipping;

  // Refreshing checkout, hitting back, or retrying a failed payment must not pile
  // up pending orders — reuse the open one when the cart hasn't changed.
  if (paymentMethod === 'razorpay') {
    const openOrder = await Order.findOne({
      user: req.user._id,
      orderStatus: 'pending',
      paymentStatus: { $in: ['pending', 'failed'] },
      'payment.method': 'razorpay',
    }).sort({ createdAt: -1 });

    if (openOrder && sameCart(openOrder, items, total)) {
      openOrder.shippingAddress = shippingAddress;
      openOrder.notes = notes;
      if (openOrder.paymentStatus === 'failed') openOrder.paymentStatus = 'pending';
      openOrder.events.push({ type: 'order.reused', source: 'api' });
      await openOrder.save();
      return res.status(200).json({ success: true, data: openOrder, reused: true });
    }
  }

  const origin = normalizeOrigin(req.headers.origin || req.headers.referer);

  const order = await Order.create({
    user: req.user._id,
    items,
    subtotal,
    shipping,
    total,
    shippingAddress,
    notes,
    origin,
    payment: { method: paymentMethod },
    orderStatus: paymentMethod === 'cod' ? 'processing' : 'pending',
    paymentStatus: 'pending',
  });

  if (paymentMethod === 'cod') {
    cart.items = [];
    await cart.save();
    for (const item of items || []) {
      if (item.product) {
        await Product.updateOne({ _id: item.product }, { $inc: { sales: item.qty || 1 } }).catch(() => {});
      }
    }

    // Fire the "order placed" notification to the customer (in-app + email + push)
    await notify({
      user: req.user._id,
      type: 'order_placed',
      title: 'Order Placed (Cash on Delivery)',
      message: `Your order for ${inr(total)} has been placed. You can pay via cash on delivery.`,
      data: { orderId: order._id },
      link: `/account/orders/${order._id}`,
      email: true,
      push: true,
      emailContext: { order, origin },
    });

    // Alert every admin about the new COD order (bell + email)
    await notifyAdmins({
      type: 'admin_new_order',
      title: 'New order received (COD)',
      message: `${req.user.name || 'A customer'} placed a Cash on Delivery order of ${inr(total)}.`,
      data: { orderId: order._id },
      link: '/admin/orders',
      emailContext: { order, customerName: req.user.name, origin },
    });
  }

  // NOTE: For online payments (Razorpay), NO email or push is triggered here while the order is pending.
  // When the customer completes payment, paymentService.markOrderPaid fires 'order_paid' to customer
  // and 'admin_order_paid' to admins with full verification.

  res.status(201).json({ success: true, data: order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, paginationPresets.order);
  const filter = { user: req.user._id };

  const { status } = req.query;
  if (status && status !== 'all') {
    if (status === 'active') {
      filter.status = { $in: ['pending', 'paid', 'processing', 'shipped', 'processing & shipping'] };
    } else if (status === 'cancelled') {
      filter.status = { $in: ['cancelled', 'refunded'] };
    } else {
      filter.status = status;
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).select(ORDER_LIST_SELECT).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: orders, ...buildPaginationMeta(total, page, limit) });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.product', 'slug title images')
    .lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.json({ success: true, data: order });
});

export const getOrderReviews = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view reviews for this order');
  }
  const productIds = (order.items || [])
    .map((it) => it.product?._id || it.product)
    .filter(Boolean);

  const reviews = await ProductReview.find({
    user: req.user._id,
    product: { $in: productIds },
  }).lean();

  const map = {};
  reviews.forEach((r) => {
    map[String(r.product)] = r;
  });

  res.json({ success: true, data: map });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { status, paymentStatus, paymentMethod, datePreset, from, to, sort } = req.query;
  const filter = {};

  // Status filter (generic stages)
  if (status) {
    if (status === 'shipped' || status === 'processing' || status === 'processing & shipping') {
      filter.status = { $in: ['shipped', 'processing'] };
    } else {
      filter.status = status;
    }
  }

  // Payment status filter
  if (paymentStatus) {
    const ps = String(paymentStatus).toLowerCase();
    if (ps === 'paid' || ps === 'captured') {
      filter.paymentStatus = { $in: ['captured', 'paid', 'authorized'] };
    } else if (ps === 'unpaid' || ps === 'pending') {
      filter.paymentStatus = { $in: ['pending', null] };
    } else if (ps === 'failed') {
      filter.paymentStatus = 'failed';
    } else if (ps === 'refunded') {
      filter.paymentStatus = { $in: ['refunded', 'refund_initiated', 'partially_refunded'] };
    } else {
      filter.paymentStatus = ps;
    }
  }

  // Payment method filter (e.g. razorpay vs cod)
  if (paymentMethod) {
    filter['payment.method'] = paymentMethod;
  }

  // Date range filter (preset or custom from/to)
  let dateFrom = null;
  let dateTo = null;

  if (datePreset) {
    const now = new Date();
    if (datePreset === 'today') {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (datePreset === 'yesterday') {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateFrom = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0);
      dateTo = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
    } else if (datePreset === '7days') {
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateTo = now;
    } else if (datePreset === '30days') {
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateTo = now;
    } else if (datePreset === 'this_month') {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      dateTo = now;
    }
  }

  if (from) {
    const parsedFrom = new Date(from);
    if (!isNaN(parsedFrom.getTime())) {
      dateFrom = new Date(parsedFrom.getFullYear(), parsedFrom.getMonth(), parsedFrom.getDate(), 0, 0, 0);
    }
  }

  if (to) {
    const parsedTo = new Date(to);
    if (!isNaN(parsedTo.getTime())) {
      dateTo = new Date(parsedTo.getFullYear(), parsedTo.getMonth(), parsedTo.getDate(), 23, 59, 59, 999);
    }
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) filter.createdAt.$lte = dateTo;
  }

  // Min / max amount filter
  if (req.query.minAmount || req.query.maxAmount) {
    filter.total = {};
    if (req.query.minAmount) filter.total.$gte = Number(req.query.minAmount);
    if (req.query.maxAmount) filter.total.$lte = Number(req.query.maxAmount);
  }

  // Optional search: by customer name/email, or by the order id text.
  const rawQ = String(req.query.q || '').trim();
  const q = rawQ.replace(/^#/, '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const userIds = await User.find({ $or: [{ name: rx }, { email: rx }] }).distinct('_id');
    filter.$or = [
      { user: { $in: userIds } },
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: escapeRegex(q), options: 'i' } } },
    ];
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  else if (sort === 'total_high') sortOption = { total: -1, createdAt: -1 };
  else if (sort === 'total_low') sortOption = { total: 1, createdAt: -1 };

  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, paginationPresets.order);
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, ...buildPaginationMeta(total, page, limit) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const target = LEGACY_TO_ORDER_STATUS[status] || (ORDER_STATUS.includes(status) ? status : null);
  if (!target) {
    res.status(400);
    throw new Error(`Unknown order status "${status}"`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // "Refunded" is not something an admin can simply declare — money has to move.
  // Kick off a real Razorpay refund; the webhook flips the order once it lands.
  if (target === 'refunded') {
    try {
      const { amount } = await initiateRefund(order, { byUserId: req.user._id });
      return res.json({
        success: true,
        data: order,
        message: `Refund of ${inr(amount / 100)} initiated — the order will show as refunded once Razorpay confirms it.`,
      });
    } catch (err) {
      res.status(400);
      throw err;
    }
  }

  const changed = order.orderStatus !== target;
  order.orderStatus = target;
  if (FULFILLMENT_FOR[target]) order.fulfillmentStatus = FULFILLMENT_FOR[target];
  order.events.push({ type: `order.${target}`, source: 'admin', meta: { by: String(req.user._id) } });

  // Cancelling an order that was already paid must return the customer's money.
  let refundNote;
  if (target === 'cancelled' && order.paymentStatus === 'captured') {
    try {
      const { amount } = await initiateRefund(order, { byUserId: req.user._id });
      refundNote = `Refund of ${inr(amount / 100)} initiated.`;
    } catch (err) {
      refundNote = `Order cancelled, but the refund could not be started: ${err.message}`;
    }
  }

  await order.save();

  const spec = STATUS_NOTIFICATION[target];
  if (changed && spec) {
    const origin = normalizeOrigin(req.headers.origin || req.headers.referer) || order.origin;
    await notify({
      user: order.user,
      type: spec.type,
      title: spec.title,
      message: spec.message(order),
      data: { orderId: order._id },
      link: `/account/orders/${order._id}`,
      email: spec.email !== false,
      push: true,
      emailContext: { order, origin },
    });
  }

  res.json({ success: true, data: order, ...(refundNote && { message: refundNote }) });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  await Order.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: 'Order deleted successfully' });
});

