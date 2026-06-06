import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';
import PushSubscription from '../models/PushSubscription.js';
import { serialize } from '../services/notificationService.js';
import { getVapidPublicKey } from '../services/webpush.js';
import { buildPagination, buildPaginationMeta } from '../utils/query.js';

const NOTIF_PRESET = { defaultLimit: 20, maxLimit: 50 };

// GET /api/notifications  — list my notifications (newest first) + unread count
export const myNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, NOTIF_PRESET);
  const filter = { user: req.user._id };

  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);

  res.json({
    success: true,
    data: items.map(serialize),
    unread,
    ...buildPaginationMeta(total, page, limit),
  });
});

// GET /api/notifications/unread-count
export const unreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, data: { unread } });
});

// PATCH /api/notifications/:id/read  — mark one as read
export const markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true, readAt: new Date() },
    { new: true }
  );
  if (!notif) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ success: true, data: serialize(notif) });
});

// PATCH /api/notifications/read-all  — mark all as read
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );
  res.json({ success: true, data: { unread: 0 } });
});

// DELETE /api/notifications/:id
export const removeNotification = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notif) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ success: true, data: { _id: req.params.id } });
});

// ─── Web-push subscription management ──────────────────────────────────────────

// GET /api/notifications/vapid-public-key
export const vapidPublicKey = asyncHandler(async (req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    res.status(503);
    throw new Error('Push notifications are not configured');
  }
  res.json({ success: true, data: { publicKey: key } });
});

// POST /api/notifications/subscribe  — register a browser push subscription
export const subscribePush = asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400);
    throw new Error('Invalid push subscription');
  }

  // Upsert by endpoint so re-subscribing the same browser doesn't duplicate.
  const sub = await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      user: req.user._id,
      endpoint,
      keys,
      userAgent: req.headers['user-agent'],
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json({ success: true, data: { _id: sub._id } });
});

// POST /api/notifications/unsubscribe  — remove a browser push subscription
export const unsubscribePush = asyncHandler(async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) {
    res.status(400);
    throw new Error('endpoint is required');
  }
  await PushSubscription.deleteOne({ endpoint, user: req.user._id });
  res.json({ success: true, data: { ok: true } });
});
