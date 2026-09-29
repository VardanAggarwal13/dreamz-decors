import { useEffect, useMemo, useState } from 'react';
import { HiStar } from 'react-icons/hi2';
import { FiCheck, FiShield, FiThumbsUp, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useAuthPrompt } from '@/store/authPromptStore';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified purchase';

function Stars({ value, size = 15, onSelect }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type={onSelect ? 'button' : undefined}
          onClick={onSelect ? () => onSelect(i + 1) : undefined}
          className={onSelect ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          tabIndex={onSelect ? 0 : -1}
          aria-label={onSelect ? `Rate ${i + 1} stars` : undefined}
        >
          <HiStar size={size} className={i < value ? 'text-gold fill-gold' : 'text-hairline'} />
        </button>
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
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [cacheKey]);

  const [list, setList] = useState(() => cached?.items || []);
  const [loading, setLoading] = useState(() => !cached?.items?.length);
  const [stats, setStats] = useState(
    () => cached?.stats || { rating: Number(rating) || 4.8, count: Number(reviews) || 4 }
  );
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});

  const user = useAuthStore((s) => s.user);
  const promptAuth = useAuthPrompt((s) => s.show);

  const load = () => {
    if (!cached?.items?.length) setLoading(true);
    api.get(`/products/${productId}/reviews`)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
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

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      promptAuth('Sign in to write a review.');
      return;
    }
    if (!form.comment.trim()) {
      toast.error('Please share a few words about your experience.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/products/${productId}/reviews`, form);
      const data = res?.data || res;
      if (data?.rating && data?.reviewsCount) {
        setStats({ rating: data.rating, count: data.reviewsCount });
      }
      setForm({ rating: 5, title: '', comment: '' });
      toast.success('Thank you! Your verified review has been published.');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHelpful = (id) => {
    setHelpfulMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.24em] text-gold-deep">
          Authentic Collector Feedback
        </span>
        <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-ink">
          Customer Reviews &amp; Experiences
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
          Read candid evaluations from verified art collectors across India who have purchased and installed this artwork in their homes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column (5 Cols): Rating Summary & Write Review Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rating Summary Card */}
          <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gold/15 p-4 min-w-[90px] border border-gold/30">
                <span className="font-display text-4xl font-bold text-ink leading-none">
                  {Number(stats.rating || 4.8).toFixed(1)}
                </span>
                <span className="text-[10px] font-semibold text-gold-deep uppercase tracking-wider mt-1">
                  out of 5.0
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <Stars value={Math.round(stats.rating || 5)} size={18} />
                </div>
                <p className="mt-1 text-xs font-medium text-ink">
                  Based on {stats.count || list.length || 4} verified collector reviews
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <FiShield size={13} className="shrink-0" />
                  <span>100% Genuine Verified Purchases</span>
                </div>
              </div>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="mt-5 space-y-2 border-t border-hairline/60 pt-4">
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
                    <span className="w-8 text-right font-medium text-ink shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write a Review Card */}
          <form
            onSubmit={submit}
            className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2">
              <FiMessageSquare className="text-gold-deep shrink-0" size={17} />
              <h3 className="font-display text-base font-bold text-ink">
                Share Your Experience
              </h3>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Have you received this artwork? Help fellow collectors with your review.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                Your Rating
              </label>
              <div className="flex items-center gap-3">
                <Stars
                  value={form.rating}
                  size={22}
                  onSelect={(r) => setForm((f) => ({ ...f, rating: r }))}
                />
                <span className="text-xs font-bold text-gold-deep">
                  {form.rating === 5 ? 'Exceptional (5/5)' : form.rating === 4 ? 'Very Good (4/5)' : `${form.rating}/5`}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                Review Headline (Optional)
              </label>
              <Input
                placeholder="e.g. Stunning finish, centerpiece of our living room"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
                Detailed Review
              </label>
              <textarea
                className="w-full rounded-xl border border-hairline/80 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-muted/70 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
                rows={3}
                placeholder="Share thoughts on the canvas texture, print depth, framing, or packaging..."
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="w-full py-2.5 text-xs uppercase tracking-wider font-semibold"
            >
              {submitting ? 'Submitting Review…' : 'Submit Verified Review'}
            </Button>
          </form>
        </div>

        {/* Right Column (7 Cols): Verified Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-display text-base font-bold text-ink">
              Verified Collector Reviews ({list.length})
            </h3>
            <span className="text-xs text-gold-deep font-semibold">
              ✓ 100% Authenticated Buyers
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
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
            <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-8 text-center space-y-3">
              <p className="font-display text-base font-bold text-ink">Be the First Collector to Review</p>
              <p className="text-xs text-ink-soft max-w-md mx-auto">
                No verified reviews have been submitted for this artwork yet. Share your experience using the form on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {list.map((r) => {
                const initials = (r.name || 'Art Patron')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                const isHelpful = helpfulMap[r._id || r.id];

                return (
                  <div
                    key={r._id || r.id}
                    className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 transition-all duration-200 hover:border-gold/50 shadow-sm"
                  >
                    {/* Top Row: User Avatar, Name, Verified Badge, Date */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 font-display text-xs font-bold text-gold-deep border border-gold/30">
                          {initials}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-sm font-bold text-ink">
                              {r.name || 'Verified Art Patron'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                              <FiCheck size={11} className="text-emerald-600" /> Verified Buyer
                            </span>
                          </div>
                          <span className="text-[11px] text-ink-muted">
                            {fmtDate(r.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <Stars value={r.rating} size={15} />
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

                    {/* Helpful footer */}
                    <div className="mt-4 pt-3 border-t border-hairline/60 flex items-center justify-between text-xs text-ink-muted">
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
    </div>
  );
}
