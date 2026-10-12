import { create } from 'zustand';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

// Transforms backend cart item to frontend item structure
export function transformBackendCartItem(backendItem) {
  const p = backendItem.product || {};
  const resolvedImage =
    (typeof p.image === 'string' && p.image) ||
    p.images?.[0]?.url ||
    (typeof p.images?.[0] === 'string' && p.images[0]) ||
    (typeof p.image === 'object' && (p.image?.url || p.image?.secure_url)) ||
    '';
  const options = backendItem.options || {};
  const id = String(p._id || p.id || backendItem.product || '');
  const slug = p.slug || '';
  const key = `${id || slug}-${JSON.stringify(options)}`;
  return {
    key,
    id,
    slug,
    title: p.title || '',
    description: p.description || '',
    price: Number(p.price != null ? p.price : backendItem.priceAtAdd || 0),
    image: resolvedImage,
    category: p.categoryTitle || p.category || '',
    options,
    qty: Math.max(1, Number(backendItem.qty || 1)),
    stock: p.stock != null ? Number(p.stock) : Infinity,
    itemId: String(backendItem._id || ''),
  };
}

export const getUserId = () => {
  const u = useAuthStore.getState().user;
  if (u?.id || u?._id) return String(u.id || u._id);
  if (typeof window !== 'undefined') {
    const last = localStorage.getItem('dd:last_user_id');
    if (last) return last;
  }
  return null;
};

export const getCartStorageKey = (userId) => (userId ? `dd:cart:${userId}` : 'dd:cart:guest');

export const loadCartFromStorage = (userId) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getCartStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const id = String(item.id || item._id || item.productId || '');
        const slug = item.slug || '';
        const options = item.options || {};
        const key = item.key || `${id || slug}-${JSON.stringify(options)}`;
        return {
          ...item,
          id,
          slug,
          key,
          qty: Math.max(1, Number(item.qty || 1)),
        };
      })
      .filter((i) => i.id || i.slug);
  } catch {
    return [];
  }
};

export const saveCartToStorage = (userId, items) => {
  if (typeof window === 'undefined') return;
  try {
    const safeItems = Array.isArray(items) ? items : [];
    localStorage.setItem(getCartStorageKey(userId), JSON.stringify(safeItems));
    if (userId) {
      localStorage.setItem('dd:last_user_id', String(userId));
    }
  } catch {}
};

// Immediate synchronous hydration on store initialization
export const getInitialCartItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    const lastUser = localStorage.getItem('dd:last_user_id');
    if (lastUser) {
      const userItems = loadCartFromStorage(lastUser);
      if (userItems.length > 0) return userItems;
    }
    const guestItems = loadCartFromStorage(null);
    if (guestItems.length > 0) return guestItems;

    const legacy = localStorage.getItem('dreamzdecors-cart');
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
};

let syncTimer = null;
const syncWithServer = (items) => {
  const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
  if (!userId) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      await api.put('/cart', {
        items: items.map((i) => ({
          productId: i.id || i._id || i.productId,
          qty: i.qty,
          options: i.options || {},
        })),
      });
    } catch {
      /* network or server error — local state retained */
    }
  }, 250);
};

const initialItems = getInitialCartItems();

export const useCartStore = create((set, get) => ({
  items: initialItems,
  lastAddedItem: null,
  loading: false,
  loaded: initialItems.length > 0,

  clearLastAdded: () => set({ lastAddedItem: null }),

  setCartItems: (items) => {
    const userId = getUserId();
    const safeItems = Array.isArray(items) ? items : [];
    set({ items: safeItems, loaded: true, loading: false });
    saveCartToStorage(userId, safeItems);
  },

  fetchCart: async (targetUserId) => {
    const userId = targetUserId || getUserId();
    if (!userId) {
      const guestItems = loadCartFromStorage(null);
      set({ items: guestItems, loading: false, loaded: true });
      return guestItems;
    }

    set({ loading: true });
    try {
      const res = await api.get('/cart');
      const serverItems = res.data?.data?.items || [];
      const transformed = serverItems
        .filter((i) => Boolean(i.product && i.product.isActive !== false))
        .map(transformBackendCartItem);

      if (transformed.length === 0) {
        // If server cart is empty, check if we have local items that need to be synced
        const cached = loadCartFromStorage(userId);
        if (cached.length > 0) {
          api.put('/cart', {
            items: cached.map((i) => ({
              productId: i.id || i._id || i.productId,
              qty: i.qty,
              options: i.options || {},
            })),
          }).catch(() => {});
          set({ items: cached, loading: false, loaded: true });
          return cached;
        }
      }

      set({ items: transformed, loading: false, loaded: true });
      saveCartToStorage(userId, transformed);
      return transformed;
    } catch {
      const cached = loadCartFromStorage(userId);
      set({ items: cached, loading: false, loaded: true });
      return cached;
    }
  },

  resetCart: () => {
    if (syncTimer) clearTimeout(syncTimer);
    set({ items: [], lastAddedItem: null, loaded: false, loading: false });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('dd:cart:guest');
        localStorage.removeItem('dreamzdecors-cart');
      } catch {}
    }
  },

  addItem: (product, qty = 1, options = {}) => {
    const stockLimit = product.stock != null ? Number(product.stock) : Infinity;
    if (stockLimit <= 0) {
      toast.error('This item is currently out of stock');
      return;
    }

    const productId = String(product.id || product._id || '');
    const productSlug = product.slug || '';
    if (!productId && !productSlug) return;

    const resolvedImage =
      (typeof product.image === 'string' && product.image) ||
      product.images?.[0]?.url ||
      (typeof product.images?.[0] === 'string' && product.images[0]) ||
      (typeof product.image === 'object' && (product.image?.url || product.image?.secure_url)) ||
      '';

    let addedAmount = qty;
    let blocked = false;
    let nextItems = [];

    set((state) => {
      const key = `${productId || productSlug}-${JSON.stringify(options)}`;
      const existing = state.items.find((i) => i.key === key);

      if (existing) {
        const currentQty = existing.qty;
        if (currentQty >= stockLimit) {
          blocked = true;
          return state;
        }
        const nextQty = Math.min(stockLimit, currentQty + qty);
        addedAmount = nextQty - currentQty;
        nextItems = state.items.map((i) =>
          i.key === key ? { ...i, id: productId || i.id, qty: nextQty, stock: stockLimit } : i
        );
        return {
          items: nextItems,
          loaded: true,
          lastAddedItem: {
            id: productId || productSlug,
            slug: productSlug,
            title: product.title,
            price: product.price,
            image: resolvedImage || existing.image,
            qty: addedAmount,
            timestamp: Date.now(),
          },
        };
      }

      const initialQty = Math.min(stockLimit, qty);
      addedAmount = initialQty;
      nextItems = [
        ...state.items,
        {
          key,
          id: productId,
          slug: productSlug,
          title: product.title,
          description: product.description || '',
          price: product.price,
          image: resolvedImage,
          category: product.categoryTitle || product.category || '',
          options,
          qty: initialQty,
          stock: stockLimit,
        },
      ];
      return {
        items: nextItems,
        loaded: true,
        lastAddedItem: {
          id: productId || productSlug,
          slug: productSlug,
          title: product.title,
          price: product.price,
          image: resolvedImage,
          qty: initialQty,
          timestamp: Date.now(),
        },
      };
    });

    if (blocked) {
      toast.error(`Maximum available stock (${stockLimit}) is already in your cart`);
      return;
    }

    if (addedAmount < qty) {
      toast.info(`Only ${stockLimit} items available in stock. Added remaining ${addedAmount} to cart.`);
    } else {
      if (typeof window === 'undefined' || window.innerWidth >= 1024) {
        toast.success(`Added ${addedAmount} × ${product.title} to cart`);
      }
    }

    const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
    saveCartToStorage(userId, nextItems);
    syncWithServer(nextItems);
  },

  updateQty: (key, qty) => {
    let nextItems = [];
    set((state) => {
      const item = state.items.find((i) => i.key === key);
      if (!item) return state;

      const requestedQty = Number(qty);
      if (requestedQty <= 0) {
        nextItems = state.items.filter((i) => i.key !== key);
        return { items: nextItems, loaded: true };
      }

      const stockLimit = item.stock != null ? Number(item.stock) : Infinity;
      if (requestedQty > stockLimit) {
        toast.error(`Only ${stockLimit} unit${stockLimit === 1 ? '' : 's'} available in stock`);
        nextItems = state.items.map((i) =>
          i.key === key ? { ...i, qty: stockLimit } : i
        );
        return { items: nextItems, loaded: true };
      }

      nextItems = state.items.map((i) =>
        i.key === key ? { ...i, qty: requestedQty } : i
      );
      return { items: nextItems, loaded: true };
    });

    const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
    saveCartToStorage(userId, nextItems);
    syncWithServer(nextItems);
  },

  patchItem: (key, patch) => {
    let nextItems = [];
    set((state) => {
      nextItems = state.items.map((i) => (i.key === key ? { ...i, ...patch } : i));
      return { items: nextItems, loaded: true };
    });
    const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
    saveCartToStorage(userId, nextItems);
  },

  removeItem: (key) => {
    let nextItems = [];
    set((state) => {
      nextItems = state.items.filter((i) => i.key !== key);
      return { items: nextItems, loaded: true };
    });
    const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
    saveCartToStorage(userId, nextItems);
    syncWithServer(nextItems);
  },

  clear: () => {
    if (syncTimer) clearTimeout(syncTimer);
    const userId = useAuthStore.getState().user?.id || useAuthStore.getState().user?._id;
    set({ items: [], lastAddedItem: null, loaded: true });
    saveCartToStorage(userId, []);
    if (userId) {
      api.delete('/cart').catch(() => {});
    }
  },

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));
