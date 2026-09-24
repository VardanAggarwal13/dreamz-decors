import { Link } from 'react-router-dom';
import { FiArrowRight, FiAward, FiMapPin, FiPackage, FiTruck, FiCheck } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Icon name → component, so feature cards stay editable as plain JSON (admin
// can't store React components). Unknown names fall back to a check mark.
const ICONS = {
  award: FiAward,
  madeIn: FiMapPin,
  mapPin: FiMapPin,
  package: FiPackage,
  truck: FiTruck,
  check: FiCheck,
};

// Built-in defaults — used only if no `points` are supplied/overridden.
const DEFAULT_POINTS = [
  { icon: 'award', title: 'Premium quality', text: 'Artist-grade canvas, archival inks, and refined gold-foil finishing on every piece.' },
  { icon: 'madeIn', title: 'Made in India', text: 'Designed and produced in-house at our studio with strict quality checks before dispatch.' },
  { icon: 'package', title: 'Secure packaging', text: 'Foam-cornered and bubble-wrapped so your art arrives without a single mark.' },
  { icon: 'truck', title: 'Pan-India delivery', text: 'Standard 7–10 day shipping with end-to-end order tracking across India.' },
];

// Accept either rich objects {icon,title,text} or plain strings (legacy/simple).
function normalizePoint(p) {
  if (typeof p === 'string') return { Icon: FiCheck, title: p, text: '' };
  return { Icon: ICONS[p?.icon] || FiCheck, title: p?.title || '', text: p?.text || '' };
}

export default function FeatureSplit({
  eyebrow,
  title,
  description,
  points,
  cta,
  className = '',
}) {
  const cards = (Array.isArray(points) && points.length ? points : DEFAULT_POINTS).map(normalizePoint);
  return (
    <section className={cn('bg-bone-muted py-10 sm:py-12 lg:py-14', className)}>
      <div className="container-page">

        {/* ── Section header ─────────────────────────────────── */}
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <>
              <span className="eyebrow-gold">{eyebrow}</span>
              <span
                className="mx-auto mt-2.5 block h-px w-10"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgb(197 158 89), transparent)',
                }}
              />
            </>
          )}
          <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl text-balance text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-2.5 text-xs sm:text-sm leading-relaxed sm:leading-7 text-ink-soft">{description}</p>
          )}
        </div>

        {/* ── Feature cards ──────────────────────────────────── */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
          {cards.map(({ Icon, title: cardTitle, text }, i) => (
            <div
              key={`${cardTitle}-${i}`}
              className="rounded-2xl border border-hairline/60 bg-bone-soft p-5 sm:p-6 transition-shadow hover:shadow-card"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                <Icon size={18} className="text-gold-deep" />
              </div>
              <h3 className="mt-4 text-[14px] sm:text-[15px] font-medium text-ink">{cardTitle}</h3>
              {text && <p className="mt-1.5 text-xs sm:text-sm leading-relaxed sm:leading-6 text-ink-soft">{text}</p>}
            </div>
          ))}
        </div>

        {/* ── CTA ────────────────────────────────────────────── */}
        {cta && (
          <div className="mt-7 sm:mt-8 text-center">
            <Button
              asChild
              variant="primary"
              size="lg"
              className="h-12 px-5 text-[11px] tracking-[0.08em] sm:h-14 sm:px-8 sm:text-sm sm:tracking-[0.22em]"
            >
              <Link to={cta.href}>
                {cta.label}
                <FiArrowRight className="shrink-0" />
              </Link>
            </Button>
          </div>
        )}

      </div>
    </section>
  );
}
