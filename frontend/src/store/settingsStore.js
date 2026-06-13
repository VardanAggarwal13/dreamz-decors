import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

// Defaults so the UI renders correctly before/without a fetch.
export const DEFAULT_SETTINGS = {
  brand: {
    name: 'DreamzDecors',
    tagline: 'Creative Decors · Innovative Design',
    description:
      'Premium canvas paintings, gallery sets, and framed decor crafted in India with secure packaging and safe online checkout.',
  },
  contact: { email: 'support@dreamzdecor.com', phone: '', address: 'Made in India, delivering pan India', hours: 'Mon–Sat: 10:00 AM – 7:00 PM\nSunday: Closed' },
  social: { instagram: '', facebook: '', pinterest: '', youtube: '', whatsapp: '' },
  announcement: {
    enabled: true,
    messages: ['Free shipping on orders above ₹1,499', 'Handcrafted in India', 'Secure packaging guaranteed'],
  },
  shipping: { freeThreshold: 1499, flatRate: 99 },
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      loaded: false,

      fetch: async () => {
        try {
          const res = await api.get('/settings');
          set({ settings: { ...DEFAULT_SETTINGS, ...res.data }, loaded: true });
        } catch {
          set({ loaded: true });
        }
      },

      setSettings: (settings) => set({ settings }),
    }),
    {
      name: 'dreamzdecors-settings',
      // Persist only the settings payload — `loaded` always starts false so the
      // app still refetches fresh values on every load (silently, in place).
      partialize: (state) => ({ settings: state.settings }),
      // Keep defaults as the floor so a newly-added settings key is never
      // missing while the cached (older) payload rehydrates before the refetch.
      merge: (persisted, current) => ({
        ...current,
        settings: { ...DEFAULT_SETTINGS, ...(persisted?.settings || {}) },
      }),
    }
  )
);
