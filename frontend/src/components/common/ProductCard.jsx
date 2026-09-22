import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
import { toast } from 'sonner';
import MediaImage from '@/components/ui/MediaImage';
import { formatINR } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthPrompt } from '@/store/authPromptStore';

function BadgeChip({ badge }) {
  if (!badge) return null;
  let label;
  if (badge === 'BEST')     label = 'Bestseller';
  else if (badge === 'NEW') label = 'New';
  else if (badge === 'LTD') label = 'Limited';
  else label = badge.length > 14 ? badge.slice(0, 14) + '…' : badge;

  return (
    <span className="inline-flex items-center rounded-md bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-ink shadow-sm">
      {label}
    </span>
  );
}

export default function ProductCard({ product, layout = 'default' }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const inWishlist = useWishlistStore((s) => s.items.some((p) => p.id === product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const promptAuth = useAuthPrompt((s) => s.show);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      promptAuth('Sign in to save items to your wishlist.');
      return;
    }
    toggleWishlist(product);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    toast.success(`Added ${product.title} to cart`);
    setTimeout(() => setAdded(false), 1800);
  };

  const discount =
    product.mrp && product.price < product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const filledStars = Math.round(Number(product.rating ?? 4.8));

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-hairline/70 bg-bone-soft transition-all duration-300 hover:border-gold/60 hover:shadow-[0_14px_38px_rgba(22,22,22,0.08)]">
      {/* ── 1. Image Container (Clean Luxury Display — Uniform 4:5 Edge-to-Edge) ──── */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-bone-muted"
      >
        <MediaImage
          src={product.image}
          alt={product.title}
          label={product.title}
          width={720}
          height={900}
          fit="cover"
          gravity="auto"
          className="h-full w-full"
          imgClassName="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
        {product.hover && product.hover !== product.image && (
          <MediaImage
            src={product.hover}
            alt=""
            label={product.title}
            width={720}
            height={900}
            fit="cover"
            gravity="auto"
            className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100"
            imgClassName="h-full w-full object-cover"
          />
        )}

        {/* Badge — top left */}
        {product.badge && (
          <div className="absolute left-2.5 top-2.5 z-10">
            <BadgeChip badge={product.badge} />
          </div>
        )}
      </Link>

      {/* ── 2. Card Content Body ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Header Row: Category/Title + Wishlist Icon on Right */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {product.category && (
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-deep">
                {product.category}
              </span>
            )}
            <h3 className="line-clamp-1 font-display text-[14px] font-semibold leading-snug text-ink transition-colors group-hover:text-gold-deep sm:text-[15px]">
              <Link to={`/product/${product.slug}`} className="hover:underline">
                {product.title}
              </Link>
            </h3>
          </div>

          {/* Wishlist Button beside Heading */}
          <button
            type="button"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlist}
            className="mt-0.5 shrink-0 rounded-full p-1 text-ink/45 transition-all duration-200 hover:scale-115 hover:text-gold active:scale-90"
          >
            <FiHeart
              size={17}
              className={`transition-all duration-200 ${
                inWishlist
                  ? 'text-gold fill-gold drop-shadow-sm'
                  : 'text-ink/40 hover:text-gold'
              }`}
            />
          </button>
        </div>

        {/* Description blurb if present & layout is default */}
        {product.description && layout !== 'compact' && (
          <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-ink-muted sm:text-xs">
            {product.description}
          </p>
        )}

        {/* Rating Stars & Count */}
        <div className="mt-1.5 flex items-center gap-1 sm:mt-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <HiStar
                key={i}
                size={12}
                className={i < filledStars ? 'text-gold' : 'text-ink/15'}
              />
            ))}
          </div>
          {product.reviews > 0 && (
            <span className="text-[10px] text-ink-muted sm:text-[11px]">
              ({product.reviews})
            </span>
          )}
        </div>

        {/* Price & Discount */}
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
          <span className="text-[15px] font-bold text-ink sm:text-[17px]">
            {formatINR(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-[11px] text-ink/35 line-through sm:text-xs">
                {formatINR(product.mrp)}
              </span>
              {discount > 0 && (
                <span className="rounded bg-sale/10 px-1 py-0.2 text-[9px] font-bold text-sale sm:text-[10px]">
                  {discount}% OFF
                </span>
              )}
            </>
          )}
        </div>

        {/* Add to Cart CTA Button */}
        <div className="mt-3 pt-1">
          <button
            onClick={handleAddToCart}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 active:scale-[0.98] sm:py-2.5 sm:text-[11px] ${
              added
                ? 'bg-success text-bone'
                : 'bg-gold-deep text-bone hover:bg-gold hover:shadow-sm'
            }`}
          >
            {added ? (
              <>
                <FiCheck size={13} />
                Added
              </>
            ) : (
              <>
                <FiShoppingBag size={13} />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

