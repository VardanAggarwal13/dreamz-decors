import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      lastAddedItem: null,
      clearLastAdded: () => set({ lastAddedItem: null }),
      addItem: (product, qty = 1, options = {}) => {
        const stockLimit = product.stock != null ? Number(product.stock) : Infinity;
        if (stockLimit <= 0) {
          toast.error('This item is currently out of stock');
          return;
        }

        const resolvedImage =
          (typeof product.image === 'string' && product.image) ||
          product.images?.[0]?.url ||
          (typeof product.images?.[0] === 'string' && product.images[0]) ||
          (typeof product.image === 'object' && (product.image?.url || product.image?.secure_url)) ||
          '';

        let addedAmount = qty;
        let blocked = false;

        set((state) => {
          const key = `${product.id || product.slug}-${JSON.stringify(options)}`;
          const existing = state.items.find((i) => i.key === key);

          if (existing) {
            const currentQty = existing.qty;
            if (currentQty >= stockLimit) {
              blocked = true;
              return state;
            }
            const nextQty = Math.min(stockLimit, currentQty + qty);
            addedAmount = nextQty - currentQty;
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: nextQty, stock: stockLimit } : i
              ),
              lastAddedItem: {
                id: product.id || product.slug,
                slug: product.slug,
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
          return {
            items: [
              ...state.items,
              {
                key,
                id: product.id,
                slug: product.slug,
                title: product.title,
                description: product.description || '',
                price: product.price,
                image: resolvedImage,
                category: product.categoryTitle || product.category || '',
                options,
                qty: initialQty,
                stock: stockLimit,
              },
            ],
            lastAddedItem: {
              id: product.id || product.slug,
              slug: product.slug,
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
        } else if (addedAmount < qty) {
          toast.info(`Only ${stockLimit} items available in stock. Added remaining ${addedAmount} to cart.`);
        } else {
          // On desktop (>= 1024px), show toast notification.
          // On mobile (< 1024px), the rich sticky MobileCartToast with View Cart option handles it.
          if (typeof window === 'undefined' || window.innerWidth >= 1024) {
            toast.success(`Added ${addedAmount} × ${product.title} to cart`);
          }
        }
      },
      updateQty: (key, qty) =>
        set((state) => {
          const item = state.items.find((i) => i.key === key);
          if (!item) return state;

          const requestedQty = Number(qty);
          if (requestedQty <= 0) {
            return { items: state.items.filter((i) => i.key !== key) };
          }

          const stockLimit = item.stock != null ? Number(item.stock) : Infinity;
          if (requestedQty > stockLimit) {
            toast.error(`Only ${stockLimit} unit${stockLimit === 1 ? '' : 's'} available in stock`);
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: stockLimit } : i
              ),
            };
          }

          return {
            items: state.items.map((i) =>
              i.key === key ? { ...i, qty: requestedQty } : i
            ),
          };
        }),
      patchItem: (key, patch) =>
        set((state) => ({
          items: state.items.map((i) => (i.key === key ? { ...i, ...patch } : i)),
        })),
      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: 'dreamzdecors-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
