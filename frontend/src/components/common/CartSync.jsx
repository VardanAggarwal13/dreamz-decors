import { useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore, loadCartFromStorage } from '@/store/cartStore';

/**
 * Keeps the cart strictly corresponding to the user account:
 *  - On sign-in / registration: merges genuine guest cart (if any), then fetches user's cart from MongoDB
 *  - On account switch: immediately resets in-memory cart, fetches the new user's MongoDB cart
 *  - On sign-out: immediately clears cart from memory and storage so no items leak to the next user
 */
export function CartSync() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const userId = user?.id || user?._id || null;
  const prevUserId = useRef(undefined);

  useEffect(() => {
    // Wait until auth status has initialized from loading
    if (status === 'loading') return;

    const prev = prevUserId.current;
    prevUserId.current = userId;

    const mergeAndFetch = async (uid) => {
      const guestItems = loadCartFromStorage(null);
      if (guestItems.length > 0) {
        try {
          await api.post('/cart/merge', {
            items: guestItems.map((i) => ({ productId: i.id, qty: i.qty, options: i.options })),
          });
        } catch {
          // If merge fails, continue to fetch user's account cart
        } finally {
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('dd:cart:guest');
              localStorage.removeItem('dreamzdecors-cart');
            } catch {}
          }
        }
      }
      await useCartStore.getState().fetchCart(uid);
    };

    if (prev === undefined) {
      // First mount after session resolved
      if (userId) {
        mergeAndFetch(userId);
      } else {
        // Guest user on initial page load
        const guestItems = loadCartFromStorage(null);
        useCartStore.getState().setCartItems(guestItems);
      }
      return;
    }

    if (userId && !prev) {
      // Transition from Guest -> Logged In (Sign In or Sign Up)
      mergeAndFetch(userId);
    } else if (userId && prev && prev !== userId) {
      // Switched from User A -> User B directly
      useCartStore.getState().resetCart();
      useCartStore.getState().fetchCart(userId);
    } else if (!userId && prev) {
      // Transition from Logged In -> Logged Out
      useCartStore.getState().resetCart();
    }
  }, [userId, status]);

  return null;
}

export default CartSync;
