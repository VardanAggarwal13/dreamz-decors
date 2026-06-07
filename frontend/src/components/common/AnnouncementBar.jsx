import { useSettingsStore } from '@/store/settingsStore';

const Dot = () => (
  <span className="mx-4 inline-block h-1 w-1 shrink-0 rounded-full bg-gold/40 align-middle" />
);

export default function AnnouncementBar() {
  const announcement = useSettingsStore((s) => s.settings.announcement);

  if (!announcement?.enabled || !announcement.messages?.length) return null;

  // Duplicate the list so the marquee scrolls seamlessly.
  const items = [...announcement.messages, ...announcement.messages];

  return (
    <div className="overflow-hidden border-b border-hairline/70 bg-bone-muted py-2.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, index) => (
          <span key={index} className="inline-flex shrink-0 items-center">
            <span className="text-[10px] uppercase tracking-[0.28em] text-ink-muted">{item}</span>
            <Dot />
          </span>
        ))}
      </div>
    </div>
  );
}
