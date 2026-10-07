import { create } from 'zustand';
import { toast } from 'sonner';
import { authClient } from '@/lib/authClient';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useNotificationStore } from '@/store/notificationStore';
import { disconnectSocket } from '@/lib/socket';

// Auth is session-cookie based (Better Auth). This store mirrors the
// current session for components; AuthBootstrap keeps it in sync.
export const useAuthStore = create((set) => ({
  user: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'

  setSession: (user) =>
    set({ user: user || null, status: user ? 'authenticated' : 'unauthenticated' }),

  logout: async () => {
    try {
      await authClient.signOut();
    } catch {
      /* ignore */
    }

    // Immediately purge all stores and disconnect real-time socket
    try {
      useCartStore.getState().resetCart();
    } catch {}

    try {
      useWishlistStore.getState().setItems([]);
    } catch {}

    try {
      useNotificationStore.getState().reset();
    } catch {}

    try {
      disconnectSocket();
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('dreamzdecors-cart');
        localStorage.removeItem('dreamzdecors-wishlist');
        localStorage.removeItem('dd:cart:guest');
      } catch {}
    }

    set({ user: null, status: 'unauthenticated' });
    toast.success('Logged out');
  },
}));
