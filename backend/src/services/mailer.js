import nodemailer from 'nodemailer';
import dns from 'dns';

// Force global IPv4 lookup first. Render and many cloud hosts / local ISPs do not support IPv6 routing,
// which causes `connect ENETUNREACH 2607:f8b0:400e:...` errors.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

let transporter = null;
let warned = false;

/**
 * Validate that an email address is real and routable (not dummy .local / .test domains).
 */
export function isValidRecipient(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.endsWith('.local') || trimmed.endsWith('.test') || trimmed.endsWith('.example')) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * The single source of truth for the "from" address used by EVERY email the
 * app sends (notifications, password reset, welcome, etc.).
 */
export function mailFrom() {
  if (process.env.RESEND_API_KEY) {
    if (process.env.RESEND_FROM) return process.env.RESEND_FROM;
    if (process.env.MAIL_FROM && !process.env.MAIL_FROM.includes('gmail.com')) {
      return process.env.MAIL_FROM;
    }
    return 'DreamzDecor <onboarding@resend.dev>';
  }
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'DreamzDecor <dreamzdecor30@gmail.com>';
}

// Lazily build a single reusable SMTP transport from env config with connection pooling.
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
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    lookup: ipv4Lookup,
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });

  return transporter;
}

/**
 * Send an email. Returns true on success, false if email is disabled or fails.
 * Supports both Resend HTTPS API (Port 443 - unblocked on cloud hosts like Render)
 * and standard SMTP (Nodemailer). Never throws.
 */
export async function sendEmail({ to, subject, html, text, replyTo }, retryCount = 0) {
  if (!isValidRecipient(to)) {
    console.warn(`✦ [email] Skipping unroutable/invalid email address: "${to}"`);
    return false;
  }

  // 1. Resend HTTPS API (Port 443 — works seamlessly on Render, Vercel, AWS without SMTP port blocks)
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: mailFrom(),
          to: [to.trim()],
          subject,
          html,
          ...(text ? { text } : {}),
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });

      if (res.ok) {
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      console.error(`✦ [Resend API] Send failed to ${to}:`, errData.message || res.statusText);
      return false;
    } catch (err) {
      console.error(`✦ [Resend API] Network error to ${to}:`, err.message);
      return false;
    }
  }

  // 2. SMTP Transport (Nodemailer)
  const tx = getTransporter();
  if (!tx) return false;

  try {
    await tx.sendMail({
      from: mailFrom(),
      to: to.trim(),
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (err) {
    console.error(`Email send failed to ${to}:`, err.message);

    // If transient socket/connection failure, recreate transporter and retry once
    if (retryCount === 0 && (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'ESOCKET')) {
      console.log(`Retrying email to ${to} with fresh connection...`);
      try {
        transporter?.close?.();
      } catch {}
      transporter = null;
      return sendEmail({ to, subject, html, text, replyTo }, 1);
    }

    return false;
  }
}

