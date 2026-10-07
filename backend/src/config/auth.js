import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { betterAuth } from 'better-auth';
import { MongoClient } from 'mongodb';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { sendEmail } from '../services/mailer.js';
import { normalizeOrigin } from '../services/emailTemplates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Reuse the same Mongo database mongoose connects to (db name comes from the URI).
// The driver connects lazily on first query, so no await is needed here.
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dreamzdecors';
const client = new MongoClient(mongoUri);
const db = client.db();

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

// CLIENT_URL may list several origins (apex + www), comma-separated. Better Auth
// checks the request Origin against this list for CSRF protection on sign-in etc.
const clientUrls = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

function resolveResetUrl(rawUrl, request) {
  let targetOrigin = null;
  if (request) {
    const rawOrigin = request.headers?.get?.('origin') || request.headers?.get?.('referer') || request.headers?.origin || request.headers?.referer;
    targetOrigin = normalizeOrigin(rawOrigin);
  }

  // Check if rawUrl itself has a callbackURL or redirectTo query param
  if (!targetOrigin && rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const redirect = parsed.searchParams.get('redirectTo') || parsed.searchParams.get('callbackURL');
      if (redirect) {
        targetOrigin = normalizeOrigin(redirect);
      }
    } catch {}
  }

  // If in development and no live target was explicitly detected, keep on localhost
  if (!targetOrigin) {
    if (process.env.NODE_ENV !== 'production') {
      targetOrigin = 'http://localhost:5173';
    } else {
      targetOrigin = normalizeOrigin(process.env.LIVE_SITE_URL || 'https://www.dreamdecords.com');
    }
  }

  let safeUrl = rawUrl;
  if (targetOrigin && safeUrl) {
    try {
      const u = new URL(safeUrl);
      const target = new URL(targetOrigin);
      u.protocol = target.protocol;
      u.host = target.host;
      u.port = target.port;
      // If pointed to backend /api/auth/reset-password, rewrite to frontend /reset-password
      if (u.pathname.includes('/api/auth/reset-password')) {
        u.pathname = '/reset-password';
      }
      safeUrl = u.toString();
    } catch {}
  }
  return safeUrl;
}

function resetPasswordEmail(name, url) {
  return `<!doctype html>
<html><body style="margin:0;background:#f7f3ec;font-family:Helvetica,Arial,sans-serif;color:#161616;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e7e1d6;border-radius:16px;">
      <tr><td style="padding:28px 32px;border-bottom:1px solid #efe9df;font-size:18px;font-weight:700;letter-spacing:2px;">DREAMZDECORS</td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 14px;font-size:22px;color:#161616;">Reset your password</h1>
        <p style="font-size:14px;line-height:1.7;color:#5a5751;">Hi ${name || 'there'}, we received a request to reset your password. Click below to choose a new one. This link expires shortly.</p>
        <p style="margin-top:24px;">
          <a href="${url}" style="display:inline-block;background:#a17f37;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;padding:13px 30px;border-radius:999px;font-family:Helvetica,Arial,sans-serif;">Reset Password</a>
        </p>
        <p style="margin-top:22px;font-size:12px;color:#9a948a;">If you didn't request this, you can safely ignore this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db, { client }),
  trustedOrigins: clientUrls(),

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // update every 1 day on active use
  },

  // Let MongoDB generate native ObjectId _id so existing ObjectId relations
  // (Order.user, Notification.user, wishlist, …) keep working.
  advanced: {
    database: { generateId: false },
  },

  // Share the existing "users" collection and keep our custom fields on it.
  user: {
    modelName: 'users',
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'customer', input: false },
      phone: { type: 'string', required: false },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }, request) => {
      const safeUrl = resolveResetUrl(url, request);
      // Uses the central MAIL_FROM sender; never awaited (timing-attack safe).
      void sendEmail({
        to: user.email,
        subject: 'Reset your DreamzDecors password',
        text: `Hi ${user.name || 'there'},\n\nWe received a request to reset your password. Reset your password using the link below:\n${safeUrl}\n\nThis link expires shortly. If you didn't request this, you can safely ignore this email.`,
        html: resetPasswordEmail(user.name, safeUrl),
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  // Send the welcome notification/email when a new account is created
  // (covers both email/password and Google sign-up).
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const { notify } = await import('../services/notificationService.js');
            await notify({
              user: user.id,
              type: 'account_welcome',
              title: `Welcome to DreamzDecors, ${user.name || 'friend'}!`,
              message: 'Your account is ready. Explore the collection and enjoy a curated shopping experience.',
              link: '/shop',
              email: true,
              push: false,
            });
          } catch {
            /* never block sign-up on a notification failure */
          }
        },
      },
    },
  },
});
