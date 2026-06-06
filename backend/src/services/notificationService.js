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

  // 1) Persist the in-app notification.
  const doc = await Notification.create({
    user,
    type,
    title,
    message,
    data,
    link,
    channels: { inApp: true, email: false, push: false },
  });

  // 2) Real-time: emit to the user's socket room.
  emitToUser(user, 'notification:new', serialize(doc));

  // 3) Email + push run in the background; we don't block the caller's
  //    response on them, but we do record which succeeded.
  dispatchExternal(doc, { user, type, title, message, link, email, push, emailContext }).catch(
    (err) => console.error('Notification external dispatch error:', err.message)
  );

  return doc;
}

async function dispatchExternal(doc, { user, type, title, message, link, email, push, emailContext }) {
  const tasks = [];

  if (email) {
    tasks.push(
      (async () => {
        const account = await User.findById(user).select('name email').lean();
        if (!account?.email) return;
        const { subject, html } = buildEmail(type, {
          name: account.name,
          title,
          message,
          link,
          ...emailContext,
        });
        const sentEmail = await sendEmail({ to: account.email, subject, html, text: message });
        if (sentEmail) doc.channels.email = true;
      })()
    );
  }

  if (push) {
    tasks.push(
      (async () => {
        const delivered = await sendPushToUser(user, {
          title,
          body: message,
          data: { link: link || '/account', ...doc.data },
        });
        if (delivered > 0) doc.channels.push = true;
      })()
    );
  }

  await Promise.allSettled(tasks);
  // Save the channel delivery flags (best-effort).
  if (doc.isModified('channels')) await doc.save().catch(() => {});
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
