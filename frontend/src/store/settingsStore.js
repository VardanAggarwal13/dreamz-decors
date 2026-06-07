import { create } from 'zustand';
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

export const useSettingsStore = create((set) => ({
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
}));
