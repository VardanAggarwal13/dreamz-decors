import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiStar } from 'react-icons/hi2';
import { FiCheck, FiEdit3, FiMessageSquare, FiShield, FiX } from 'react-icons/fi';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

function Stars({ value, size = 18, onSelect }) {
  const [hovered, setHovered] = useState(0);
  const displayVal = hovered || value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const star = i + 1;
        return (
          <button
            key={i}
            type={onSelect ? 'button' : undefined}
            onClick={onSelect ? () => onSelect(star) : undefined}
            onMouseEnter={onSelect ? () => setHovered(star) : undefined}
            onMouseLeave={onSelect ? () => setHovered(0) : undefined}
            className={onSelect ? 'cursor-pointer p-0.5 hover:scale-115 transition-transform' : 'cursor-default p-0.5'}
            tabIndex={onSelect ? 0 : -1}
            aria-label={onSelect ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
          >
            <HiStar
              size={size}
              className={star <= displayVal ? 'text-gold fill-gold' : 'text-hairline'}
            />
          </button>
        );
      })}
    </div>
  );
}

const RATING_LABELS = {
  5: 'Exceptional (5/5)',
  4: 'Very Good (4/5)',
  3: 'Good (3/5)',
  2: 'Fair (2/5)',
  1: 'Poor (1/5)',
};

function ReviewModal({ open, onClose, order, item, existingReview, onSuccess }) {
  useBodyScrollLock(open);

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setTitle(existingReview.title || '');
      setComment(existingReview.comment || '');
    } else {
      setRating(5);
      setTitle('');
      setComment('');
    }
  }, [existingReview, open]);

  if (!open || !item) return null;

  const productId = item.product?._id || item.product || item.productId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please share a few words about your artwork experience.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(`/products/${productId}/reviews`, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      const data = res?.data || res;
      toast.success(existingReview ? 'Your review has been updated!' : 'Thank you! Your verified collector review has been published.');
      if (onSuccess) onSuccess(data?.review || data);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const optionString = item.options
    ? Object.entries(item.options)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' • ')
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-hairline/80 bg-bone p-5 sm:p-7 shadow-xl max-h-[90vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="sticky float-right -mt-1 -mr-1 z-20 rounded-full p-2 text-ink-muted hover:bg-bone-soft hover:text-ink transition"
          aria-label="Close review dialog"
        >
          <FiX size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 text-gold-deep mb-1.5 sm:mb-2 pr-8">
          <FiShield size={17} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Verified Collector Review
          </span>
        </div>
        <h3 className="font-display text-lg sm:text-xl font-bold text-ink pr-8">
          {existingReview ? 'Update Your Artwork Review' : 'Rate & Review Your Artwork'}
        </h3>
        <p className="text-xs text-ink-soft mt-1 leading-relaxed">
          Order #{String(order._id).slice(-8).toUpperCase()} • Only delivered buyers can submit authentic feedback.
        </p>

        {/* Artwork Item Info */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-hairline/70 bg-bone-soft p-3">
          {item.image && (
            <img
              src={item.image}
              alt={item.title}
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover border border-hairline/60 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-display text-xs sm:text-sm font-bold text-ink truncate">
              {item.title}
            </h4>
            {optionString && (
              <p className="text-[11px] text-ink-muted truncate mt-0.5">{optionString}</p>
            )}
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-1">
              <FiCheck size={11} /> Delivered &amp; Verified Purchase
            </span>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
              Your Rating
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Stars value={rating} size={24} onSelect={setRating} />
              <span className="text-xs font-bold text-gold-deep">
                {RATING_LABELS[rating] || `${rating}/5`}
              </span>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
              Review Headline (Optional)
            </label>
            <Input
              placeholder="e.g. Stunning canvas texture, centerpiece of our living room"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
              maxLength={120}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1.5">
              Detailed Collector Review
            </label>
            <textarea
              className="w-full rounded-xl border border-hairline/80 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-muted/70 outline-none focus:border-gold focus:ring-1 focus:ring-gold transition resize-y min-h-[90px]"
              rows={3}
              placeholder="Share thoughts on the canvas texture, colors, print depth, framing, or doorstep delivery..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          {/* Note */}
          <div className="rounded-lg bg-gold/10 border border-gold/30 p-2.5 text-[11px] text-ink-soft leading-relaxed">
            🛡️ <strong>Collector Authenticity Guarantee:</strong> Your review will be published as an authenticated buyer review. Reviews can be added or updated within 30 days of placing your order.
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="text-xs uppercase tracking-wider font-semibold w-full sm:w-auto"
            >
              {submitting ? 'Submitting…' : existingReview ? 'Save Changes' : 'Submit Collector Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrderReviewSection({ order }) {
  const [reviewMap, setReviewMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - orderDate.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isDelivered = (order?.orderStatus || order?.status) === 'delivered';
  const isWithin30Days = diffDays <= 30;
  const canReview = isDelivered && isWithin30Days;

  const loadReviews = () => {
    if (!order?._id) return;
    setLoading(true);
    api.get(`/orders/${order._id}/reviews`)
      .then((res) => {
        const data = res?.data || res || {};
        setReviewMap(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
    /* eslint-disable-next-line */
  }, [order?._id]);

  const items = order?.items || [];
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-hairline/80 bg-bone p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="border-b border-hairline/70 pb-4">
        <div className="flex items-center gap-2">
          <FiMessageSquare className="text-gold-deep" size={17} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-deep">
            Collector Feedback
          </span>
        </div>
        <h3 className="mt-1 font-display text-lg sm:text-xl font-bold text-ink">
          Rate &amp; Review Your Artworks
        </h3>
        <p className="mt-1 text-xs text-ink-soft leading-relaxed max-w-2xl">
          {canReview
            ? 'Your order was successfully delivered! Help fellow art collectors by sharing your genuine experience with this artwork.'
            : !isDelivered
            ? 'Review submission unlocks once your order has been successfully delivered to your doorstep.'
            : 'The 30-day review period for this order has concluded. Thank you for collecting with DreamzDecors.'}
        </p>
      </div>

      {/* Items Review List */}
      <div className="divide-y divide-hairline/60">
        {items.map((item, idx) => {
          const productId = String(item.product?._id || item.product || item.productId || idx);
          const review = reviewMap[productId];
          const hasReviewed = Boolean(review);

          const optionString = item.options
            ? Object.entries(item.options)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' • ')
            : '';

          return (
            <div
              key={productId + idx}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Product Info */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {item.image && (
                  item.product?.slug ? (
                    <Link to={`/product/${item.product.slug}`} className="shrink-0 block">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-hairline/80 transition hover:scale-105"
                      />
                    </Link>
                  ) : (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-hairline/80 shrink-0"
                    />
                  )
                )}
                <div className="min-w-0 flex-1">
                  {item.product?.slug ? (
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="font-display text-xs sm:text-sm font-bold text-ink hover:text-gold-deep truncate block"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <h4 className="font-display text-xs sm:text-sm font-bold text-ink truncate">
                      {item.title}
                    </h4>
                  )}
                  {optionString && (
                    <p className="text-[11px] sm:text-xs text-ink-muted truncate mt-0.5">{optionString}</p>
                  )}
                  {hasReviewed && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Stars value={review.rating || 5} size={14} />
                      <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        ✓ Reviewed ({review.rating}/5)
                      </span>
                    </div>
                  )}
                  {hasReviewed && review.comment && (
                    <p className="mt-1 text-xs text-ink-soft italic line-clamp-1">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center gap-2 self-stretch sm:self-auto">
                {canReview ? (
                  hasReviewed ? (
                    <button
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-gold/50 bg-bone-soft px-3.5 py-2 text-xs font-semibold text-gold-deep shadow-2xs hover:bg-gold/15 transition"
                    >
                      <FiEdit3 size={13} />
                      <span>Edit Review</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ink shadow-2xs hover:bg-gold-light transition"
                    >
                      <HiStar size={14} className="fill-ink text-ink" />
                      <span>Write Review</span>
                    </button>
                  )
                ) : !isDelivered ? (
                  <span className="text-[11px] text-center w-full sm:w-auto text-ink-muted bg-bone-soft px-3 py-1.5 rounded-lg border border-hairline/60">
                    Awaiting Delivery
                  </span>
                ) : (
                  <span className="text-[11px] text-center w-full sm:w-auto text-ink-muted bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                    Review Expired
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal Dialog */}
      {activeItem && (
        <ReviewModal
          open={Boolean(activeItem)}
          onClose={() => setActiveItem(null)}
          order={order}
          item={activeItem}
          existingReview={reviewMap[String(activeItem.product?._id || activeItem.product || activeItem.productId)]}
          onSuccess={loadReviews}
        />
      )}
    </div>
  );
}
