/* DreamzDecor service worker — handles Web-Push notifications. */

// Show a notification when a push arrives (works even when the site is closed).
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'DreamzDecor', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'DreamzDecor';
  const options = {
    body: payload.body || '',
    icon: '/icons/notification-icon.png',
    badge: '/icons/notification-badge.png',
    data: payload.data || {},
    tag: payload.data?.orderId ? `order-${payload.data.orderId}` : undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Focus an existing tab (or open one) at the notification's link when clicked.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/account';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(link);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(link);
    })
  );
});

// Activate immediately on update.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
