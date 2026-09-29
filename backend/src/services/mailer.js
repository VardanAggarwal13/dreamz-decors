import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 lookup first. Render and many cloud hosts do not support IPv6 routing,
// which causes `connect ENETUNREACH 2607:f8b0:400e:c0a::6c:587` errors!
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

let transporter = null;
let warned = false;

/**
 * The single source of truth for the "from" address used by EVERY email the
 * app sends (notifications, password reset, welcome, etc.). Change MAIL_FROM
 * in .env and every email switches sender — nothing is hardcoded.
 * Falls back to the SMTP login, then a safe default.
 */
export function mailFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'DreamzDecor <dreamzdecor30@gmail.com>';
}

// Lazily build a single reusable SMTP transport from env config.
function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warned) {
      console.warn(
        '✦ Email disabled — set SMTP_HOST, SMTP_USER, SMTP_PASS to enable email notifications.'
      );
      warned = true;
    }
    return null;
  }

  const isGmail = (SMTP_HOST || '').includes('gmail') || (SMTP_USER || '').includes('gmail');
  const port = Number(SMTP_PORT) || (isGmail ? 465 : 587);
  const secure = String(SMTP_SECURE) === 'true' || port === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    family: 4, // CRITICAL: Force IPv4 connection to prevent ENETUNREACH on Render/Linux cloud containers
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  return transporter;
}

/**
 * Send an email. Returns true on success, false if email is disabled or fails.
 * Never throws — notification dispatch must not break on a mail failure.
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const tx = getTransporter();
  if (!tx || !to) return false;

  try {
    await tx.sendMail({
      from: mailFrom(),
      to,
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}
