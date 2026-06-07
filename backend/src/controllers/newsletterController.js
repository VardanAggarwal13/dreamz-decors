import asyncHandler from 'express-async-handler';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { sendEmail } from '../services/mailer.js';
import { buildNewsletterWelcome } from '../services/emailTemplates.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public base URL of THIS API, used to build unsubscribe links in emails.
const serverUrl = () =>
  (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');

export const unsubscribeUrlFor = (sub) =>
  `${serverUrl()}/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;

// Fire-and-forget welcome email (never blocks the request).
export function sendWelcomeEmail(sub) {
  const { subject, html } = buildNewsletterWelcome({ unsubscribeUrl: unsubscribeUrlFor(sub) });
  sendEmail({ to: sub.email, subject, html }).catch(() => {});
}

// POST /api/newsletter/subscribe  { email }  — public
// Idempotent: a new email is created subscribed; an existing one is re-activated.
export const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    res.status(400);
    throw new Error('Please enter a valid email address.');
  }

  let sub = await NewsletterSubscriber.findOne({ email });
  const wasSubscribed = sub?.status === 'subscribed';

  if (!sub) {
    sub = new NewsletterSubscriber({ email, source: req.body?.source || 'website' });
  } else if (sub.status !== 'subscribed') {
    sub.status = 'subscribed';
    sub.subscribedAt = new Date();
    sub.unsubscribedAt = null;
  }
  await sub.save();

  // Only welcome NEW or re-activated subscribers, not repeat submits.
  if (!wasSubscribed) sendWelcomeEmail(sub);

  res.status(201).json({
    success: true,
    data: { email: sub.email, status: sub.status },
    message: wasSubscribed ? "You're already subscribed." : 'Subscribed — check your inbox!',
  });
});

// GET /api/newsletter/unsubscribe?token=...  — public (opened from an email link)
// Returns a small branded HTML page rather than JSON, since it's clicked in a
// mail client, not called by the SPA.
export const unsubscribeByToken = asyncHandler(async (req, res) => {
  const token = String(req.query?.token || '').trim();
  const sub = token ? await NewsletterSubscriber.findOne({ unsubscribeToken: token }) : null;

  if (sub && sub.status !== 'unsubscribed') {
    sub.status = 'unsubscribed';
    sub.unsubscribedAt = new Date();
    await sub.save();
  }

  const ok = Boolean(sub);
  const heading = ok ? "You're unsubscribed" : 'Link not recognised';
  const message = ok
    ? `<strong>${sub.email}</strong> has been removed from the DreamzDecors newsletter. You can resubscribe anytime from our website.`
    : 'This unsubscribe link is invalid or has expired. If you keep receiving emails, reply to one and we’ll remove you.';

  res.status(ok ? 200 : 404).type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Newsletter — DreamzDecors</title></head>
<body style="margin:0;background:#f7f3ec;font-family:Helvetica,Arial,sans-serif;color:#161616;">
  <div style="max-width:480px;margin:12vh auto;padding:40px 32px;background:#fff;border:1px solid #e7e1d6;border-radius:16px;text-align:center;">
    <div style="font-size:18px;font-weight:700;letter-spacing:2px;">DREAMZDECORS</div>
    <h1 style="margin:24px 0 12px;font-size:22px;">${heading}</h1>
    <p style="font-size:14px;line-height:1.7;color:#5a5751;">${message}</p>
    <a href="${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}"
       style="display:inline-block;margin-top:20px;background:#c59e59;color:#fff;text-decoration:none;
              font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 26px;border-radius:999px;">
      Back to store
    </a>
  </div>
</body></html>`);
});
