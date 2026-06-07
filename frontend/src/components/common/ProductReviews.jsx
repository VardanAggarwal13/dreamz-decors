import { useEffect, useState } from 'react';
import { HiStar } from 'react-icons/hi2';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { useAuthPrompt } from '@/store/authPromptStore';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function Stars({ value, size = 14, onSelect }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type={onSelect ? 'button' : undefined}
          onClick={onSelect ? () => onSelect(i + 1) : undefined}
          className={onSelect ? 'cursor-pointer' : 'cursor-default'}
          tabIndex={onSelect ? 0 : -1}
          aria-label={onSelect ? `Rate ${i + 1}` : undefined}
        >
          <HiStar size={size} className={i < value ? 'text-gold' : 'text-hairline'} />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId, rating = 0, reviews = 0 }) {
  const [list, setList] = useState([]);
  const [stats, setStats] = useState({ rating, count: reviews });
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const promptAuth = useAuthPrompt((s) => s.show);

  const load = () => api.get(`/products/${productId}/reviews`).then((res) => setList(res.data || [])).catch(() => {});
  useEffect(() => { if (productId) load(); /* eslint-disable-next-line */ }, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { promptAuth('Sign in to write a review.'); return; }
    if (!form.comment.trim()) { toast.error('Please write a few words.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/products/${productId}/reviews`, form);
      setStats({ rating: res.data.rating, count: res.data.reviewsCount });
      setForm({ rating: 5, title: '', comment: '' });
      toast.success('Thanks for your review!');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 border-t border-hairline/60 pt-10 sm:mt-16">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        {/* Summary + form */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold-deep">Reviews</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-4xl text-ink">{Number(stats.rating || 0).toFixed(1)}</span>
            <div>
              <Stars value={Math.round(stats.rating)} size={16} />
              <p className="mt-1 text-xs text-ink-muted">{stats.count} review{stats.count === 1 ? '' : 's'}</p>
            </div>
          </div>

          {/* Write a review */}
          <form onSubmit={submit} className="mt-7 rounded-2xl border border-hairline/60 bg-bone-soft p-5">
            <p className="text-sm font-medium text-ink">Write a review</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-ink-muted">Your rating</span>
              <Stars value={form.rating} size={18} onSelect={(r) => setForm((f) => ({ ...f, rating: r }))} />
            </div>
            <Input
              className="mt-3"
              placeholder="Title (optional)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className="mt-3 w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-gold"
              rows={3}
              placeholder="Share your experience…"
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            />
            <Button type="submit" variant="primary" size="md" disabled={submitting} className="mt-3 w-full">
              {submitting ? 'Submitting…' : 'Submit review'}
            </Button>
          </form>
        </div>

        {/* List */}
        <div>
          {list.length === 0 ? (
            <p className="text-sm text-ink-soft">No reviews yet — be the first to share your thoughts.</p>
          ) : (
            <ul className="space-y-6">
              {list.map((r) => (
                <li key={r._id} className="border-b border-hairline/50 pb-6 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{r.name}</span>
                    <span className="text-[11px] text-ink-muted">{fmtDate(r.createdAt)}</span>
                  </div>
                  <Stars value={r.rating} size={13} />
                  {r.title && <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>}
                  {r.comment && <p className="mt-1 text-sm leading-7 text-ink-soft">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
