import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { sendWelcomeEmail } from './newsletterController.js';

// GET /api/account/addresses
export const getAddresses = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.addresses || [] });
});

// POST /api/account/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = { ...req.body };

  if (addr.isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => { a.isDefault = false; });
    addr.isDefault = true;
  }
  user.addresses.push(addr);
  await user.save();
  res.status(201).json({ success: true, data: user.addresses });
});

// PATCH /api/account/addresses/:addrId
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addrId);
  if (!addr) {
    res.status(404);
    throw new Error('Address not found');
  }

  Object.assign(addr, req.body);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => {
      if (String(a._id) !== String(addr._id)) a.isDefault = false;
    });
    addr.isDefault = true;
  }
  await user.save();
  res.json({ success: true, data: user.addresses });
});

// DELETE /api/account/addresses/:addrId
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.pull(req.params.addrId);
  // Keep at least one default if any remain.
  if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
  res.json({ success: true, data: user.addresses });
});

// ─── Email newsletter (the logged-in user's own address) ───────────────────────

// GET /api/account/newsletter — is this account's email subscribed?
export const getNewsletterStatus = asyncHandler(async (req, res) => {
  const email = req.user.email?.toLowerCase();
  const sub = email ? await NewsletterSubscriber.findOne({ email }) : null;
  res.json({
    success: true,
    data: { email, subscribed: sub?.status === 'subscribed' },
  });
});

// PUT /api/account/newsletter  { subscribe: boolean } — toggle for own email.
export const setNewsletterStatus = asyncHandler(async (req, res) => {
  const email = req.user.email?.toLowerCase();
  if (!email) {
    res.status(400);
    throw new Error('Your account has no email address.');
  }
  const subscribe = Boolean(req.body?.subscribe);

  let sub = await NewsletterSubscriber.findOne({ email });
  const wasSubscribed = sub?.status === 'subscribed';

  if (!sub) {
    sub = new NewsletterSubscriber({ email, user: req.user._id, source: 'account' });
  }
  if (!sub.user) sub.user = req.user._id;

  if (subscribe) {
    sub.status = 'subscribed';
    sub.subscribedAt = new Date();
    sub.unsubscribedAt = null;
  } else {
    sub.status = 'unsubscribed';
    sub.unsubscribedAt = new Date();
  }
  await sub.save();

  if (subscribe && !wasSubscribed) sendWelcomeEmail(sub);

  res.json({ success: true, data: { email, subscribed: sub.status === 'subscribed' } });
});
