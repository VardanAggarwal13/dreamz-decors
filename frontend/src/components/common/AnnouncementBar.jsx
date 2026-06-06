import { trustStrip } from '@/lib/sampleData';

const marqueeItems = [
  ...trustStrip,
  'Gold Foil Artworks',
  'Curated Gallery Sets',
  'Secure Online Checkout',
  ...trustStrip,
  'Gold Foil Artworks',
  'Curated Gallery Sets',
  'Secure Online Checkout',
];

const Dot = () => (
  <span className="mx-4 inline-block h-1 w-1 shrink-0 rounded-full bg-gold/40 align-middle" />
);

export default function AnnouncementBar() {
  return (
    <div className="overflow-hidden border-b border-hairline/70 bg-bone-muted py-2.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {marqueeItems.map((item, index) => (
          <span key={index} className="inline-flex shrink-0 items-center">
            <span className="text-[10px] uppercase tracking-[0.28em] text-ink-muted">{item}</span>
            <Dot />
          </span>
        ))}
      </div>
    </div>
  );
}
