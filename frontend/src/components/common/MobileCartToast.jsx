import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiCheck, FiShoppingBag, FiArrowRight, FiX } from 'react-icons/fi';
import { useCartStore } from '@/store/cartStore';
import { formatINR } from '@/lib/utils';
import { cldTransform } from '@/lib/cloudinary';

export default function MobileCartToast() {
  const lastAddedItem = useCartStore((state) => state.lastAddedItem);
  const clearLastAdded = useCartStore((state) => state.clearLastAdded);
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [imgError, setImgError] = useState(false);

  // When a new item is added, show the sticky mobile toast and start the 1-minute auto-dismiss timer
  useEffect(() => {
    if (!lastAddedItem) {
      setVisible(false);
      return;
    }

    // Don't show toast if user is already on the Cart or Checkout page
    if (location.pathname === '/cart' || location.pathname === '/checkout') {
      setVisible(false);
      return;
    }

    setVisible(true);
    setImgError(false);

    // Keep sticky bar visible for 1 minute (60 seconds)
    const timer = setTimeout(() => {
      setVisible(false);
      clearLastAdded();
    }, 60000);

    return () => clearTimeout(timer);
  }, [lastAddedItem, location.pathname, clearLastAdded]);

  // Hide when navigating
  useEffect(() => {
    setVisible(false);
    clearLastAdded();
  }, [location.pathname]);

  if (!visible || !lastAddedItem) return null;

  const rawImage =
    (typeof lastAddedItem.image === 'string' && lastAddedItem.image) ||
    lastAddedItem.images?.[0]?.url ||
    (typeof lastAddedItem.images?.[0] === 'string' && lastAddedItem.images[0]) ||
    '';

  const thumbUrl = rawImage
    ? cldTransform(rawImage, { width: 128, height: 128, crop: 'fill', gravity: 'auto' }) || rawImage
    : '';

  return (
    <aside
      aria-label="Item added to cart notification"
      className="fixed inset-x-2 sm:inset-x-4 bottom-3 z-50 mx-auto max-w-sm sm:max-w-md rounded-2xl border border-gold/40 bg-bone-soft/95 p-2.5 sm:p-3 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 lg:hidden pb-safe"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Product Thumbnail */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-hairline/80 bg-bone-muted shadow-sm">
          {thumbUrl && !imgError ? (
            <img
              src={thumbUrl}
              alt={lastAddedItem.title}
              className="h-full w-full object-cover transition-opacity duration-200"
              loading="eager"
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gold/10 text-gold-deep">
              <FiShoppingBag size={20} />
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
            <FiCheck size={10} strokeWidth={3} />
          </span>
        </div>

        {/* Product Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Added to Cart
            </span>
          </div>
          <p className="truncate text-xs font-semibold text-ink leading-tight mt-0.5">
            {lastAddedItem.title}
          </p>
          <p className="text-[11px] font-medium text-ink-soft mt-0.5">
            {lastAddedItem.qty > 1 ? `${lastAddedItem.qty} × ` : ''}
            <span className="font-bold text-gold-deep">
              {formatINR(lastAddedItem.price * (lastAddedItem.qty || 1))}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/cart"
            onClick={() => {
              setVisible(false);
              clearLastAdded();
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-gold px-2.5 sm:px-3 py-2 text-xs font-semibold text-ink-dark shadow-sm transition hover:bg-gold-deep active:scale-95 whitespace-nowrap"
          >
            <span>View Cart</span>
            <FiArrowRight size={13} />
          </Link>

          <button
            type="button"
            onClick={() => {
              setVisible(false);
              clearLastAdded();
            }}
            aria-label="Dismiss notification"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-black/5 active:scale-90"
          >
            <FiX size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
