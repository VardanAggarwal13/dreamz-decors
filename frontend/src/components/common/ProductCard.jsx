import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
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
  else label = badge.length > 12 ? badge.slice(0, 12) + '…' : badge;

  return (
    <span className="inline-flex items-center rounded-sm bg-gold px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink shadow-sm">
      {label}
    </span>
  );
}

// eslint-disable-next-line no-unused-vars
export default function ProductCard({ product, layout }) {
  const [hovered, setHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const inWishlist = useWishlistStore((s) => s.items.some((p) => p.id === product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const promptAuth = useAuthPrompt((s) => s.show);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) {
      promptAuth('Sign in to save items to your wishlist.');
      return;
    }
    toggleWishlist(product);
  };

  const discount =
    product.mrp && product.price < product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const filledStars = Math.round(Number(product.rating ?? 4.8));

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-hairline/60 bg-bone-soft transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(22,22,22,0.08)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image ─────────────────────────────────────────────── */}
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden">
        <div className="aspect-[4/3] w-full overflow-hidden bg-bone-muted">
          <MediaImage
            src={product.image}
            alt={product.title}
            label={product.title}
            imgClassName={`h-full w-full object-cover transition-transform duration-500 ${hovered ? 'scale-[1.04]' : 'scale-100'}`}
          />
          {product.hover && product.hover !== product.image && (
            <MediaImage
              src={product.hover}
              alt=""
              label={product.title}
              className={`absolute inset-0 transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`}
              imgClassName="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Badge — outside overflow-hidden div so it never clips */}
        {product.badge && (
          <div className="absolute left-3 top-3 z-10">
            <BadgeChip badge={product.badge} />
          </div>
        )}
      </Link>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-ink">
          <Link to={`/product/${product.slug}`} className="hover:text-accent">
            {product.title}
          </Link>
        </h3>

        {product.description && (
          <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-ink-muted">
            {product.description}
          </p>
        )}

        {/* Stars */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <HiStar
                key={i}
                size={13}
                className={i < filledStars ? 'text-gold' : 'text-ink/15'}
              />
            ))}
          </div>
          {product.reviews > 0 && (
            <span className="text-[11px] text-ink-muted">({product.reviews})</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[17px] font-bold text-gold">{formatINR(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-xs text-ink/35 line-through">{formatINR(product.mrp)}</span>
              {discount > 0 && (
                <span className="text-[10px] font-semibold text-sale">{discount}% off</span>
              )}
            </>
          )}
        </div>

        {/* Add to Cart + Wishlist */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => addItem(product)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-deep py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-bone transition hover:bg-gold"
          >
            <FiShoppingCart size={13} />
            Add to Cart
          </button>
          <button
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlist}
            className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border transition ${
              inWishlist
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-hairline/60 text-ink-soft hover:border-gold hover:text-gold'
            }`}
          >
            <FiHeart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}
