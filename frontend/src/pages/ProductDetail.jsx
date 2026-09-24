import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiStar } from 'react-icons/hi2';
import { 
  FiHeart, FiShoppingBag, FiShield, FiAward, FiMapPin, FiPackage, 
  FiTruck, FiCheck, FiChevronLeft, FiChevronRight, FiMaximize2, FiX, FiCheckCircle, 
  FiChevronDown, FiClock, FiLock, FiFeather, FiLayers, FiHelpCircle
} from 'react-icons/fi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import Seo from '@/components/common/Seo';
import MediaImage from '@/components/ui/MediaImage';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import ProductReviews from '@/components/common/ProductReviews';
import SectionHeader from '@/components/common/SectionHeader';
import useFetch from '@/hooks/useFetch';
import { productDescriptionFallback, productFeatureHighlights, contentPages } from '@/lib/siteContent';
import { breadcrumbSchema, absoluteUrl } from '@/lib/seo';
import { formatINR, normalizeProduct } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthPrompt } from '@/store/authPromptStore';

const formatVariantSize = (size = '') => {
  const clean = String(size).trim();
  if (!clean) return '';
  if (clean.includes('"') || clean.includes('inch')) return clean;
  return clean.replace(/[*xX]/g, '×') + '"';
};

const TRUST_ICONS = {
  shield: FiShield,
  award: FiAward,
  mapPin: FiMapPin,
  package: FiPackage,
  truck: FiTruck,
  check: FiCheck,
};

const CRAFTSMANSHIP_FEATURES = [
  {
    icon: FiLayers,
    title: '380 GSM Heavyweight Canvas',
    desc: 'Museum-grade textured poly-cotton canvas that gives rich tactile depth and vibrant archival brilliance.',
  },
  {
    icon: FiFeather,
    title: 'Ultra-HD Giclée Pigment Print',
    desc: '12-color archival pigment inks with 2400 DPI micro-detail fidelity, rated fade-proof for 100+ years.',
  },
  {
    icon: FiAward,
    title: 'Kiln-Dried Pine Wood Frame',
    desc: 'Handcrafted 1.5-inch deep solid pine wood stretcher bars that resist seasonal warping and bending.',
  },
  {
    icon: FiPackage,
    title: 'Triple-Layer Armour Packaging',
    desc: 'Reinforced wooden corner protectors, heavy-duty bubble wrap, and corrugated outer shell for 100% safe transit.',
  },
];

const FAQS = [
  {
    q: 'Is the artwork ready to hang immediately on arrival?',
    a: 'Yes! Every canvas comes fully gallery-wrapped around a 1.5-inch solid wooden stretcher with pre-installed heavy-duty brass mounting brackets and wall hooks included in the box.',
  },
  {
    q: 'How is the artwork protected during transit?',
    a: 'We use a 3-stage armour packaging system: reinforced high-density corner guards, multi-layered shock-absorbing bubble wrap, and a heavy corrugated shipping carton to ensure your art arrives in flawless museum condition.',
  },
  {
    q: 'How do I care for and clean this canvas?',
    a: 'Our canvases are coated with a protective water-resistant matte satin seal. To clean, simply wipe gently with a soft dry or slightly damp microfiber cloth. Avoid harsh chemical cleaners and direct prolonged outdoor moisture.',
  },
  {
    q: 'What happens if my parcel is damaged during courier delivery?',
    a: 'We offer a 100% Damage-Free Delivery Guarantee. In the rare event of transit damage, share photos with our support team within 48 hours of delivery and we will dispatch an expedited replacement at zero extra cost.',
  },
];

const TABS = ['Description', 'Specifications & Details', 'Shipping & Packaging'];

export default function ProductDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/products/${slug}`, { deps: [slug] });
  const product = useMemo(() => normalizeProduct(data?.data), [data]);

  const related = useFetch(
    product?.categoryId ? `/products?category=${product.categoryId}&limit=4&sort=bestselling` : null,
    { deps: [product?.categoryId] }
  );
  const relatedList = useMemo(
    () => (related.data?.data || []).map(normalizeProduct),
    [related.data]
  )
    .filter((item) => item.id !== product?.id)
    .slice(0, 4);

  const [size, setSize] = useState('');
  const [frame, setFrame] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState(TABS[0]);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const addItem = useCartStore((state) => state.addItem);
  const inWishlist = useWishlistStore((state) => state.items.some((p) => p.id === product?.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const user = useAuthStore((state) => state.user);
  const promptAuth = useAuthPrompt((state) => state.show);

  const trustRes = useFetch('/content/product', { deps: [], cache: 'dd:content:product' });
  const trustBadges = trustRes.data?.data?.trustBadges?.length
    ? trustRes.data.data.trustBadges
    : contentPages.product.trustBadges;

  const handleWishlist = () => {
    if (!user) {
      promptAuth('Sign in to save items to your wishlist.');
      return;
    }
    toggleWishlist(product);
  };

  const variants = product?.variants || [];
  const variantSizes = useMemo(
    () => [...new Set(variants.map((variant) => variant.size).filter(Boolean))],
    [variants]
  );
  const availableFrames = useMemo(
    () => variants.filter((variant) => variant.size === size && variant.price != null && variant.frame && variant.frame.trim()),
    [size, variants]
  );
  const selectedVariant =
    (frame ? availableFrames.find((variant) => variant.frame === frame) : null) ||
    variants.find((variant) => variant.size === size) ||
    variants[0];

  const selectedPrice = selectedVariant?.price ?? product?.price ?? 0;
  const selectedMrp = selectedVariant?.mrp ?? product?.mrp;
  const availableStock =
    selectedVariant?.stock != null
      ? Number(selectedVariant.stock)
      : product?.stock != null
      ? Number(product.stock)
      : 10;
  const isOutOfStock = availableStock <= 0;

  useEffect(() => {
    if (!variantSizes.length) return;
    if (!variantSizes.includes(size)) {
      const matched = variants.find((v) => v.price === product?.price && v.size) || variants[0];
      setSize(matched?.size || variantSizes[0]);
    }
  }, [size, variantSizes, variants, product?.price]);

  useEffect(() => {
    if (availableStock > 0 && qty > availableStock) {
      setQty(availableStock);
    }
  }, [availableStock, qty]);

  useEffect(() => {
    if (availableFrames.length > 0 && !availableFrames.some((variant) => variant.frame === frame)) {
      setFrame(availableFrames[0]?.frame || '');
    } else if (availableFrames.length === 0 && frame) {
      setFrame('');
    }
  }, [availableFrames, frame]);

  if (loading) {
    return (
      <div className="bg-bone min-h-screen">
        <div className="container-page py-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-24 w-full" />
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

  const schemaPrice = Number(selectedPrice) || 0;
  const priceValidUntil = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  })();
  const reviewCount = Number(product.reviews) || 0;
  const ratingValue = Math.min(5, Math.max(1, Number(product.rating) || 0));

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: [currentImage, ...gallery.map((item) => item.url).filter(Boolean)].filter(Boolean),
    description: productDescription,
    brand: { '@type': 'Brand', name: 'DreamzDecors' },
    sku: product.slug,
    ...(schemaPrice > 0
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: schemaPrice,
            priceValidUntil,
            itemCondition: 'https://schema.org/NewCondition',
            availability:
              product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url: absoluteUrl(`/product/${product.slug}`),
          },
        }
      : {}),
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: ratingValue.toFixed(1),
            reviewCount,
          },
        }
      : {}),
  };

  const productBreadcrumb = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: categoryLabel, path: product.category ? `/${product.category}` : '/shop' },
    { name: product.title, path: `/product/${product.slug}` },
  ]);

  const handleAdd = () => {
    if (isOutOfStock) {
      toast.error('This item is currently out of stock');
      return;
    }
    addItem({ ...product, price: selectedPrice, stock: availableStock }, qty, {
      size: selectedVariant?.size ? formatVariantSize(selectedVariant.size) : undefined,
      frame: selectedVariant?.frame,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="bg-[#FAF8F5] text-ink pb-20 lg:pb-0">
      <Seo
        title={`${product.title} - DreamzDecors`}
        description={productDescription}
        canonical={canonicalUrl}
        image={currentImage}
        type="product"
        schema={[productSchema, productBreadcrumb]}
      />

      <div className="container-page py-6 sm:py-10">
        {/* ── Breadcrumb ──────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link to="/" className="transition hover:text-gold-deep">Home</Link>
          <FiChevronRight size={12} />
          <Link to="/shop" className="transition hover:text-gold-deep">Collections</Link>
          <FiChevronRight size={12} />
          <span className="capitalize text-ink-soft">{categoryLabel}</span>
        </nav>

        {/* ── Main Product Grid (Gallery + Details) ───────────── */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-start">
          
          {/* Gallery Showcase (Left Column - 6 Cols) */}
          <div className="space-y-3.5 lg:col-span-6 lg:sticky lg:top-24">
            <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-hairline/80 bg-[#F5F2EB] p-2 sm:p-4 shadow-sm flex items-center justify-center">
              {/* Premium Badge */}
              <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-1.5 rounded-full bg-bone/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-deep shadow-sm backdrop-blur-md border border-gold/30">
                <span>✦ Museum Grade Canvas</span>
              </div>

              <MediaImage
                src={currentImage}
                alt={product.title}
                label={product.title}
                width={1200}
                height={1500}
                fit="contain"
                priority
                className="h-full w-full flex items-center justify-center"
                imgClassName="h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.02]"
              />

              {/* Previous Image Arrow */}
              {gallery.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((prev) => (prev - 1 + gallery.length) % gallery.length);
                  }}
                  aria-label="Previous artwork image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-bone/90 text-ink shadow-lg backdrop-blur-md transition-all hover:bg-bone hover:text-gold-deep hover:scale-110 active:scale-95 border border-hairline/80 focus:outline-none"
                >
                  <FiChevronLeft size={20} />
                </button>
              )}

              {/* Next Image Arrow */}
              {gallery.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg((prev) => (prev + 1) % gallery.length);
                  }}
                  aria-label="Next artwork image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-bone/90 text-ink shadow-lg backdrop-blur-md transition-all hover:bg-bone hover:text-gold-deep hover:scale-110 active:scale-95 border border-hairline/80 focus:outline-none"
                >
                  <FiChevronRight size={20} />
                </button>
              )}

              {/* Image Counter Pill */}
              {gallery.length > 1 && (
                <div className="absolute top-3.5 right-3.5 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-md border border-white/10">
                  {activeImg + 1} / {gallery.length}
                </div>
              )}

              {/* Lightbox / Zoom trigger */}
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="View fullscreen artwork"
                className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 rounded-full bg-bone/95 px-3.5 py-1.5 text-[11px] font-medium text-ink shadow-md backdrop-blur-md transition-all hover:bg-bone hover:text-gold-deep hover:scale-105 active:scale-95 border border-hairline"
              >
                <FiMaximize2 size={13} />
                <span>Fullscreen View</span>
              </button>
            </div>

            {/* Thumbnails */}
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3">
                {gallery.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImg(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`aspect-[4/5] overflow-hidden rounded-xl border bg-[#F5F2EB] p-1 transition-all ${
                      activeImg === index
                        ? 'border-gold ring-2 ring-gold/60 shadow-sm'
                        : 'border-hairline/70 hover:border-gold/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <MediaImage
                      src={img.url}
                      alt=""
                      label={product.title}
                      width={300}
                      height={375}
                      fit="contain"
                      className="h-full w-full"
                      imgClassName="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Visual Reassurance Bar */}
            <div className="rounded-xl border border-hairline/80 bg-bone-soft/60 p-3.5 text-xs text-ink-soft flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-ink">In Stock &amp; Ready to Ship</span>
              </div>
              <span className="text-ink-muted">· Premium Quality Guarantee</span>
            </div>
          </div>

          {/* Product Details & Purchase Form (Right Column - 6 Cols) */}
          <div className="lg:col-span-6 space-y-5 lg:pl-2">
            
            {/* Category & Badge */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-deep">
                {categoryLabel}
              </span>
              <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
                {product.title}
              </h1>
            </div>

            {/* Rating Stars & Quick Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="flex text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <HiStar key={i} size={16} className={i < (rounded || 5) ? 'text-gold' : 'text-hairline'} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-ink ml-1">
                  {product.rating ? Number(product.rating).toFixed(1) : '5.0'}
                </span>
              </div>
              <span className="text-hairline">|</span>
              <span className="text-xs text-ink-muted">({product.reviews || 0} customer reviews)</span>
              <span className="text-hairline">|</span>
              <span className="text-xs font-medium text-emerald-700">✓ Verified Authentic Art</span>
            </div>

            <hr className="border-hairline/70" />

            {/* Price Box */}
            <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-3xl sm:text-4xl font-bold text-ink">
                  {formatINR(selectedPrice)}
                </span>
                {selectedMrp && selectedMrp > selectedPrice && (
                  <>
                    <span className="text-base text-ink/40 line-through sm:text-lg">
                      {formatINR(selectedMrp)}
                    </span>
                    <span className="rounded-md bg-sale/15 px-2.5 py-0.5 text-xs font-bold text-sale">
                      {Math.round(((selectedMrp - selectedPrice) / selectedMrp) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">
                Inclusive of all taxes · <span className="font-medium text-ink">Free Express Delivery across India</span>
              </p>
            </div>

            {/* Short Description */}
            <p className="text-sm leading-relaxed text-ink-soft">
              {productDescription}
            </p>

            {/* Size Selector */}
            {variantSizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">
                    1. Select Canvas Size (Inches)
                  </span>
                  <span className="text-[11px] font-medium text-gold-deep">
                    Standard &amp; Gallery Sizes
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {variantSizes.map((option) => {
                    const optVariant = variants.find((v) => v.size === option);
                    const isSelected = size === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSize(option)}
                        className={`group relative flex flex-col items-start justify-center rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-gold bg-gold/15 text-gold-deep ring-2 ring-gold/40 shadow-sm font-semibold'
                            : 'border-hairline bg-bone-soft text-ink-soft hover:border-gold/50 hover:bg-bone hover:text-ink'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-semibold text-ink">
                          {formatVariantSize(option)}
                        </span>
                        {optVariant?.price != null && (
                          <span className={`mt-0.5 text-[11px] sm:text-xs ${isSelected ? 'font-bold text-gold-deep' : 'text-ink-muted'}`}>
                            {formatINR(optVariant.price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Frame Selector (when custom frames exist) */}
            {availableFrames.length > 0 && availableFrames.some((f) => f.frame && f.frame.trim()) && (
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  2. Select Frame Finish
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {availableFrames.map((option) => (
                    <button
                      key={option._id || `${option.size}-${option.frame}`}
                      type="button"
                      onClick={() => setFrame(option.frame)}
                      className={`rounded-xl border p-2.5 text-center text-xs font-medium transition sm:text-sm ${
                        selectedVariant?.frame === option.frame
                          ? 'border-gold bg-gold/15 font-semibold text-gold-deep ring-2 ring-gold/40 shadow-sm'
                          : 'border-hairline bg-bone-soft text-ink-soft hover:border-gold/50'
                      }`}
                    >
                      {option.frame}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">Quantity</span>
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-sale">Out of Stock</span>
                ) : availableStock <= 5 ? (
                  <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    ⚠️ Only {availableStock} left in stock — order soon!
                  </span>
                ) : (
                  <span className="text-xs text-ink-muted">
                    {availableStock} units available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center rounded-xl border border-hairline bg-bone-soft shadow-sm ${isOutOfStock ? 'opacity-40 pointer-events-none' : ''}`}>
                  <button
                    type="button"
                    className="px-3.5 py-2 text-base text-ink-soft transition hover:text-ink disabled:opacity-30"
                    onClick={() => setQty((value) => Math.max(1, value - 1))}
                    disabled={qty <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-ink">{isOutOfStock ? 0 : qty}</span>
                  <button
                    type="button"
                    className="px-3.5 py-2 text-base text-ink-soft transition hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (qty < availableStock) {
                        setQty((value) => value + 1);
                      } else {
                        toast.info(`Only ${availableStock} unit${availableStock === 1 ? '' : 's'} available in stock`);
                      }
                    }}
                    disabled={qty >= availableStock || isOutOfStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-ink-muted">Ready to hang · Mounting hardware included</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                disabled={isOutOfStock}
                className={`w-full py-3.5 text-sm uppercase tracking-wider font-semibold transition-all shadow-md ${
                  isOutOfStock ? 'opacity-50 cursor-not-allowed bg-ink/30' : added ? 'bg-success hover:bg-success' : 'hover:scale-[1.01]'
                }`}
                onClick={handleAdd}
              >
                {isOutOfStock ? (
                  'Out of Stock'
                ) : added ? (
                  <>
                    <FiCheck size={18} /> Added to Cart
                  </>
                ) : (
                  <>
                    <FiShoppingBag size={18} /> Add to Cart · {formatINR(selectedPrice * qty)}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={`w-full py-3 text-xs uppercase tracking-wider font-medium ${
                  inWishlist ? 'border-gold text-gold-deep bg-gold/10' : ''
                }`}
                onClick={handleWishlist}
              >
                <FiHeart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                {inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>

            {/* Key Delivery & Trust Guarantees Box */}
            <div className="rounded-2xl border border-hairline/80 bg-bone-soft/80 p-4 space-y-3 text-xs text-ink-soft">
              <div className="flex items-start gap-3">
                <FiTruck className="mt-0.5 text-gold-deep shrink-0" size={16} />
                <div>
                  <span className="font-semibold text-ink">Free Express Delivery: </span>
                  Dispatches within 24–48 hours. Delivered in 4–7 business days across India.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiShield className="mt-0.5 text-gold-deep shrink-0" size={16} />
                <div>
                  <span className="font-semibold text-ink">100% Transit Protection Guarantee: </span>
                  Damage-free arrival guaranteed, or we ship a free replacement immediately.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiLock className="mt-0.5 text-gold-deep shrink-0" size={16} />
                <div>
                  <span className="font-semibold text-ink">Safe &amp; Secure Checkout: </span>
                  Supports UPI, Credit/Debit Cards, NetBanking, and Wallets.
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. Craftsmanship & Quality Standards Section ─────── */}
        <section className="mt-10 sm:mt-14 border-t border-hairline/70 pt-8 sm:pt-10">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-gold-deep">
              The DreamzDecors Standard
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">
              Crafted for Spiritual Grace &amp; Lasting Elegance
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-ink-soft leading-relaxed">
              Every artwork is meticulously produced using museum-grade archival materials, ensuring deep spiritual reverence and enduring beauty on your wall.
            </p>
          </div>

          <div className="mt-7 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {CRAFTSMANSHIP_FEATURES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 transition-all duration-300 hover:border-gold/50 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-3.5 font-display text-base font-bold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Tabs: Specifications, Description, Packaging ── */}
        <section className="mt-10 sm:mt-12 border-t border-hairline/70 pt-8 sm:pt-10">
          <div className="flex flex-wrap gap-4 border-b border-hairline/70 sm:gap-8">
            {TABS.map((label) => (
              <button
                key={label}
                onClick={() => setTab(label)}
                className={`-mb-px border-b-2 pb-3 pt-1 text-xs sm:text-sm font-semibold tracking-wide transition ${
                  tab === label
                    ? 'border-gold text-gold-deep font-bold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 sm:mt-6 max-w-4xl">
            {tab === 'Description' && (
              <div className="prose max-w-none text-xs sm:text-sm leading-relaxed text-ink-soft space-y-3.5">
                <p>{productDescription}</p>
                <div className="mt-5 rounded-2xl border border-hairline/80 bg-bone-soft p-4 sm:p-5">
                  <h4 className="font-display text-sm font-bold text-ink mb-2.5 uppercase tracking-wider">
                    Key Highlights
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-soft">
                    {productFeatureHighlights.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <FiCheck className="text-gold-deep shrink-0" size={14} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === 'Specifications & Details' && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-hairline/80 bg-bone-soft">
                  <table className="w-full text-xs sm:text-sm">
                    <tbody>
                      <tr className="border-b border-hairline/60">
                        <td className="w-1/3 px-4 py-3 font-semibold text-ink bg-bone/50">Collection</td>
                        <td className="px-4 py-3 text-ink-soft capitalize">{categoryLabel}</td>
                      </tr>
                      <tr className="border-b border-hairline/60">
                        <td className="px-4 py-3 font-semibold text-ink bg-bone/50">Canvas Quality</td>
                        <td className="px-4 py-3 text-ink-soft">380 GSM Heavyweight Matte Canvas</td>
                      </tr>
                      <tr className="border-b border-hairline/60">
                        <td className="px-4 py-3 font-semibold text-ink bg-bone/50">Printing Technique</td>
                        <td className="px-4 py-3 text-ink-soft">12-Color Archival Pigment Giclée (2400 DPI)</td>
                      </tr>
                      <tr className="border-b border-hairline/60">
                        <td className="px-4 py-3 font-semibold text-ink bg-bone/50">Frame &amp; Stretcher</td>
                        <td className="px-4 py-3 text-ink-soft">1.5-inch Deep Kiln-Dried Solid Pine Wood</td>
                      </tr>
                      <tr className="border-b border-hairline/60">
                        <td className="px-4 py-3 font-semibold text-ink bg-bone/50">Mounting Hardware</td>
                        <td className="px-4 py-3 text-ink-soft">Pre-installed Brass Brackets · Ready to Hang</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-ink bg-bone/50">Care Guide</td>
                        <td className="px-4 py-3 text-ink-soft">Dust with a soft microfiber cloth. Avoid water exposure.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'Shipping & Packaging' && (
              <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-4 sm:p-5 space-y-3 text-xs sm:text-sm leading-relaxed text-ink-soft">
                <p>
                  <strong className="text-ink">Archival Packaging Standard:</strong> Every canvas is individually protected with custom high-density corner guards, wrapped in heavy-gauge shock-absorbing bubble cushioning, and encased in a 5-ply rigid corrugated delivery box.
                </p>
                <p>
                  <strong className="text-ink">Delivery Timeframe:</strong> Orders are hand-prepared and dispatched within 24–48 hours. Estimated delivery across metro cities is 4–6 business days and 6–8 business days for other regions across India.
                </p>
                <p>
                  <strong className="text-ink">Zero-Risk Transit Guarantee:</strong> If your shipment is compromised or damaged during courier transit, contact us within 48 hours and we will ship a brand-new replacement immediately at no cost.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── 4. Frequently Asked Questions (Accordion) ────────── */}
        <section className="mt-10 sm:mt-12 border-t border-hairline/70 pt-8 sm:pt-10">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-gold-deep">
              Have Questions?
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">
              Frequently Asked Questions
            </h2>

            <div className="mt-5 sm:mt-6 space-y-2.5">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-hairline/80 bg-bone-soft overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="flex w-full items-center justify-between p-4 text-left font-display text-sm font-semibold text-ink hover:text-gold-deep transition-colors"
                  >
                    <span>{faq.q}</span>
                    <FiChevronDown
                      size={16}
                      className={`text-gold-deep transition-transform duration-200 shrink-0 ml-3 ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="border-t border-hairline/50 p-4 pt-2 text-xs leading-relaxed text-ink-soft">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Customer Reviews ──────────────────────────────── */}
        <section className="mt-10 sm:mt-12 border-t border-hairline/70 pt-8 sm:pt-10">
          <ProductReviews productId={product.id} rating={product.rating} reviews={product.reviews} />
        </section>

        {/* ── 6. You May Also Like / Related Artworks ──────────── */}
        {(related.loading || relatedList.length > 0) && (
          <section className="mt-10 sm:mt-12 border-t border-hairline/70 pt-8 sm:pt-10">
            <SectionHeader eyebrow="Curated For You" title="More Masterpieces To Explore" />
            {related.loading ? (
              <ProductGridSkeleton columns={4} count={4} />
            ) : (
              <ProductGrid products={relatedList} columns={4} />
            )}
          </section>
        )}

      </div>

      {/* ── Sticky Mobile Action Bar (screens < lg) ──────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline/80 bg-bone-soft/95 px-4 py-3 backdrop-blur-md pb-safe lg:hidden shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">{product.title}</p>
            <p className="text-sm font-bold text-gold-deep">{formatINR(selectedPrice)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleWishlist}
              aria-label="Wishlist"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                inWishlist ? 'border-gold bg-gold/10 text-gold' : 'border-hairline text-ink-soft'
              }`}
            >
              <FiHeart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              className="h-10 px-5 text-xs uppercase tracking-wider font-semibold"
            >
              <FiShoppingBag size={14} /> Add
            </Button>
          </div>
        </div>
      </div>

      {/* ── High-Resolution Lightbox Modal ──────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 hover:scale-110"
            aria-label="Close fullscreen view"
          >
            <FiX size={24} />
          </button>

          {/* Lightbox Previous Arrow */}
          {gallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImg((prev) => (prev - 1 + gallery.length) % gallery.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/25 hover:scale-110 active:scale-95"
              aria-label="Previous fullscreen image"
            >
              <FiChevronLeft size={26} />
            </button>
          )}

          {/* Lightbox Next Arrow */}
          {gallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImg((prev) => (prev + 1) % gallery.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/25 hover:scale-110 active:scale-95"
              aria-label="Next fullscreen image"
            >
              <FiChevronRight size={26} />
            </button>
          )}

          <div
            className="relative max-h-[92vh] max-w-[92vw] overflow-hidden rounded-2xl shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={product.title}
              className="max-h-[85vh] max-w-[88vw] object-contain rounded-xl shadow-2xl"
            />
            <div className="absolute bottom-3 inset-x-0 text-center">
              <span className="inline-block rounded-full bg-black/70 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md border border-white/10 shadow-lg">
                {product.title} {gallery.length > 1 ? `(${activeImg + 1} of ${gallery.length})` : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

