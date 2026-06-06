import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

let configured = false;
let warned = false;

// Configure web-push with VAPID keys from env (once).
function ensureConfigured() {
  if (configured) return true;

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    if (!warned) {
      console.warn(
        '✦ Web-push disabled — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to enable push notifications.'
      );
      warned = true;
    }
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:support@dreamzdecor.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export function isPushEnabled() {
  return ensureConfigured();
}

/**
 * Send a push payload to every subscription a user has registered.
 * Prunes subscriptions that the browser has expired (404/410).
 * Returns the number of successful deliveries.
 */
export async function sendPushToUser(userId, payload) {
  if (!ensureConfigured() || !userId) return 0;

  const subs = await PushSubscription.find({ user: userId }).lean();
  if (!subs.length) return 0;

  const body = JSON.stringify(payload);
  let delivered = 0;
  const staleIds = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body
        );
        delivered += 1;
      } catch (err) {
        // 404/410 mean the subscription is gone — remove it.
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(sub._id);
        } else {
          console.error('Push send failed:', err.statusCode || err.message);
        }
      }
    })
  );

  if (staleIds.length) {
    await PushSubscription.deleteMany({ _id: { $in: staleIds } });
  }

  return delivered;
}
