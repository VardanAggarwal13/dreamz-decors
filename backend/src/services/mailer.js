import nodemailer from 'nodemailer';

let transporter = null;
let warned = false;

/**
 * The single source of truth for the "from" address used by EVERY email the
 * app sends (notifications, password reset, welcome, etc.). Change MAIL_FROM
 * in .env and every email switches sender — nothing is hardcoded.
 * Falls back to the SMTP login, then a safe default.
 */
export function mailFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'DreamzDecor <no-reply@dreamzdecor.com>';
}

// Lazily build a single reusable SMTP transport from env config.
function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!warned) {
      console.warn(
        '✦ Email disabled — set SMTP_HOST, SMTP_USER, SMTP_PASS to enable email notifications.'
      );
      warned = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE) === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
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
