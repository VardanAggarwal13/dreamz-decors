import { trustStrip } from '@/lib/sampleData';

export default function AnnouncementBar() {
  const items = [...trustStrip, ...trustStrip];
  return (
    <div className="overflow-hidden border-b border-ink/8 bg-bone-muted py-2">
      <div className="flex w-max animate-marquee gap-12 whitespace-nowrap pr-12">
        {items.map((t, i) => (
          <span key={i} className="text-[11px] uppercase tracking-[0.22em] text-ink/70">
            ✦ {t}
          </span>
        ))}
      </div>
    </div>
  );
}
