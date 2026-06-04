import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { HiStar } from 'react-icons/hi2';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const discount =
    product.mrp && product.price < product.mrp
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <article
      className="group relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden rounded-md bg-bone-muted">
        <div className="aspect-[4/5] w-full">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-500 ${hovered && product.hover ? 'opacity-0' : 'opacity-100'}`}
          />
          {product.hover && (
            <img
              src={product.hover}
              alt=""
              loading="lazy"
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>

        {product.badge && (
          <div className="absolute left-3 top-3">
            <Badge variant={product.badge.startsWith('-') ? 'accent' : product.badge === 'NEW' ? 'neon' : 'default'}>
              {product.badge}
            </Badge>
          </div>
        )}

        <button
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-bone-soft/85 text-ink backdrop-blur-sm hover:text-accent shadow-soft"
        >
          <FiHeart size={16} />
        </button>

        <div
          className={`absolute inset-x-3 bottom-3 transition-all duration-300 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
          >
            Add to Cart
          </Button>
        </div>
      </Link>

      <div className="mt-4">
        <h3 className="line-clamp-1 text-sm font-medium text-ink">
          <Link to={`/product/${product.slug}`} className="hover:text-accent">
            {product.title}
          </Link>
        </h3>

        <div className="mt-1 flex items-center gap-2 text-xs text-ink/60">
          <span className="flex items-center gap-1">
            <HiStar className="text-accent" size={14} /> {product.rating ?? '4.8'}
          </span>
          <span>·</span>
          <span>{product.reviews ?? 0} reviews</span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-ink">{formatINR(product.price)}</span>
          {product.mrp && product.mrp > product.price && (
            <>
              <span className="text-xs text-ink/45 line-through">{formatINR(product.mrp)}</span>
              <span className="text-xs font-semibold text-accent">{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
