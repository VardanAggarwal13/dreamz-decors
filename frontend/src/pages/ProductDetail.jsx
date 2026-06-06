import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiStar } from 'react-icons/hi2';
import { FiHeart, FiShoppingBag, FiShield, FiAward, FiMapPin, FiChevronRight } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import Seo from '@/components/common/Seo';
import MediaImage from '@/components/ui/MediaImage';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import SectionHeader from '@/components/common/SectionHeader';
import useFetch from '@/hooks/useFetch';
import { productDescriptionFallback, productFeatureHighlights } from '@/lib/siteContent';
import { formatINR, normalizeProduct } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

const formatVariantSize = (size = '') => `${String(size).replace('x', '×')}"`;

const TRUST = [
  { Icon: FiShield, label: 'Secure Packaging' },
  { Icon: FiAward, label: 'Handcrafted' },
  { Icon: FiMapPin, label: 'Made in India' },
];

const TABS = ['Description', 'Details & Dimensions', 'Shipping & Packaging'];

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/products/${slug}`, { deps: [slug] });
  const product = useMemo(() => normalizeProduct(data?.data), [data]);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const related = useFetch(
    product?.categoryId ? `/products?category=${product.categoryId}&limit=4&sort=bestselling` : null,
    { deps: [product?.categoryId], skip: !product?.categoryId }
  );
  const relatedList = (related.data?.data || [])
    .map(normalizeProduct)
    .filter((item) => item.id !== product?.id)
    .slice(0, 3);

  const [size, setSize] = useState('');
  const [frame, setFrame] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState(TABS[0]);
  const addItem = useCartStore((state) => state.addItem);
  const inWishlist = useWishlistStore((state) => state.items.some((p) => p.id === product?.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  const variants = product?.variants || [];
  const variantSizes = useMemo(
    () => [...new Set(variants.map((variant) => variant.size).filter(Boolean))],
    [variants]
  );
  const availableFrames = useMemo(
    () => variants.filter((variant) => variant.size === size && variant.price != null),
    [size, variants]
  );
  const selectedVariant =
    availableFrames.find((variant) => variant.frame === frame) || availableFrames[0];
  const selectedPrice = selectedVariant?.price ?? product?.price ?? 0;

  useEffect(() => {
    if (!variantSizes.length) return;
    if (!variantSizes.includes(size)) setSize(variantSizes[0]);
  }, [size, variantSizes]);

  useEffect(() => {
    if (availableFrames.length && !availableFrames.some((variant) => variant.frame === frame)) {
      setFrame(availableFrames[0].frame);
    }
  }, [availableFrames, frame]);

  if (loading) {
    return (
      <div className="bg-bone">
        <div className="container-page py-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-bone">
        <div className="container-page grid min-h-[50vh] place-items-center text-center">
          <div>
            <h1 className="font-display text-3xl">Product not found</h1>
            <p className="mt-3 text-ink-soft">
              {error ? error.message : 'This product may have been removed.'}
            </p>
            <Button asChild variant="primary" size="md" className="mt-6">
              <Link to="/shop">Back to Shop</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const gallery = product.images?.length ? product.images : product.image ? [{ url: product.image }] : [];
  const currentImage = gallery[activeImg]?.url || product.image;
  const productDescription = product.description || productDescriptionFallback;
  const rounded = Math.round(Number(product.rating) || 0);
  const canonicalUrl = `/product/${product.slug}`;
  const categoryLabel = (product.categoryTitle || product.category || 'Collections').replace('-', ' ');

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: [currentImage, ...gallery.map((item) => item.url).filter(Boolean)].filter(Boolean),
    description: productDescription,
    brand: { '@type': 'Brand', name: 'DreamzDecors' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: selectedPrice,
      availability: 'https://schema.org/InStock',
      url: `${origin}/product/${product.slug}`,
    },
    aggregateRating:
      product.rating && product.reviews
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(product.rating).toFixed(1),
            reviewCount: product.reviews,
          }
        : undefined,
  };

  const handleAdd = () =>
    addItem({ ...product, price: selectedPrice }, qty, {
      size: selectedVariant?.size ? formatVariantSize(selectedVariant.size) : undefined,
      frame: selectedVariant?.frame,
    });

  return (
    <div className="bg-bone">
      <Seo
        title={`${product.title} - DreamzDecors`}
        description={productDescription}
        canonical={canonicalUrl}
        schema={productSchema}
      />

      <div className="container-page py-8 sm:py-10">
        {/* ── Breadcrumb ──────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link to="/" className="transition hover:text-gold-deep">Home</Link>
          <FiChevronRight size={12} />
          <Link to="/shop" className="transition hover:text-gold-deep">Collections</Link>
          <FiChevronRight size={12} />
          <span className="capitalize text-ink-soft">{categoryLabel}</span>
        </nav>

        {/* ── Gallery + Info ──────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-2xl border border-hairline/60 bg-bone-muted">
              <MediaImage src={currentImage} alt={product.title} label={product.title} />
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {gallery.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImg(index)}
                    className={`aspect-square overflow-hidden rounded-xl border bg-bone-muted transition ${
                      activeImg === index ? 'border-gold ring-1 ring-gold' : 'border-hairline/70 hover:border-gold/50'
                    }`}
                  >
                    <MediaImage src={img.url} alt="" label={product.title} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:pt-2">
            <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <HiStar key={i} size={18} className={i < rounded ? 'text-gold' : 'text-hairline'} />
                ))}
              </div>
              <span className="text-sm text-ink-muted">({product.reviews} reviews)</span>
            </div>

            <hr className="mt-5 border-hairline/60" />

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl text-ink">{formatINR(selectedPrice)}</span>
              {product.mrp > selectedPrice && (
                <>
                  <span className="text-lg text-ink/40 line-through">{formatINR(product.mrp)}</span>
                  <span className="text-sm font-medium text-sale">
                    {Math.round(((product.mrp - selectedPrice) / product.mrp) * 100)}% off
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 max-w-md text-sm leading-7 text-ink-soft">
              {productDescription.length > 160 ? `${productDescription.slice(0, 157)}…` : productDescription}
            </p>

            {/* Size */}
            {variantSizes.length > 0 && (
              <div className="mt-7">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted">Size</div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {variantSizes.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSize(option)}
                      className={`rounded-full border px-5 py-2.5 text-sm transition ${
                        size === option
                          ? 'border-gold bg-gold/15 font-medium text-gold-deep'
                          : 'border-hairline bg-bone text-ink-soft hover:border-gold/50'
                      }`}
                    >
                      {formatVariantSize(option)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frame (only when the product offers framing) */}
            {availableFrames.length > 1 && (
              <div className="mt-6">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted">Frame</div>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {availableFrames.map((option) => (
                    <button
                      key={option._id || `${option.size}-${option.frame}`}
                      onClick={() => setFrame(option.frame)}
                      className={`rounded-full border px-5 py-2.5 text-sm transition ${
                        selectedVariant?.frame === option.frame
                          ? 'border-gold bg-gold/15 font-medium text-gold-deep'
                          : 'border-hairline bg-bone text-ink-soft hover:border-gold/50'
                      }`}
                    >
                      {option.frame}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-7">
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-muted">Quantity</div>
              <div className="mt-3 inline-flex items-center rounded-full border border-hairline bg-bone">
                <button
                  className="px-4 py-2.5 text-lg text-ink-soft transition hover:text-ink"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-medium text-ink">{qty}</span>
                <button
                  className="px-4 py-2.5 text-lg text-ink-soft transition hover:text-ink"
                  onClick={() => setQty((value) => value + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-7 space-y-3">
              <Button variant="primary" size="lg" className="w-full" onClick={handleAdd}>
                <FiShoppingBag size={16} /> Add to Cart
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={`w-full ${inWishlist ? 'border-gold text-gold-deep' : ''}`}
                onClick={() => toggleWishlist(product)}
              >
                <FiHeart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>

            <hr className="mt-8 border-hairline/60" />

            {/* Trust row */}
            <ul className="mt-7 grid grid-cols-3 gap-4 text-center">
              {TRUST.map(({ Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2">
                  <Icon size={20} className="text-gold-deep" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div className="mt-14 border-t border-hairline/60 pt-2 sm:mt-16">
          <div className="flex flex-wrap gap-6 border-b border-hairline/60">
            {TABS.map((label) => (
              <button
                key={label}
                onClick={() => setTab(label)}
                className={`-mb-px border-b-2 pb-3 pt-4 text-sm transition ${
                  tab === label
                    ? 'border-gold font-medium text-ink'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 max-w-3xl">
            {tab === 'Description' && (
              <p className="text-sm leading-8 text-ink-soft">{productDescription}</p>
            )}

            {tab === 'Details & Dimensions' && (
              <div className="space-y-5">
                {variantSizes.length > 0 && (
                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
                    <span className="w-44 shrink-0 text-sm font-medium text-ink">Available sizes</span>
                    <span className="text-sm leading-7 text-ink-soft">
                      {variantSizes.map(formatVariantSize).join(' · ')}
                    </span>
                  </div>
                )}
                <ul className="space-y-3 border-t border-hairline/50 pt-5">
                  {productFeatureHighlights.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-7 text-ink-soft">
                      <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === 'Shipping & Packaging' && (
              <div className="space-y-3 text-sm leading-8 text-ink-soft">
                <p>
                  Every piece is foam-cornered and bubble-wrapped so your artwork arrives in pristine
                  condition. Orders are processed within 1–3 business days.
                </p>
                <p>
                  Standard delivery takes 6–10 business days to metro cities and 10–12 days to other
                  locations across India, with tracking shared once dispatched. Free shipping on eligible
                  orders over ₹1,499.
                </p>
                <Link to="/shipping" className="inline-block font-medium text-accent underline-offset-2 hover:underline">
                  Read full shipping &amp; delivery policy
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── You may also like ───────────────────────────────── */}
        {(related.loading || relatedList.length > 0) && (
          <section className="py-16 sm:py-20">
            <SectionHeader eyebrow="You may also like" title="More to explore." />
            {related.loading ? (
              <ProductGridSkeleton columns={3} count={3} />
            ) : (
              <ProductGrid products={relatedList} columns={3} />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
