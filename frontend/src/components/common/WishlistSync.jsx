import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { normalizeProduct } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Keeps the wishlist tied to the user account:
 *  - on sign-in: merge guest items into the account, then load the unified list
 *  - on sign-out: clear the local list
 */
export function WishlistSync() {
  const userId = useAuthStore((s) => s.user?.id);
  const prevUserId = useRef(userId);

  useEffect(() => {
    const had = prevUserId.current;
    prevUserId.current = userId;

    if (userId) {
      (async () => {
        const localIds = useWishlistStore.getState().items.map((p) => p.id).filter(Boolean);
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
    }
  }, [userId]);

  return null;
}
