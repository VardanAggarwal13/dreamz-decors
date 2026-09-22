import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import useFetch from '@/hooks/useFetch';
import { homeContent } from '@/lib/siteContent';
import { normalizeHref } from '@/lib/utils';
import { cldTransform } from '@/lib/cloudinary';

const ctaClass =
  'h-auto min-h-12 flex-1 px-3 py-2 text-center text-[11px] leading-tight tracking-[0.08em] sm:h-14 sm:min-h-0 sm:flex-none sm:px-8 sm:py-0 sm:text-sm sm:tracking-[0.22em]';

const FALLBACK_HERO_IMAGE =
  'https://res.cloudinary.com/dif6u5314/image/upload/v1790006432/dreamzdecors/products/ten-gurus-handcrafted-art.jpg';

export default function Hero() {
  // Admin override (key 'home') merged over the built-in default.
  const { data } = useFetch('/content/home', { deps: [], cache: 'dd:content:home:v3' });
  const rawHero = { ...homeContent.hero, ...(data?.data?.hero || {}) };
  const heroImage = rawHero.image || FALLBACK_HERO_IMAGE;
  const hero = {
    ...rawHero,
    image: heroImage,
    primaryCta: rawHero.primaryCta ? { ...rawHero.primaryCta, href: normalizeHref(rawHero.primaryCta.href) } : undefined,
    secondaryCta: rawHero.secondaryCta ? { ...rawHero.secondaryCta, href: normalizeHref(rawHero.secondaryCta.href) } : undefined,
  };
  const stats = hero.stats || [];

  return (
    <section className="border-b border-hairline/60 bg-bone overflow-hidden">
      <div className="container-page py-7 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 items-center gap-7 sm:gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">

          {/* ── Left: Copy & Actions ───────────────────────── */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="eyebrow-gold">{hero.eyebrow}</span>
              <span className="gold-rule" />
            </div>

            <h1 className="mt-3.5 font-display text-3xl sm:text-5xl lg:text-[4.25rem] leading-[1.02] sm:leading-[0.96] text-ink font-bold">
              {hero.titleLead}{' '}
              <span className="text-gold-shimmer">{hero.titleHighlight}</span>
              {(hero.titleRest || []).map((line, i) => (
                <span key={i}>
                  <br className="hidden sm:inline" />{' '}
                  <span className="text-ink/60">{line}</span>
                </span>
              ))}
            </h1>

            <p className="mt-3 max-w-lg text-xs sm:text-sm leading-relaxed text-ink-soft sm:mt-4 sm:leading-7">
              {hero.description}
            </p>

            {/* ── Mobile Hero Image Showcase (Shown on mobile screens < lg) ── */}
            <div className="mt-4 block lg:hidden">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-2xl border border-hairline/80 bg-bone-soft shadow-[0_10px_30px_rgba(22,22,22,0.08)]">
                <img
                  src={cldTransform(hero.image, { width: 900, height: 750, gravity: 'north' })}
                  alt="DreamzDecors styled interior"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_HERO_IMAGE) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_HERO_IMAGE;
                    }
                  }}
                  className="h-full w-full object-cover object-[center_12%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />

                {hero.badge && (
                  <div
                    className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-md shadow-sm"
                  >
                    <span className="flex h-2 w-2 rounded-full bg-gold" style={{ boxShadow: '0 0 6px rgba(197,158,89,0.9)' }} />
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.2em] text-white/95">{hero.badge}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex items-stretch gap-2.5 sm:mt-6 sm:gap-3">
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

            {/* Stats Row */}
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-hairline/60 pt-4 sm:mt-7 sm:max-w-md sm:gap-8 sm:pt-6">
              {stats.map(({ value, label }, i) => (
                <div key={`${label}-${i}`} className="flex flex-col items-center gap-1 text-center">
                  <span className="font-display text-lg sm:text-2xl font-bold leading-none text-gold-deep">{value}</span>
                  <span className="text-[9px] uppercase tracking-[0.16em] text-ink-muted sm:text-[10px] sm:tracking-[0.24em]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Desktop Hero Image Showcase (Shown on lg+) ── */}
          <div className="hidden lg:block">
            <div className="relative aspect-[4/5] w-full max-h-[560px] overflow-hidden rounded-3xl border border-hairline/70 bg-bone-soft shadow-[0_14px_40px_rgba(22,22,22,0.08)] group">
              <img
                src={cldTransform(hero.image, { width: 1000, height: 1250, gravity: 'north' })}
                alt="DreamzDecors styled interior"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== FALLBACK_HERO_IMAGE) {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_HERO_IMAGE;
                  }
                }}
                className="h-full w-full object-cover object-[center_12%] motion-safe:animate-hero-pan transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />

              {hero.badge && (
                <div
                  className="absolute bottom-5 left-5 flex items-center gap-2.5 rounded-full border border-white/20 bg-black/25 px-4 py-2.5 backdrop-blur-md"
                  style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}
                >
                  <span className="flex h-2 w-2 rounded-full bg-gold" style={{ boxShadow: '0 0 8px rgba(197,158,89,0.9)' }} />
                  <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-white/95">{hero.badge}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
