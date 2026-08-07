import asyncHandler from 'express-async-handler';
import Order, { ORDER_STATUS } from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { buildPagination, buildPaginationMeta, paginationPresets, escapeRegex } from '../utils/query.js';
import { notify, notifyAdmins } from '../services/notificationService.js';
import { initiateRefund } from '../services/paymentService.js';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/*
 * Notifications fired when an ADMIN moves the order along. Deliberately absent:
 *   • `confirmed` — payment notifications are sent by paymentService.markOrderPaid,
 *     the moment the money is actually captured.
 *   • `refunded`  — sent only when Razorpay's refund.processed webhook confirms
 *     the money moved. Telling a customer "refund processed" before that is a lie.
 */
const STATUS_NOTIFICATION = {
  processing: { type: 'order_processing', title: 'Order processing',  message: () => 'Your order is being prepared for dispatch.' },
  shipped:    { type: 'order_shipped',    title: 'Order shipped',     message: () => 'Your order has been dispatched and is on its way.' },
  delivered:  { type: 'order_delivered',  title: 'Order delivered',   message: () => 'Your order has been delivered. We hope you love it!' },
  cancelled:  { type: 'order_cancelled',  title: 'Order cancelled',   message: () => 'Your order has been cancelled.' },
};

// The admin UI still speaks the legacy vocabulary; translate it to orderStatus.
const LEGACY_TO_ORDER_STATUS = {
  pending: 'pending',
  paid: 'confirmed',
  processing: 'processing',
  shipped: 'shipped',
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

  const order = await Order.create({
    user: req.user._id,
    items,
    subtotal,
    shipping,
    total,
    shippingAddress,
    notes,
    payment: { method: paymentMethod },
    orderStatus: paymentMethod === 'cod' ? 'processing' : 'pending',
    paymentStatus: 'pending',
  });

  if (paymentMethod === 'cod') {
    cart.items = [];
    await cart.save();
  }

  // Fire the "order placed" notification to the customer (in-app + email + push).
  await notify({
    user: req.user._id,
    type: 'order_placed',
    title: 'Order confirmed',
    message: `Your order of ${inr(total)} has been placed successfully.`,
    data: { orderId: order._id },
    link: `/account/orders/${order._id}`,
    email: true,
    push: true,
    emailContext: { order },
  });

  // Alert every admin about the new order (bell + email).
  await notifyAdmins({
    type: 'admin_new_order',
    title: 'New order received',
    message: `${req.user.name || 'A customer'} placed an order of ${inr(total)}.`,
    data: { orderId: order._id },
    link: '/admin/orders',
    emailContext: { order, customerName: req.user.name },
  });

  res.status(201).json({ success: true, data: order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, paginationPresets.order);
  const filter = { user: req.user._id };
  const [orders, total] = await Promise.all([
    Order.find(filter).select(ORDER_LIST_SELECT).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: orders, ...buildPaginationMeta(total, page, limit) });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
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

export const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  // Optional search: by customer name/email, or by the order id text.
  const q = String(req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const userIds = await User.find({ $or: [{ name: rx }, { email: rx }] }).distinct('_id');
    filter.$or = [
      { user: { $in: userIds } },
      { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: escapeRegex(q), options: 'i' } } },
    ];
  }

  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, paginationPresets.order);
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
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
    await notify({
      user: order.user,
      type: spec.type,
      title: spec.title,
      message: spec.message(order),
      data: { orderId: order._id },
      link: `/account/orders/${order._id}`,
      email: true,
      push: true,
      emailContext: { order },
    });
  }

  res.json({ success: true, data: order, ...(refundNote && { message: refundNote }) });
});
