import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import useFetch from '@/hooks/useFetch';
import { homeContent } from '@/lib/siteContent';

const ctaClass =
  'h-auto min-h-12 flex-1 px-3 py-2 text-center text-[11px] leading-tight tracking-[0.08em] sm:h-14 sm:min-h-0 sm:flex-none sm:px-8 sm:py-0 sm:text-sm sm:tracking-[0.22em]';

export default function Hero() {
  // Admin override (key 'home') merged over the built-in default.
  const { data } = useFetch('/content/home', { deps: [] });
  const hero = { ...homeContent.hero, ...(data?.data?.hero || {}) };
  const stats = hero.stats || [];

  return (
    <section className="border-b border-hairline/60 bg-bone">
      <div className="container-page grid min-h-[60vh] grid-cols-1 items-center gap-10 py-12 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-16">

        {/* ── Left: text ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3">
            <span className="eyebrow-gold">{hero.eyebrow}</span>
            <span className="gold-rule" />
          </div>

          <h1 className="mt-6 font-display text-4xl leading-[0.94] text-ink sm:text-5xl lg:text-[4.5rem]">
            {hero.titleLead}{' '}
            <span className="text-gold-shimmer">{hero.titleHighlight}</span>
            {(hero.titleRest || []).map((line, i) => (
              <span key={i}>
                <br />
                <span className="text-ink/55">{line}</span>
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-ink-soft">{hero.description}</p>

          <div className="mt-8 flex items-stretch gap-2.5 sm:gap-3">
            <Button asChild variant="primary" size="lg" className={ctaClass}>
              <Link to={hero.primaryCta?.href || '/shop'}>
                {hero.primaryCta?.label} <FiArrowRight className="shrink-0" />
              </Link>
            </Button>
            {hero.secondaryCta?.label && (
              <Button asChild variant="outline" size="lg" className={ctaClass}>
                <Link to={hero.secondaryCta.href || '/shop'}>{hero.secondaryCta.label}</Link>
              </Button>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between gap-2 border-t border-hairline/60 pt-8 sm:flex-wrap sm:justify-start sm:gap-8">
            {stats.map(({ value, label }, i) => (
              <div
                key={`${label}-${i}`}
                className={`flex flex-col gap-1 ${i === stats.length - 1 ? 'text-right sm:text-left' : ''}`}
              >
                <span className="font-display text-lg leading-none text-gold sm:text-2xl">{value}</span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-ink-muted sm:text-[10px] sm:tracking-[0.26em]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: single clean image ─────────────────── */}
        <div className="hidden lg:block">
          <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: '3/4' }}>
            <img
              src={hero.image}
              alt="DreamzDecors styled interior"
              className="h-full w-full object-cover motion-safe:animate-hero-pan"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />

            {hero.badge && (
              <div
                className="absolute bottom-5 left-5 flex items-center gap-2.5 rounded-full border border-gold/30 bg-bone-soft/90 px-4 py-2.5 backdrop-blur-sm"
                style={{ boxShadow: '0 6px 20px rgba(197,158,89,0.14)' }}
              >
                <span className="flex h-2 w-2 rounded-full bg-gold" style={{ boxShadow: '0 0 8px rgba(197,158,89,0.7)' }} />
                <span className="text-[10px] uppercase tracking-[0.24em] text-ink-soft">{hero.badge}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
