import asyncHandler from 'express-async-handler';
import Settings from '../models/Settings.js';
import { sendEmail, mailFrom } from '../services/mailer.js';
import { buildContactMessage } from '../services/emailTemplates.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Where contact submissions are delivered: an explicit env override, else the
// admin-managed support email from Settings, else the app's "from" address.
async function contactRecipient() {
  if (process.env.CONTACT_TO) return process.env.CONTACT_TO;
  const settings = await Settings.getSingleton();
  return settings?.contact?.email || mailFrom();
}

// POST /api/contact  { name, email, subject?, message }  — public
export const submitContact = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Please fill in your name, email, and message.');
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400);
    throw new Error('Please enter a valid email address.');
  }
  if (message.length > 5000) {
    res.status(400);
    throw new Error('Message is too long.');
  }

  const to = await contactRecipient();
  const { subject: emailSubject, html } = buildContactMessage({ name, email, subject, message });

  const sent = await sendEmail({ to, subject: emailSubject, html, replyTo: email });
  if (!sent) {
    res.status(503);
    throw new Error('Could not send your message right now. Please email us directly.');
  }

  res.status(201).json({
    success: true,
    message: "Thanks for reaching out — we'll get back to you within 1 business day.",
  });
});
