import { useCallback, useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const GAP      = 16;
const INTERVAL = 3500;
const DURATION = 420;

// 1 card on mobile, 2 on tablet, 3 on desktop
const getVisible = (w) => (w < 640 ? 1 : w < 1024 ? 2 : 3);

const StarRow = () => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gold">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

function TestimonialCard({ item }) {
  return (
    <div
      className="flex h-full flex-col rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7"
      style={{ borderLeft: '2px solid rgb(197 158 89 / 0.35)' }}
    >
      <StarRow />
      <p className="mt-4 flex-1 text-sm leading-7 text-ink-soft">
        &ldquo;{item.quote}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-hairline/50 pt-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold-deep">
          {item.author.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{item.author}</p>
          {item.role && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-ink-muted">{item.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialGrid({ items = [] }) {
  const total = items.length;
  if (total === 0) return null;

  const containerRef = useRef(null);
  const trackRef     = useRef(null);
  const timerRef     = useRef(null);
  const nextFnRef    = useRef(null);
  const animatingRef = useRef(false);
  const stepRef      = useRef(0);
  const posRef       = useRef(1); // start at 1 (default visible for w=0)
  const visibleRef   = useRef(1); // always-current visible count for async callbacks

  const [containerW, setContainerW] = useState(0);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick(t => t + 1), []);

  // Responsive visible count — derived synchronously from containerW
  const visible = getVisible(containerW);

  // Keep a ref in sync so navigate's async setTimeout always reads the latest value
  useEffect(() => { visibleRef.current = visible; }, [visible]);

  // Cloned array: [last N clones] + [real items] + [first N clones]
  const cloned = [...items.slice(-visible), ...items, ...items.slice(0, visible)];

  // Card width
  const cardW = containerW > 0 ? (containerW - GAP * (visible - 1)) / visible : 0;

  // Setup ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    setContainerW(containerRef.current.offsetWidth);
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Re-initialise step + position whenever visible or containerW changes
  useEffect(() => {
    if (containerW <= 0 || !trackRef.current) return;
    const cw = (containerW - GAP * (visible - 1)) / visible;
    stepRef.current = cw + GAP;
    posRef.current  = visible;
    trackRef.current.style.transition = 'none';
    trackRef.current.style.transform  = `translateX(${-visible * stepRef.current}px)`;
  }, [containerW, visible]);

  // Core navigate: moves track by `dir` cards
  const navigate = useCallback((dir) => {
    if (animatingRef.current || stepRef.current === 0 || !trackRef.current) return;
    animatingRef.current = true;

    const newPos = posRef.current + dir;
    posRef.current = newPos;
    bump();

    trackRef.current.style.transition = `transform ${DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    trackRef.current.style.transform  = `translateX(${-newPos * stepRef.current}px)`;

    setTimeout(() => {
      const v = visibleRef.current; // read current value, not stale closure
      let p   = posRef.current;
      if (p < v)              p = p + total;
      else if (p >= v + total) p = p - total;

      if (p !== posRef.current && trackRef.current) {
        posRef.current = p;
        trackRef.current.style.transition = 'none';
        trackRef.current.style.transform  = `translateX(${-p * stepRef.current}px)`;
      }
      animatingRef.current = false;
      bump();
    }, DURATION + 30);
  }, [total, bump]);

  const next = useCallback(() => navigate(1),  [navigate]);
  const prev = useCallback(() => navigate(-1), [navigate]);

  // Auto-play
  useEffect(() => { nextFnRef.current = next; }, [next]);

  useEffect(() => {
    if (total <= visible) return;
    timerRef.current = setInterval(() => nextFnRef.current?.(), INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [total, visible]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => nextFnRef.current?.(), INTERVAL);
  }, []);

  // Jump to a specific real-item index (dot clicks)
  const jumpTo = useCallback((realIdx) => {
    if (animatingRef.current || !trackRef.current) return;
    const targetPos = visibleRef.current + realIdx;
    posRef.current  = targetPos;
    trackRef.current.style.transition = 'none';
    trackRef.current.style.transform  = `translateX(${-targetPos * stepRef.current}px)`;
    bump();
  }, [bump]);

  const activeReal = ((posRef.current - visible) % total + total) % total;

  return (
    <div>
      <div ref={containerRef} className="overflow-hidden">
        <div
          ref={trackRef}
          style={{ display: 'flex', gap: `${GAP}px`, willChange: 'transform' }}
        >
          {cloned.map((item, i) => (
            <div key={i} style={{ flex: `0 0 ${cardW}px`, minWidth: 0 }}>
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      {total > visible && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            aria-label="Previous review"
            onClick={() => { prev(); resetTimer(); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline/70 bg-bone-soft text-ink-soft transition hover:border-gold/50 hover:text-gold-deep"
          >
            <FiChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to review ${i + 1}`}
                onClick={() => { jumpTo(i); resetTimer(); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeReal ? 'w-8 bg-gold' : 'w-2 bg-hairline hover:bg-gold/40'
                }`}
              />
            ))}
          </div>

          <button
            aria-label="Next review"
            onClick={() => { next(); resetTimer(); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline/70 bg-bone-soft text-ink-soft transition hover:border-gold/50 hover:text-gold-deep"
          >
            <FiChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
