import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, qty = 1, options = {}) =>
        set((state) => {
          const key = `${product.id}-${JSON.stringify(options)}`;
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                key,
                id: product.id,
                slug: product.slug,
                title: product.title,
                price: product.price,
                image: product.image,
                options,
                qty,
              },
            ],
          };
        }),
      updateQty: (key, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.key === key ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
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
