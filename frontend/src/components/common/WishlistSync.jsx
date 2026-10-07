import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { normalizeProduct } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Keeps the wishlist strictly tied to the user account:
 *  - on sign-in: merge genuine guest items into the account, then load the user's list from MongoDB
 *  - on user switch: immediately clear memory and load the new user's list (never merge previous user's items)
 *  - on sign-out: clear the list and storage
 */
export function WishlistSync() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const userId = user?.id || user?._id || null;
  const prevUserId = useRef(undefined);

  useEffect(() => {
    if (status === 'loading') return;

    const had = prevUserId.current;
    prevUserId.current = userId;

    if (had === undefined) {
      // First mount
      if (userId) {
        (async () => {
          try {
            const res = await api.get('/wishlist');
            useWishlistStore.getState().setItems((res.data || []).map(normalizeProduct));
          } catch {}
        })();
      }
      return;
    }

    if (userId) {
      // If switched accounts directly, clear old items first so they are never merged
      if (had && had !== userId) {
        useWishlistStore.getState().setItems([]);
      }

      (async () => {
        // Only merge if transitioning from unauthenticated guest state
        const isGuestToUser = !had;
        const localIds = isGuestToUser
          ? useWishlistStore.getState().items.map((p) => p.id).filter(Boolean)
          : [];

        try {
          const res = localIds.length
            ? await api.post('/wishlist/merge', { productIds: localIds })
            : await api.get('/wishlist');
          useWishlistStore.getState().setItems((res.data || []).map(normalizeProduct));
        } catch {
          /* keep local list if the sync fails */
        }
      })();
    } else if (had && !userId) {
      useWishlistStore.getState().setItems([]);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('dreamzdecors-wishlist');
        } catch {}
      }
    }
  }, [userId, status]);

  return null;
}
