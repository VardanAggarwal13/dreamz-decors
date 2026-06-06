import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

/**
 * Keeps notifications in sync with the session:
 *  - signed in: fetch history, open the real-time socket, listen for new ones
 *  - signed out: disconnect and clear the store
 */
export function NotificationBootstrap() {
  const userId = useAuthStore((s) => s.user?.id);
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const pushIncoming = useNotificationStore((s) => s.pushIncoming);
  const reset = useNotificationStore((s) => s.reset);

  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      reset();
      return;
    }

    fetchNotifications();
    const socket = connectSocket();
    if (!socket) return;

    const handler = (notif) => pushIncoming(notif);
    socket.on('notification:new', handler);

    return () => {
      socket.off('notification:new', handler);
    };
  }, [userId, fetchNotifications, pushIncoming, reset]);

  return null;
}
