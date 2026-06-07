import crypto from 'node:crypto';
import asyncHandler from 'express-async-handler';
import { getRazorpay } from '../config/razorpay.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { notify, notifyAdmins } from '../services/notificationService.js';

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId).select('user total currency payment');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    res.status(503);
    throw new Error('Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(order.total * 100),
    currency: order.currency || 'INR',
    receipt: String(order._id),
    notes: { userId: String(order.user) },
  });

  order.payment.razorpayOrderId = rzpOrder.id;
  await order.save();

  res.json({
    success: true,
    data: {
      key: process.env.RAZORPAY_KEY_ID,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    },
  });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  const order = await Order.findById(orderId).select('user status payment total');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  if (order.payment?.razorpayOrderId && order.payment.razorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error('Payment order mismatch');
  }
  const wasUnpaid = order.status !== 'paid';
  order.status = 'paid';
  order.payment.razorpayPaymentId = razorpay_payment_id;
  order.payment.razorpayOrderId = razorpay_order_id;
  order.payment.razorpaySignature = razorpay_signature;
  order.payment.paidAt = new Date();
  await order.save();

  await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

  // Notify on first successful payment (idempotent — no duplicate on retry).
  if (wasUnpaid) {
    const amount = `₹${Number(order.total || 0).toLocaleString('en-IN')}`;
    await notify({
      user: order.user,
      type: 'order_paid',
      title: 'Payment received',
      message: `We've received your payment of ${amount}.`,
      data: { orderId: order._id },
      link: `/account/orders/${order._id}`,
      email: true,
      push: true,
      emailContext: { order },
    });

    // Alert every admin that payment came through (bell + email).
    await notifyAdmins({
      type: 'admin_order_paid',
      title: 'Payment received',
      message: `Payment of ${amount} was confirmed for an order.`,
      data: { orderId: order._id },
      link: '/admin/orders',
      emailContext: { order },
    });
  }

  res.json({ success: true, data: order });
});
