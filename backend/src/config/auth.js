import { betterAuth } from 'better-auth';
import { MongoClient } from 'mongodb';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { sendEmail } from '../services/mailer.js';

// Reuse the same Mongo database mongoose connects to (db name comes from the URI).
// The driver connects lazily on first query, so no await is needed here.
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

function resetPasswordEmail(name, url) {
  return `<!doctype html>
<html><body style="margin:0;background:#f7f3ec;font-family:Helvetica,Arial,sans-serif;color:#161616;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e7e1d6;border-radius:16px;">
      <tr><td style="padding:28px 32px;border-bottom:1px solid #efe9df;font-size:18px;font-weight:700;letter-spacing:2px;">DREAMZDECOR</td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 14px;font-size:22px;">Reset your password</h1>
        <p style="font-size:14px;line-height:1.7;color:#5a5751;">Hi ${name || 'there'}, we received a request to reset your password. Click below to choose a new one. This link expires shortly.</p>
        <p style="margin-top:22px;"><a href="${url}" style="display:inline-block;background:#c59e59;color:#fff;text-decoration:none;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:12px 26px;border-radius:999px;">Reset password</a></p>
        <p style="margin-top:20px;font-size:12px;color:#9a948a;">If you didn't request this, you can safely ignore this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db, { client }),
  trustedOrigins: [clientUrl()],

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
    sendResetPassword: async ({ user, url }) => {
      // Uses the central MAIL_FROM sender; never awaited (timing-attack safe).
      void sendEmail({
        to: user.email,
        subject: 'Reset your DreamzDecor password',
        text: `Reset your password: ${url}`,
        html: resetPasswordEmail(user.name, url),
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
              title: `Welcome to DreamzDecor, ${user.name || 'friend'}!`,
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
