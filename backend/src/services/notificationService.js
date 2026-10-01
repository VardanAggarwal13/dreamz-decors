import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../config/socket.js';
import { sendEmail } from './mailer.js';
import { buildEmail } from './emailTemplates.js';
import { sendPushToUser } from './webpush.js';

/**
 * Central notification dispatcher.
 *
 * Always persists an in-app notification and emits it over Socket.IO in
 * real time. Optionally also sends an email and/or a web-push, based on the
 * flags passed in. Each channel fails independently and never throws — a
 * dead SMTP server must never block an order from being created.
 *
 * @param {Object}  opts
 * @param {String}  opts.user      User id to notify (required)
 * @param {String}  opts.type      Notification type (see Notification model)
 * @param {String}  opts.title     Short title
 * @param {String}  opts.message   Body text
 * @param {Object}  [opts.data]    Arbitrary context (e.g. { orderId })
 * @param {String}  [opts.link]    In-app relative link (e.g. /account/orders/<id>)
 * @param {Boolean} [opts.email]   Also send email (default false)
 * @param {Boolean} [opts.push]    Also send web-push (default true)
 * @param {Object}  [opts.emailContext] Extra data for the email template (e.g. { order })
 * @returns {Promise<Notification|null>}
 */
export async function notify({
  user,
  type = 'generic',
  title,
  message,
  data = {},
  link,
  email = false,
  push = true,
  emailContext = {},
}) {
  if (!user || !title || !message) return null;

  // Sanitize link to always be relative for in-app / push channels
  let cleanLink = link;
  if (cleanLink && typeof cleanLink === 'string' && cleanLink.startsWith('http')) {
    try {
      const u = new URL(cleanLink);
      cleanLink = u.pathname + u.search + u.hash;
    } catch {}
  }

  // 1) Persist the in-app notification.
  const doc = await Notification.create({
    user,
    type,
    title,
    message,
    data,
    link: cleanLink,
    channels: { inApp: true, email: false, push: false },
  });

  // 2) Real-time: emit to the user's socket room.
  emitToUser(user, 'notification:new', serialize(doc));

  // 3) Email + push run in the background; we don't block the caller's
  //    response on them, but we do record which succeeded.
  dispatchExternal(doc, { user, type, title, message, link: cleanLink, email, push, emailContext }).catch(
    (err) => console.error('Notification external dispatch error:', err.message)
  );

  return doc;
}

async function dispatchExternal(doc, { user, type, title, message, link, email, push, emailContext }) {
  const tasks = [];
  const userId = user?._id || user;

  if (email) {
    tasks.push(
      (async () => {
        const account = userId ? await User.findById(userId).select('name email').lean() : null;
        const recipientEmail =
          account?.email ||
          emailContext?.email ||
          emailContext?.order?.guestEmail ||
          emailContext?.order?.shippingAddress?.email;

        if (!recipientEmail) return;

        const recipientName =
          account?.name ||
          emailContext?.customerName ||
          emailContext?.name ||
          emailContext?.order?.shippingAddress?.name ||
          'there';

        const { subject, html } = buildEmail(type, {
          name: recipientName,
          title,
          message,
          link,
          ...emailContext,
        });
        const sentEmail = await sendEmail({ to: recipientEmail, subject, html, text: message });
        if (sentEmail) {
          doc.channels.email = true;
          doc.markModified('channels');
          console.log(`✉️ [email] Sent "${subject}" to ${recipientEmail}`);
        } else {
          console.warn(`⚠️ [email] Failed sending "${subject}" to ${recipientEmail}`);
        }
      })()
    );
  }

  if (push) {
    tasks.push(
      (async () => {
        const delivered = await sendPushToUser(userId, {
          title,
          body: message,
          data: { link: link || '/account', ...doc.data },
        });
        if (delivered > 0) {
          doc.channels.push = true;
          doc.markModified('channels');
        }
      })()
    );
  }

  await Promise.allSettled(tasks);
  // Save the channel delivery flags (best-effort).
  if (doc.isModified('channels') || doc.isModified('channels.email') || doc.isModified('channels.push')) {
    await doc.save().catch(() => {});
  }
}

/**
 * Notify EVERY admin user — operational alerts (new order, payment received).
 * Each admin gets an in-app bell notification and, by default, an email.
 * Push defaults OFF (admins work at the dashboard). Never throws.
 *
 * @param {Object} opts  Same shape as notify(), minus `user`.
 * @returns {Promise<number>}  How many admins were notified.
 */
export async function notifyAdmins({
  type = 'generic',
  title,
  message,
  data = {},
  link = '/admin/orders',
  email = true,
  push = false,
  emailContext = {},
}) {
  if (!title || !message) return 0;
  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  await Promise.allSettled(
    admins.map((a) => notify({ user: a._id, type, title, message, data, link, email, push, emailContext }))
  );
  return admins.length;
}

// Shape sent to the frontend over sockets / REST.
export function serialize(doc) {
  return {
    _id: doc._id,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    data: doc.data,
    link: doc.link,
    read: doc.read,
    createdAt: doc.createdAt,
  };
}
