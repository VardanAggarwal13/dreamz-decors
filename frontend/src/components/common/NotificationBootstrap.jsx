import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket } from '@/lib/socket';

/**
 * Keeps notifications strictly isolated per user account:
 *  - signed in: disconnect any stale socket, reset store, fetch history from MongoDB for current user, open real-time socket
 *  - signed out: disconnect and clear the store
 */
export function NotificationBootstrap() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const userId = user?.id || user?._id || null;
  const prevUserId = useRef(undefined);
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const pushIncoming = useNotificationStore((s) => s.pushIncoming);
  const reset = useNotificationStore((s) => s.reset);

  useEffect(() => {
    if (status === 'loading') return;

    const had = prevUserId.current;
    prevUserId.current = userId;

    if (!userId) {
      disconnectSocket();
      reset();
      return;
    }

    // If user changed (e.g. from user A to user B), disconnect old socket and reset state
    if (had && had !== userId) {
      disconnectSocket();
      reset();
    }

    fetchNotifications();
    const socket = connectSocket();
    if (!socket) return;

    const handler = (notif) => pushIncoming(notif);
    socket.on('notification:new', handler);

    return () => {
      socket.off('notification:new', handler);
    };
  }, [userId, status, fetchNotifications, pushIncoming, reset]);

  return null;
}
