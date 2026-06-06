import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// A logged-in user's wishlist lives on their account; guests use the browser.
const isAuthed = () => Boolean(useAuthStore.getState().user);

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      // Replace the whole list (used by the login/logout sync).
      setItems: (items) => set({ items: items.filter(Boolean) }),

      // Add if missing, remove if present. Stores the full (normalized) product.
      toggle: (product) => {
        const exists = get().items.some((p) => p.id === product.id);
        if (exists) {
          set((s) => ({ items: s.items.filter((p) => p.id !== product.id) }));
          toast('Removed from wishlist', { description: product.title });
          if (isAuthed()) api.delete(`/wishlist/${product.id}`).catch(() => {});
        } else {
          set((s) => ({ items: [...s.items, product] }));
          toast.success('Added to wishlist', { description: product.title });
          if (isAuthed()) api.post('/wishlist', { productId: product.id }).catch(() => {});
        }
      },

      remove: (id) => {
        set((s) => ({ items: s.items.filter((p) => p.id !== id) }));
        if (isAuthed()) api.delete(`/wishlist/${id}`).catch(() => {});
      },

      clear: () => {
        set({ items: [] });
        if (isAuthed()) api.delete('/wishlist').catch(() => {});
      },
    }),
    { name: 'dreamzdecors-wishlist' }
  )
);
