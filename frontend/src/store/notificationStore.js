import { create } from 'zustand';
import api from '@/lib/api';

export const useNotificationStore = create((set, get) => ({
  items: [],
  unread: 0,
  loading: false,
  loaded: false,

  // Fetch the latest notifications + unread count from the API.
  fetch: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/notifications');
      set({
        items: res.data || [],
        unread: res.unread ?? 0,
        loading: false,
        loaded: true,
      });
    } catch {
      set({ loading: false });
    }
  },

  // Called by the socket listener when a new notification arrives in real time.
  pushIncoming: (notif) =>
    set((state) => {
      // Avoid duplicates if the same id somehow arrives twice.
      if (state.items.some((n) => n._id === notif._id)) return state;
      return {
        items: [notif, ...state.items].slice(0, 50),
        unread: state.unread + 1,
      };
    }),

  markRead: async (id) => {
    const target = get().items.find((n) => n._id === id);
    if (!target || target.read) return;
    // Optimistic update.
    set((state) => ({
      items: state.items.map((n) => (n._id === id ? { ...n, read: true } : n)),
      unread: Math.max(0, state.unread - 1),
    }));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      get().fetch(); // reconcile on failure
    }
  },

  markAllRead: async () => {
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
      unread: 0,
    }));
    try {
      await api.patch('/notifications/read-all');
    } catch {
      get().fetch();
    }
  },

  remove: async (id) => {
    const target = get().items.find((n) => n._id === id);
    set((state) => ({
      items: state.items.filter((n) => n._id !== id),
      unread: target && !target.read ? Math.max(0, state.unread - 1) : state.unread,
    }));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      get().fetch();
    }
  },

  reset: () => set({ items: [], unread: 0, loaded: false }),
}));
