import api from '@/lib/api';

// Web-push is only available over HTTPS (or localhost) with SW + Push support.
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function pushPermission() {
  return isPushSupported() ? Notification.permission : 'unsupported';
}

// VAPID public key is base64url — convert to the Uint8Array the API expects.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function registerServiceWorker() {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js');
  if (existing) return existing;
  return navigator.serviceWorker.register('/sw.js');
}

/**
 * Ask for permission, subscribe to push, and register the subscription
 * with the backend. Returns true on success.
 */
export async function enablePush() {
  if (!isPushSupported()) throw new Error('Push notifications are not supported in this browser.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  // Fetch the server's VAPID public key.
  const keyRes = await api.get('/notifications/vapid-public-key');
  const publicKey = keyRes.data?.publicKey;
  if (!publicKey) throw new Error('Push notifications are not configured on the server.');

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  // Reuse an existing subscription, or create a new one.
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await api.post('/notifications/subscribe', subscription.toJSON());
  return true;
}

/** Unsubscribe this browser from push and tell the backend to forget it. */
export async function disablePush() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {});
    await subscription.unsubscribe().catch(() => {});
  }
}

/** Whether this browser currently has an active push subscription. */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  const subscription = await registration?.pushManager.getSubscription();
  return Boolean(subscription);
}
