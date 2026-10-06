import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

// Defaults so the UI renders correctly before/without a fetch.
export const DEFAULT_SETTINGS = {
  brand: {
    name: 'DreamzDecors',
    tagline: 'Creative Decors · Innovative Design',
    description:
      'Handcrafted canvas printing, gallery sets, and spiritual art designed to bring warmth, soul, and quiet luxury to modern Indian homes.',
  },
  contact: { email: 'dreamzdecor30@gmail.com', phone: '+91 82848 65051', address: 'Made in India, delivering pan India', hours: 'Mon–Sat: 10:00 AM – 7:00 PM\nSunday: Closed' },
  social: { instagram: '', facebook: '', pinterest: '', youtube: '', whatsapp: 'https://wa.me/918284865051' },
  announcement: {
    enabled: true,
    messages: ['Insured Pan-India Delivery', 'Handcrafted in India', 'Secure packaging guaranteed'],
  },
  shipping: { freeThreshold: 0, flatRate: 0 },
};

export const sanitizeContact = (contact = {}) => {
  const email =
    !contact?.email || contact.email.toLowerCase().includes('support@dreamzdecor.com')
      ? 'dreamzdecor30@gmail.com'
      : contact.email;
  const phone = !contact?.phone || !contact.phone.trim() ? '+91 82848 65051' : contact.phone;
  return {
    ...DEFAULT_SETTINGS.contact,
    ...contact,
    email,
    phone,
  };
};

export const sanitizeSettings = (raw = {}) => {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  const contact = sanitizeContact(raw.contact);
  const social = {
    ...DEFAULT_SETTINGS.social,
    ...(raw.social || {}),
    whatsapp:
      !raw.social?.whatsapp || raw.social.whatsapp.includes('1234567890')
        ? 'https://wa.me/918284865051'
        : raw.social.whatsapp,
  };
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    contact,
    social,
  };
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      loaded: false,

      fetch: async () => {
        try {
          const res = await api.get('/settings');
          const payload = res?.data || res;
          set({ settings: sanitizeSettings(payload), loaded: true });
        } catch {
          set({ loaded: true });
        }
      },

      setSettings: (settings) => set({ settings: sanitizeSettings(settings) }),
    }),
    {
      name: 'dreamzdecors-settings-v3',
      // Persist only the settings payload — `loaded` always starts false so the
      // app still refetches fresh values on every load (silently, in place).
      partialize: (state) => ({ settings: state.settings }),
      // Keep defaults as the floor so a newly-added settings key is never
      // missing while the cached (older) payload rehydrates before the refetch.
      merge: (persisted, current) => {
        const persistedDesc = persisted?.settings?.brand?.description;
        const isOldDefault = !persistedDesc || persistedDesc.includes('secure packaging and safe online checkout');
        const sanitized = sanitizeSettings(persisted?.settings || {});
        return {
          ...current,
          settings: {
            ...sanitized,
            brand: {
              ...sanitized.brand,
              description: isOldDefault ? DEFAULT_SETTINGS.brand.description : persistedDesc,
            },
          },
        };
      },
    }
  )
);
