import { useRef, useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ProductCard from './ProductCard';

export default function ProductCarousel({
  products = [],
  title,
  subtitle,
  loading = false,
  skeletonCount = 4,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, products.length, loading]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by roughly 1 card width or half container
    const cardWidth = el.querySelector('[data-carousel-item]')?.offsetWidth || 230;
    const scrollAmount = (cardWidth + 16) * (direction === 'left' ? -1 : 1);
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const visibleProducts = products.filter((p) => p && p.isActive !== false);

  if (!loading && visibleProducts.length === 0) return null;

  return (
    <div className="relative">
      {/* ── Carousel Header: Title & Navigation Controls ── */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <div>
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
          )}
        </div>

        {/* Arrow Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Previous artworks"
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
              canScrollLeft
                ? 'border-hairline bg-bone-soft text-ink hover:border-gold hover:text-gold-deep shadow-2xs active:scale-95'
                : 'border-hairline/40 bg-bone-soft/40 text-ink/25 cursor-not-allowed opacity-50'
            }`}
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Next artworks"
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
              canScrollRight
                ? 'border-hairline bg-bone-soft text-ink hover:border-gold hover:text-gold-deep shadow-2xs active:scale-95'
                : 'border-hairline/40 bg-bone-soft/40 text-ink/25 cursor-not-allowed opacity-50'
            }`}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Track (Swipeable on touch, horizontal scrollable) ── */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label={title || "Product Carousel"}
        className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pb-3 pt-1 -mx-1 px-1 snap-x snap-mandatory focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading ? (
          Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              data-carousel-item
              className="w-[195px] xs:w-[215px] sm:w-[240px] md:w-[250px] shrink-0 snap-start rounded-2xl border border-hairline/60 bg-bone-soft p-3"
            >
              <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-bone-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-bone-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-bone-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-bone-muted" />
              </div>
            </div>
          ))
        ) : (
          visibleProducts.map((product) => (
            <div
              key={product.id || product.slug}
              data-carousel-item
              className="w-[195px] xs:w-[215px] sm:w-[240px] md:w-[250px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
