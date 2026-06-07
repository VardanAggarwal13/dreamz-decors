import { create } from 'zustand';

// Lightweight global prompt used by gated actions (e.g. wishlist) to ask
// a guest to sign in, without redirecting them away from the page.
export const useAuthPrompt = create((set) => ({
  open: false,
  message: 'Please sign in to continue.',
  show: (message = 'Please sign in to continue.') => set({ open: true, message }),
  hide: () => set({ open: false }),
}));
