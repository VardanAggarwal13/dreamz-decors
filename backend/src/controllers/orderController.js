import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Settings from '../models/Settings.js';
import { buildPagination, buildPaginationMeta, paginationPresets } from '../utils/query.js';
import { notify, notifyAdmins } from '../services/notificationService.js';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Map an order status to the notification it should fire.
const STATUS_NOTIFICATION = {
  paid:       { type: 'order_paid',       title: 'Payment received',  message: (o) => `We've received your payment of ${inr(o.total)}.` },
  processing: { type: 'order_processing', title: 'Order processing',  message: () => 'Your order is being prepared for dispatch.' },
  shipped:    { type: 'order_shipped',    title: 'Order shipped',     message: () => 'Your order has been dispatched and is on its way.' },
  delivered:  { type: 'order_delivered',  title: 'Order delivered',   message: () => 'Your order has been delivered. We hope you love it!' },
  cancelled:  { type: 'order_cancelled',  title: 'Order cancelled',   message: () => 'Your order has been cancelled.' },
  refunded:   { type: 'order_refunded',   title: 'Refund processed',  message: (o) => `Your refund of ${inr(o.total)} has been processed.` },
};

const SHIPPING_FREE_OVER = 1499;
const SHIPPING_FLAT = 99;
const ORDER_LIST_SELECT = 'items subtotal shipping discount total currency status payment createdAt updatedAt';

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

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const { shipping: shipCfg } = await Settings.getSingleton();
  const shipping = subtotal >= (shipCfg?.freeThreshold ?? SHIPPING_FREE_OVER) ? 0 : (shipCfg?.flatRate ?? SHIPPING_FLAT);
  const total = subtotal + shipping;

  const order = await Order.create({
    user: req.user._id,
    items,
    subtotal,
    shipping,
    total,
    shippingAddress,
    notes,
    payment: { method: paymentMethod },
    status: paymentMethod === 'cod' ? 'processing' : 'pending',
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
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const changed = order.status !== status;
  order.status = status;
  await order.save();

  // Notify the customer when the status actually changes.
  const spec = STATUS_NOTIFICATION[status];
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

  res.json({ success: true, data: order });
});
