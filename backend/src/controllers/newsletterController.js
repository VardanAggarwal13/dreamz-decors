import asyncHandler from 'express-async-handler';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { clientUrl, normalizeOrigin } from '../services/emailTemplates.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public base URL of THIS API, used to build unsubscribe links in emails.
const serverUrl = (origin) => {
  const norm = normalizeOrigin(origin);
  if (norm) {
    if (norm.includes('localhost') || norm.includes('127.0.0.1')) {
      return `http://localhost:${process.env.PORT || 5000}`;
    }
    return process.env.SERVER_URL || 'https://api.dreamdecords.com';
  }
  if (process.env.SERVER_URL) return process.env.SERVER_URL.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return 'https://api.dreamdecords.com';
  return `http://localhost:${process.env.PORT || 5000}`;
};

export const unsubscribeUrlFor = (sub, origin) =>
  `${serverUrl(origin)}/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;

// Welcome email trigger on subscription has been disabled per user requirement.
export function sendWelcomeEmail(_sub, _origin) {
  // Disabled: welcome emails are not sent on subscription.
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

  res.status(201).json({
    success: true,
    data: { email: sub.email, status: sub.status },
    message: wasSubscribed ? "You're already subscribed." : 'Subscribed successfully!',
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

  const backUrl = clientUrl({ origin: req.headers.origin || req.headers.referer });

  res.status(ok ? 200 : 404).type('html').send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Newsletter — DreamzDecors</title></head>
<body style="margin:0;background:#f7f3ec;font-family:Helvetica,Arial,sans-serif;color:#161616;">
  <div style="max-width:480px;margin:12vh auto;padding:40px 32px;background:#fff;border:1px solid #e7e1d6;border-radius:16px;text-align:center;">
    <div style="font-size:18px;font-weight:700;letter-spacing:2px;">DREAMZDECORS</div>
    <h1 style="margin:24px 0 12px;font-size:22px;">${heading}</h1>
    <p style="font-size:14px;line-height:1.7;color:#5a5751;">${message}</p>
    <a href="${backUrl}"
       style="display:inline-block;margin-top:20px;background:#a17f37;color:#fff;text-decoration:none;
              font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;padding:13px 30px;border-radius:999px;">
      Return to Store
    </a>
  </div>
</body></html>`);
});
