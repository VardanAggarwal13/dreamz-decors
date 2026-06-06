import { Link } from 'react-router-dom';
import { FiArrowRight, FiAward, FiMapPin, FiPackage, FiTruck } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    Icon: FiAward,
    label: 'Premium quality',
    desc: 'Artist-grade canvas, archival inks, and refined gold-foil finishing on every piece.',
  },
  {
    Icon: FiMapPin,
    label: 'Made in India',
    desc: 'Designed and produced in-house at our studio with strict quality checks before dispatch.',
  },
  {
    Icon: FiPackage,
    label: 'Secure packaging',
    desc: 'Foam-cornered and bubble-wrapped so your art arrives without a single mark.',
  },
  {
    Icon: FiTruck,
    label: 'Pan-India delivery',
    desc: 'Standard 7–10 day shipping with end-to-end order tracking across India.',
  },
];

export default function FeatureSplit({
  eyebrow,
  title,
  description,
  cta,
  className = '',
}) {
  return (
    <section className={cn('bg-bone-muted py-16 sm:py-20', className)}>
      <div className="container-page">

        {/* ── Section header ─────────────────────────────────── */}
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <>
              <span className="eyebrow-gold">{eyebrow}</span>
              <span
                className="mx-auto mt-3 block h-px w-10"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgb(197 158 89), transparent)',
                }}
              />
            </>
          )}
          <h2 className="mt-5 font-display text-4xl text-balance text-ink sm:text-5xl">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-sm leading-7 text-ink-soft">{description}</p>
          )}
        </div>

        {/* ── Feature cards ──────────────────────────────────── */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-2xl border border-hairline/60 bg-bone-soft p-7 transition-shadow hover:shadow-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
                <Icon size={20} className="text-gold-deep" />
              </div>
              <h3 className="mt-5 text-[15px] font-medium text-ink">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── CTA ────────────────────────────────────────────── */}
        {cta && (
          <div className="mt-10 text-center">
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
