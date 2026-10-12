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
        const prodId = String(product.id || product._id || '');
        if (!prodId) return;
        const normalized = { ...product, id: prodId };
        const exists = get().items.some((p) => String(p.id || p._id) === prodId);
        if (exists) {
          set((s) => ({ items: s.items.filter((p) => String(p.id || p._id) !== prodId) }));
          toast('Removed from wishlist', { description: product.title });
          if (isAuthed()) api.delete(`/wishlist/${prodId}`).catch(() => {});
        } else {
          set((s) => ({ items: [...s.items, normalized] }));
          toast.success('Added to wishlist', { description: product.title });
          if (isAuthed()) api.post('/wishlist', { productId: prodId }).catch(() => {});
        }
      },

      remove: (id) => {
        const targetId = String(id);
        set((s) => ({ items: s.items.filter((p) => String(p.id || p._id) !== targetId) }));
        if (isAuthed()) api.delete(`/wishlist/${targetId}`).catch(() => {});
      },

      clear: () => {
        set({ items: [] });
        if (isAuthed()) api.delete('/wishlist').catch(() => {});
      },
    }),
    { name: 'dreamzdecors-wishlist' }
  )
);
