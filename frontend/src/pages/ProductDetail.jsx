import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiStar } from 'react-icons/hi2';
import { FiHeart, FiRefreshCw, FiShield, FiTruck } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import SectionHeader from '@/components/common/SectionHeader';
import useFetch from '@/hooks/useFetch';
import { formatINR, normalizeProduct } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

const sizes = ['S - 12x16"', 'M - 18x24"', 'L - 24x36"', 'XL - 30x45"'];
const frames = ['No Frame', 'Black Frame', 'Walnut Frame', 'White Frame'];

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/products/${slug}`, { deps: [slug] });
  const product = useMemo(() => normalizeProduct(data?.data), [data]);

  const related = useFetch(
    product?.categoryId ? `/products?category=${product.categoryId}&limit=4&sort=bestselling` : null,
    { deps: [product?.categoryId], skip: !product?.categoryId }
  );
  const relatedList = (related.data?.data || [])
    .map(normalizeProduct)
    .filter((item) => item.id !== product?.id)
    .slice(0, 4);

  const [size, setSize] = useState(sizes[1]);
  const [frame, setFrame] = useState(frames[0]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-page grid min-h-[50vh] place-items-center text-center">
        <div>
          <h1 className="font-display text-3xl">Product not found</h1>
          <p className="mt-3 text-ink/70">
            {error ? error.message : 'This product may have been removed.'}
          </p>
          <Button asChild variant="primary" size="md" className="mt-6">
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const gallery = product.images?.length ? product.images : product.image ? [{ url: product.image }] : [];
  const currentImage = gallery[activeImg]?.url || product.image;

  return (
    <div className="container-page py-10">
      <nav className="text-xs uppercase tracking-[0.22em] text-ink/50">
        <Link to="/shop" className="hover:text-ink">
          Shop
        </Link>
        {product.category && (
          <>
            <span className="px-2">/</span>
            <Link to={`/shop/${product.category}`} className="hover:text-ink">
              {(product.categoryTitle || product.category).replace('-', ' ')}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-md bg-bone-muted">
            {currentImage && (
              <img src={currentImage} alt={product.title} className="h-full w-full object-cover" />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImg(index)}
                  className={`aspect-square overflow-hidden rounded-md bg-bone-muted ring-offset-2 ring-offset-bone ${
                    activeImg === index ? 'ring-2 ring-accent' : ''
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.badge && <Badge variant="accent">{product.badge}</Badge>}
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">{product.title}</h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-ink/70">
            <span className="flex items-center gap-1 text-accent">
              <HiStar /> {Number(product.rating).toFixed(1)}
            </span>
            <span>-</span>
            <span>{product.reviews} verified reviews</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{formatINR(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-base text-ink/45 line-through">{formatINR(product.mrp)}</span>
                <span className="text-sm font-semibold text-accent">
                  {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-ink/60">Inclusive of all taxes - Free shipping over Rs. 1,499</p>

          {product.description && (
            <p className="mt-6 text-sm leading-relaxed text-ink/75">{product.description}</p>
          )}

          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.22em] text-ink/60">Size</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((option) => (
                <button
                  key={option}
                  onClick={() => setSize(option)}
                  className={`rounded-md border px-4 py-2 text-sm transition ${
                    size === option
                      ? 'border-accent bg-accent text-bone'
                      : 'border-ink/20 text-ink/80 hover:border-ink'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.22em] text-ink/60">Frame</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {frames.map((option) => (
                <button
                  key={option}
                  onClick={() => setFrame(option)}
                  className={`rounded-md border px-4 py-2 text-sm transition ${
                    frame === option
                      ? 'border-accent bg-accent text-bone'
                      : 'border-ink/20 text-ink/80 hover:border-ink'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-ink/20">
              <button
                className="px-4 py-2 text-lg text-ink/70 hover:text-ink"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                aria-label="Decrease"
              >
                -
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                className="px-4 py-2 text-lg text-ink/70 hover:text-ink"
                onClick={() => setQty((value) => value + 1)}
                aria-label="Increase"
              >
                +
              </button>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => addItem(product, qty, { size, frame })}
            >
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" aria-label="Wishlist">
              <FiHeart />
            </Button>
          </div>

          <Button variant="neon" size="lg" className="mt-3 w-full">
            Buy Now - {formatINR(product.price * qty)}
          </Button>

          <ul className="mt-8 grid grid-cols-1 gap-3 border-t border-ink/8 pt-6 text-sm text-ink/75 sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <FiTruck /> Ships in 7-10 days
            </li>
            <li className="flex items-center gap-2">
              <FiRefreshCw /> 7-day easy returns
            </li>
            <li className="flex items-center gap-2">
              <FiShield /> Quality guaranteed
            </li>
          </ul>
        </div>
      </div>

      <section className="py-20">
        <SectionHeader eyebrow="You may also like" title="More to explore." />
        {related.loading ? (
          <ProductGridSkeleton columns={4} count={4} />
        ) : (
          <ProductGrid products={relatedList} columns={4} />
        )}
      </section>
    </div>
  );
}
