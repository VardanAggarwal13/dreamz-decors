import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

// Loads store-wide settings once on app start.
export function SettingsBootstrap() {
  const fetchSettings = useSettingsStore((s) => s.fetch);
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  return null;
}
