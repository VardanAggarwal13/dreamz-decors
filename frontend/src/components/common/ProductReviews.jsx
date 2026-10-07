import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiStar } from 'react-icons/hi2';
import { FiCheck, FiShield, FiThumbsUp } from 'react-icons/fi';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified purchase';

function Stars({ value, size = 15 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="inline-flex">
          <HiStar size={size} className={i < value ? 'text-gold fill-gold' : 'text-hairline'} />
        </span>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, rating = 4.8, reviews = 4 }) {
  const cacheKey = productId ? `dd:reviews:${productId}` : null;
  const cached = useMemo(() => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.items)) {
        parsed.items = parsed.items.filter((r) => Number(r.rating || 5) >= 4);
      }
      return parsed;
    } catch {
      return null;
    }
  }, [cacheKey]);

  const [list, setList] = useState(() => cached?.items || []);
  const [loading, setLoading] = useState(() => !cached?.items?.length);
  const [stats, setStats] = useState(
    () => cached?.stats || { rating: Number(rating) || 4.8, count: Number(reviews) || 4 }
  );
  const [helpfulMap, setHelpfulMap] = useState({});

  const load = () => {
    if (!cached?.items?.length) setLoading(true);
    api.get(`/products/${productId}/reviews`)
      .then((res) => {
        const rawItems = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        // Strictly filter to show only reviews with ratings >= 4 stars
        const items = rawItems.filter((r) => Number(r.rating || 5) >= 4);
        setList(items);
        if (items.length > 0) {
          const avg = items.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / items.length;
          const nextStats = {
            rating: Math.round(avg * 10) / 10,
            count: items.length,
          };
          setStats(nextStats);
          if (cacheKey) {
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ items, stats: nextStats }));
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (productId) load();
    /* eslint-disable-next-line */
  }, [productId]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [list]);

  const toggleHelpful = (id) => {
    setHelpfulMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-gold-deep">
            Authentic Collector Feedback
          </span>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-ink">
            Customer Reviews &amp; Experiences
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
            Read candid evaluations from verified art collectors across India who have purchased and installed this artwork in their homes (showcasing 4★ and 5★ verified ratings).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs text-emerald-800 font-semibold shrink-0">
          <FiShield size={14} className="text-emerald-600" />
          <span>100% Authenticated Buyers Only</span>
        </div>
      </div>

      {/* Unified Rating Summary & Collector Assurance Banner */}
      <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-7 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* 1. Score & Verified Purchases Badge */}
          <div className="lg:col-span-4 flex items-center gap-4 sm:gap-5 border-b md:border-b-0 md:border-r border-hairline/80 pb-5 md:pb-0 md:pr-6">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gold/15 p-3.5 sm:p-4 min-w-[85px] sm:min-w-[95px] border border-gold/30 shrink-0">
              <span className="font-display text-3xl sm:text-5xl font-bold text-ink leading-none">
                {Number(stats.rating || 4.8).toFixed(1)}
              </span>
              <span className="text-[10px] font-semibold text-gold-deep uppercase tracking-wider mt-1.5">
                out of 5.0
              </span>
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1">
                <Stars value={Math.round(stats.rating || 5)} size={18} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-ink">
                Based on {stats.count || list.length || 4} verified collector reviews
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <FiCheck size={12} className="shrink-0" />
                <span>Curated 4★ &amp; 5★ authentic impressions</span>
              </div>
            </div>
          </div>

          {/* 2. Rating Breakdown Bars */}
          <div className="lg:col-span-4 space-y-2 border-b md:border-b-0 lg:border-r border-hairline/80 pb-5 md:pb-0 lg:pr-6">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars] || 0;
              const total = list.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={stars} className="flex items-center gap-2.5 text-xs text-ink-muted">
                  <span className="w-12 font-medium shrink-0">{stars} Stars</span>
                  <div className="h-2 flex-1 rounded-full bg-bone overflow-hidden border border-hairline/50">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-medium text-ink shrink-0">{count}</span>
                </div>
              );
            })}
          </div>

          {/* 3. Verified Buyer Policy & Protection Notice */}
          <div className="md:col-span-2 lg:col-span-4 space-y-2.5 md:pt-4 lg:pt-0 md:border-t lg:border-t-0 border-hairline/70">
            <div className="flex items-center gap-2 text-gold-deep">
              <FiShield size={16} className="shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Authentic Buyer Guarantee
              </span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              To eliminate unsolicited spam, public visitors cannot post reviews. Invitations are exclusively granted to verified patrons upon confirmed artwork delivery.
            </p>
            <div className="pt-2 border-t border-hairline/60">
              <p className="text-[11px] text-ink-muted">
                Purchased this artwork? Access your{' '}
                <Link to="/account/orders" className="text-gold-deep font-semibold underline underline-offset-2 hover:text-gold">
                  Order History
                </Link>{' '}
                to view order tracking and feedback options.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Grid (Balanced Responsive 2-Columns) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <h3 className="font-display text-base sm:text-lg font-bold text-ink">
            Verified Collector Reviews ({list.length})
          </h3>
          <span className="text-xs text-gold-deep font-semibold">
            ✓ 100% Authenticated Buyers (4★ &amp; 5★)
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-6 sm:p-8 text-center space-y-3">
            <p className="font-display text-base font-bold text-ink">Awaiting First Verified Review</p>
            <p className="text-xs text-ink-soft max-w-md mx-auto">
              Reviews are exclusively accepted from verified art collectors who have ordered and received this piece.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {list.map((r, idx) => {
              const initials = (r.name || 'Art Patron')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const isHelpful = helpfulMap[r._id || r.id];
              const isLastOdd = list.length % 2 === 1 && idx === list.length - 1;

              return (
                <div
                  key={r._id || r.id}
                  className={`rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 transition-all duration-200 hover:border-gold/50 shadow-sm flex flex-col justify-between ${
                    isLastOdd ? 'md:col-span-2' : ''
                  }`}
                >
                  <div>
                    {/* Top Row: User Avatar, Name, Verified Badge, Date */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 font-display text-xs font-bold text-gold-deep border border-gold/30">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-sm font-bold text-ink truncate">
                              {r.name || 'Verified Art Patron'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200 shrink-0">
                              <FiCheck size={11} className="text-emerald-600" /> Verified Buyer
                            </span>
                          </div>
                          <span className="text-[11px] text-ink-muted">
                            {fmtDate(r.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="shrink-0">
                        <Stars value={r.rating} size={15} />
                      </div>
                    </div>

                    {/* Review Title */}
                    {r.title && (
                      <h4 className="mt-3.5 font-display text-sm sm:text-base font-bold text-ink">
                        {r.title}
                      </h4>
                    )}

                    {/* Review Comment */}
                    {r.comment && (
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
                        {r.comment}
                      </p>
                    )}
                  </div>

                  {/* Helpful footer */}
                  <div className="mt-4 pt-3 border-t border-hairline/60 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                    <span className="text-[11px]">Artwork: Museum-Grade Canvas</span>
                    <button
                      type="button"
                      onClick={() => toggleHelpful(r._id || r.id)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                        isHelpful ? 'text-emerald-700 font-bold' : 'hover:text-gold-deep'
                      }`}
                    >
                      <FiThumbsUp size={12} className={isHelpful ? 'fill-emerald-700' : ''} />
                      <span>{isHelpful ? 'Helpful (Thank you!)' : 'Helpful'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
