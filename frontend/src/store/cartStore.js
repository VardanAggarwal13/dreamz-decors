import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1, options = {}) => {
        const stockLimit = product.stock != null ? Number(product.stock) : Infinity;
        if (stockLimit <= 0) {
          toast.error('This item is currently out of stock');
          return;
        }

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
                image: product.image,
                category: product.categoryTitle || product.category || '',
                options,
                qty: initialQty,
                stock: stockLimit,
              },
            ],
          };
        });

        if (blocked) {
          toast.error(`Maximum available stock (${stockLimit}) is already in your cart`);
        } else if (addedAmount < qty) {
          toast.info(`Only ${stockLimit} items available in stock. Added remaining ${addedAmount} to cart.`);
        } else {
          toast.success(`Added ${addedAmount} × ${product.title} to cart`);
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
    { name: 'dreamzdecors-cart' }
  )
);
