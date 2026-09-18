import { useSettingsStore } from '@/store/settingsStore';

const Dot = () => (
  <span className="mx-4 inline-block h-1 w-1 shrink-0 rounded-full bg-gold/40 align-middle" />
);

export default function AnnouncementBar() {
  const announcement = useSettingsStore((s) => s.settings.announcement);

  if (!announcement?.enabled || !announcement.messages?.length) return null;

  // The marquee scrolls one half of the track (translateX -50%) then wraps.
  // For that to look seamless with no blank gap, each half must be wider than
  // the viewport — so repeat the (possibly very short) message list enough
  // times, then render two identical halves.
  const half = Array.from({ length: 6 }, () => announcement.messages).flat();
  const items = [...half, ...half];

  return (
    <div className="group overflow-hidden border-b border-hairline/70 bg-bone-muted py-2.5">
      <div className="flex w-max animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
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
