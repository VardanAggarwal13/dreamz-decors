import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { sendEmail } from '../services/mailer.js';
import { buildNewsletterCampaign } from '../services/emailTemplates.js';
import { unsubscribeUrlFor } from './newsletterController.js';
import { buildPagination, buildPaginationMeta, escapeRegex } from '../utils/query.js';

// GET /api/admin/products — ALL products (incl. inactive), for the admin table
export const listAllProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter = {};
  // Case-insensitive substring search across the fields an admin would type.
  const q = String(req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { slug: rx }, { badge: rx }, { tags: rx }];
  }

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('category', 'title slug').lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, ...buildPaginationMeta(total, page, limit) });
});

// GET /api/admin/categories — ALL categories (paginated + optional search)
export const listAllCategories = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter = {};
  const q = String(req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { slug: rx }, { blurb: rx }];
  }

  const [items, total] = await Promise.all([
    Category.find(filter).sort({ order: 1, title: 1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, ...buildPaginationMeta(total, page, limit) });
});

const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

// GET /api/admin/overview — dashboard metrics
export const overview = asyncHandler(async (req, res) => {
  const [products, orders, customers, revenueAgg, statusAgg, recentOrders] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: { $ne: 'admin' } }),
    Order.aggregate([
      { $match: { status: { $in: PAID_STATUSES } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email').lean(),
  ]);

  res.json({
    success: true,
    data: {
      products,
      orders,
      customers,
      revenue: revenueAgg[0]?.total || 0,
      statusBreakdown: statusAgg.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      recentOrders,
    },
  });
});

// GET /api/admin/customers — list users
export const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, {
    defaultLimit: 20,
    maxLimit: 100,
  });
  const filter = {};
  const q = String(req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('name email role phone createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Attach order count + spend per user.
  const ids = users.map((u) => u._id);
  const orderAgg = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spend: { $sum: '$total' } } },
  ]);
  const byUser = new Map(orderAgg.map((o) => [String(o._id), o]));

  const data = users.map((u) => ({
    ...u,
    orders: byUser.get(String(u._id))?.orders || 0,
    spend: byUser.get(String(u._id))?.spend || 0,
  }));

  res.json({ success: true, data, ...buildPaginationMeta(total, page, limit) });
});

// PATCH /api/admin/customers/:id/role  { role }
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('name email role');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, data: user });
});

// ─── Newsletter ────────────────────────────────────────────────────────────────

// GET /api/admin/newsletter — paginated subscribers + counts.
// Query: ?page&limit&q=<email search>&status=subscribed|unsubscribed
export const listSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req.query.page, req.query.limit, {
    defaultLimit: 25,
    maxLimit: 100,
  });

  const filter = {};
  if (req.query.status === 'subscribed' || req.query.status === 'unsubscribed') {
    filter.status = req.query.status;
  }
  if (req.query.q) {
    filter.email = { $regex: String(req.query.q).trim(), $options: 'i' };
  }

  const [items, total, subscribed, unsubscribed] = await Promise.all([
    NewsletterSubscriber.find(filter)
      .select('email status source createdAt subscribedAt unsubscribedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NewsletterSubscriber.countDocuments(filter),
    NewsletterSubscriber.countDocuments({ status: 'subscribed' }),
    NewsletterSubscriber.countDocuments({ status: 'unsubscribed' }),
  ]);

  res.json({
    success: true,
    data: items,
    stats: { subscribed, unsubscribed, total: subscribed + unsubscribed },
    ...buildPaginationMeta(total, page, limit),
  });
});

// DELETE /api/admin/newsletter/:id — remove a subscriber record entirely.
export const removeSubscriber = asyncHandler(async (req, res) => {
  const sub = await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  if (!sub) {
    res.status(404);
    throw new Error('Subscriber not found');
  }
  res.json({ success: true, data: { _id: req.params.id } });
});

// POST /api/admin/newsletter/send  { subject, heading?, body, ctaLabel?, ctaUrl? }
// Broadcasts a campaign to every currently-subscribed address. Each email gets a
// working unsubscribe link. Sent in small sequential batches so a free SMTP
// account isn't overwhelmed; failures are counted, never fatal.
export const sendCampaign = asyncHandler(async (req, res) => {
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  if (!subject || !body) {
    res.status(400);
    throw new Error('Subject and message are both required.');
  }

  const recipients = await NewsletterSubscriber.find({ status: 'subscribed' })
    .select('email unsubscribeToken')
    .lean();

  if (recipients.length === 0) {
    res.status(400);
    throw new Error('No subscribed recipients to send to.');
  }

  const { heading, ctaLabel, ctaUrl, imageUrl } = req.body || {};
  let sent = 0;
  let failed = 0;

  // Send in batches of 10 with the shared mailer (which never throws).
  const BATCH = 10;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const slice = recipients.slice(i, i + BATCH);
    // eslint-disable-next-line no-await-in-loop
    const results = await Promise.all(
      slice.map((r) => {
        const email = buildNewsletterCampaign({
          subject,
          heading,
          body,
          ctaLabel,
          ctaUrl,
          imageUrl,
          unsubscribeUrl: unsubscribeUrlFor(r),
        });
        return sendEmail({ to: r.email, subject: email.subject, html: email.html });
      })
    );
    results.forEach((ok) => (ok ? (sent += 1) : (failed += 1)));
  }

  res.json({
    success: true,
    data: { recipients: recipients.length, sent, failed },
    message: `Campaign sent to ${sent} of ${recipients.length} subscriber${recipients.length === 1 ? '' : 's'}.`,
  });
});

// POST /api/admin/newsletter/preview — render the exact campaign HTML (no send).
// Used by the composer's live preview so what you see is what subscribers get.
export const previewCampaign = asyncHandler(async (req, res) => {
  const { subject, heading, body, ctaLabel, ctaUrl, imageUrl } = req.body || {};
  const { html } = buildNewsletterCampaign({
    subject: String(subject || '').trim() || 'Subject preview',
    heading,
    body: String(body || '').trim() || 'Your message preview will appear here…',
    ctaLabel,
    ctaUrl,
    imageUrl,
    unsubscribeUrl: '#',
  });
  res.json({ success: true, data: { html } });
});
