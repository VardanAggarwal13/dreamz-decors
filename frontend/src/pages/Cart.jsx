import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowLeft,
  FiShoppingBag,
  FiX,
  FiChevronRight,
} from 'react-icons/fi';
import {
  ShieldCheck,
  Package,
  RotateCcw,
  Truck,
  Flame,
  Compass,
} from 'lucide-react';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import MediaImage from '@/components/ui/MediaImage';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import ProductCarousel from '@/components/common/ProductCarousel';
import useFetch from '@/hooks/useFetch';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatINR, normalizeProduct } from '@/lib/utils';

function QtyButton({ onClick, children, label, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md border text-ink-soft transition ${
        disabled
          ? 'border-hairline/40 opacity-30 cursor-not-allowed'
          : 'border-hairline hover:border-gold/50 hover:bg-gold/10 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default function Cart() {
  const items = useCartStore((state) => state.items);
  const loading = useCartStore((state) => state.loading);
  const loaded = useCartStore((state) => state.loaded);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const patchItem = useCartStore((state) => state.patchItem);
  const clear = useCartStore((state) => state.clear);
  const subtotal = useCartStore((state) => state.subtotal());
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);

  // Backfill descriptions onto items saved before we started capturing them,
  // so older carts show the product blurb without needing a re-add.
  useEffect(() => {
    items
      .filter((i) => i.slug && i.description === undefined)
      .forEach((i) => {
        api
          .get(`/products/${i.slug}`)
          .then((res) => patchItem(i.key, { description: res.data?.data?.description || '' }))
          .catch(() => patchItem(i.key, { description: '' }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Popular bestselling picks to drive upsells & conversion
  const recos = useFetch('/products?limit=12&sort=bestselling');
  const cartIds = new Set(items.map((i) => i.id));
  const recommended = (recos.data?.data || [])
    .map(normalizeProduct)
    .filter((p) => !cartIds.has(p.id))
    .slice(0, 8);

  const WHY_SHOP = [
    { Icon: ShieldCheck, title: 'Secure Payments', text: '100% encrypted & safe checkout' },
    { Icon: Package, title: 'Premium Packaging', text: 'Each piece carefully wrapped & boxed' },
    { Icon: RotateCcw, title: 'Easy Returns', text: '7-day hassle-free return policy' },
    { Icon: Truck, title: 'Insured Delivery', text: 'Safe & tracked pan-India delivery' },
  ];

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const shipping = 0; // Free delivery on all orders
  const total = subtotal + shipping;

  const seo = (
    <Seo title="Cart — DreamzDecors" description="Review your DreamzDecors items before checkout." canonical="/cart" noIndex />
  );

  // ── Loading state (while hydrating or fetching cart data) ──
  if (items.length === 0 && (!loaded || loading || authStatus === 'loading')) {
    return (
      <div className="bg-bone min-h-[60vh] py-10 sm:py-16">
        {seo}
        <div className="container-page max-w-6xl">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-hairline/60" />
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] xl:gap-8 items-start">
            <div className="space-y-4">
              <div className="h-32 w-full animate-pulse rounded-2xl border border-hairline/60 bg-bone-soft" />
              <div className="h-32 w-full animate-pulse rounded-2xl border border-hairline/60 bg-bone-soft" />
            </div>
            <div className="h-72 w-full animate-pulse rounded-2xl border border-hairline/60 bg-bone-soft" />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <div className="bg-bone">
        {seo}
        <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline/60 bg-bone-soft text-ink-muted">
            <FiShoppingBag size={28} />
          </div>
          <h1 className="mt-6 font-display text-3xl text-ink sm:text-4xl">Your cart is empty</h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-ink-soft">
            Looks quiet here — discover our bestselling canvases, gallery sets, and handcrafted statement art for your home.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3 w-full sm:w-auto">
            <Button asChild variant="primary" size="sm" className="w-full bg-gold-deep text-bone hover:bg-gold-deep/90 shadow-xs uppercase tracking-[0.12em] text-[11px] font-semibold px-4 py-2.5 rounded-lg sm:w-auto sm:text-xs sm:tracking-[0.16em] sm:px-6 sm:py-3 sm:rounded-xl">
              <Link to="/shop?sort=bestselling" className="flex items-center justify-center gap-1.5">
                <Flame size={13} /> Find Bestsellers
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full border-gold/50 bg-white text-gold-deep hover:bg-gold/10 uppercase tracking-[0.12em] text-[11px] font-semibold px-4 py-2.5 rounded-lg sm:w-auto sm:text-xs sm:tracking-[0.16em] sm:px-6 sm:py-3 sm:rounded-xl">
              <Link to="/shop" className="flex items-center justify-center gap-1.5">
                <Compass size={13} /> Explore All Art <FiArrowRight size={12} />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bestselling items directly under empty cart for instant recovery */}
        {(recos.loading || recommended.length > 0) && (
          <div className="border-t border-hairline/60 bg-bone-soft/40 py-12">
            <div className="container-page">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-deep">
                    Customer Favorites
                  </span>
                  <h2 className="text-xl font-display text-ink sm:text-2xl mt-0.5">
                    Start With Our Bestselling Artworks
                  </h2>
                </div>
                <Button asChild variant="outline" size="sm" className="border-gold/40 text-gold-deep hover:bg-gold/10 text-xs font-semibold self-start sm:self-auto uppercase tracking-wider">
                  <Link to="/shop?sort=bestselling" className="flex items-center gap-1.5">
                    <Flame size={13} /> View All Bestsellers <FiArrowRight size={13} />
                  </Link>
                </Button>
              </div>

              {recos.loading ? (
                <ProductGridSkeleton columns={3} count={3} />
              ) : (
                <ProductGrid products={recommended} columns={3} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-bone">
      {seo}

      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <div className="container-page pt-4">
        <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link to="/" className="transition hover:text-gold-deep">Home</Link>
          <FiChevronRight size={12} />
          <Link to="/shop" className="transition hover:text-gold-deep">Shop</Link>
          <FiChevronRight size={12} />
          <span className="text-ink-soft">Shopping Cart</span>
        </nav>
      </div>

      {/* ── Centered header ─────────────────────────────────────── */}
      <div className="border-b border-hairline/60">
        <div className="container-page py-6 text-center sm:py-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-gold-deep">Your selection</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Shopping Cart</h1>
          <p className="mt-2 text-sm text-ink-soft">Review your curated pieces before checkout</p>
        </div>
      </div>

      <div className="container-page py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] xl:gap-8 items-start">

          {/* ── 1. Cart Items (Desktop: Left top, Mobile: 1st) ───────────────── */}
          <div className="lg:col-start-1 lg:row-start-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">
                Cart Items <span className="text-ink-muted">({count})</span>
              </h2>
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition hover:text-sale"
              >
                <FiX size={13} /> Clear All
              </button>
            </div>

            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="relative flex gap-3.5 rounded-2xl border border-hairline/60 bg-bone-soft p-3.5 sm:gap-4 sm:p-4"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/product/${item.slug}`}
                    className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-bone-muted sm:w-24 md:w-28"
                  >
                    <MediaImage src={item.image} alt={item.title} label={item.title} width={240} height={300} />
                  </Link>

                  {/* Content (pr-6 reserves space for the absolute remove ✕) */}
                  <div className="flex min-w-0 flex-1 flex-col pr-6">
                    {item.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                        {item.category}
                      </span>
                    )}
                    <Link
                      to={`/product/${item.slug}`}
                      className="mt-1 font-display text-lg leading-snug text-ink transition hover:text-gold-deep sm:text-xl"
                    >
                      {item.title}
                    </Link>

                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-soft">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-auto flex flex-col items-start gap-3 pt-3 sm:flex-row sm:items-end sm:justify-between">
                      {/* Qty */}
                      <div>
                        <div className="flex shrink-0 items-center gap-2">
                          <QtyButton onClick={() => updateQty(item.key, item.qty - 1)} label="Decrease">−</QtyButton>
                          <span className="w-8 text-center text-sm font-medium text-ink">{item.qty}</span>
                          <QtyButton
                            onClick={() => updateQty(item.key, item.qty + 1)}
                            disabled={item.stock != null && item.qty >= item.stock}
                            label="Increase"
                          >
                            +
                          </QtyButton>
                        </div>
                        {item.stock != null && item.qty >= item.stock && (
                          <span className="mt-1 block text-[10px] font-semibold text-amber-700">
                            Max stock reached ({item.stock})
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-left sm:text-right">
                        <div className="font-display text-lg text-gold-deep sm:text-xl">
                          {formatINR(item.price * item.qty)}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          {item.qty > 1 ? `${formatINR(item.price)} × ${item.qty}` : 'per piece'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    aria-label="Remove item"
                    className="absolute right-4 top-4 text-ink/35 transition hover:text-sale"
                  >
                    <FiX size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 2. Order summary & payment / Why shop (Desktop: Right sticky, Mobile: 2nd, after Cart Items) ── */}
          <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-24 lg:self-start">
            {/* Order summary */}
            <div className="rounded-2xl border border-hairline/60 bg-bone-soft p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Order Summary</h2>
              <span className="mt-2 block h-0.5 w-10 bg-gold" />

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal ({count} item{count === 1 ? '' : 's'})</dt>
                  <dd className="text-ink font-medium">{formatINR(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd>
                    {shipping === 0 ? (
                      <span className="inline-flex items-center rounded-md border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-700 shadow-2xs">
                        FREE
                      </span>
                    ) : (
                      <span className="font-medium text-ink">{formatINR(shipping)}</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex items-baseline justify-between border-t border-hairline/70 pt-4">
                <div>
                  <span className="text-base font-semibold text-ink">Total</span>
                  <span className="block text-[11px] font-normal text-ink-muted">(includes all taxes)</span>
                </div>
                <span className="font-display text-2xl text-gold-deep">{formatINR(total)}</span>
              </div>

              <Button
                asChild
                variant="primary"
                size="md"
                className="mt-5 w-full bg-gold-deep text-bone hover:bg-gold-deep/90"
              >
                <Link to={user ? "/checkout" : "/login?redirect=/checkout"}>
                  <FiShoppingBag size={16} /> Proceed to Checkout
                </Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="mt-2 w-full text-gold-deep hover:bg-gold/10">
                <Link to="/shop"><FiArrowLeft size={14} /> Continue Shopping</Link>
              </Button>
            </div>

            {/* Why shop with us / Payment trust indicators */}
            <div className="rounded-2xl border border-hairline/60 bg-bone-soft p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Why shop with us</h3>
              <ul className="mt-4 space-y-3.5">
                {WHY_SHOP.map(({ Icon, title, text }) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
                      <Icon size={16} className="text-gold-deep" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-ink-soft">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── 3. You May Also Like (Desktop: Left middle, Mobile: 3rd, after Order Summary & Payment) ── */}
          {(recos.loading || recommended.length > 0) && (
            <div className="lg:col-start-1 lg:row-start-2">
              <ProductCarousel
                title="You may also like"
                subtitle="Curated bestsellers chosen to complement your selection"
                products={recommended}
                loading={recos.loading}
                skeletonCount={4}
              />
            </div>
          )}

          {/* ── 4. Curated Collections (Desktop: Left bottom, Mobile: 4th, after You May Also Like) ── */}
          <div className="lg:col-start-1 lg:row-start-3 rounded-2xl border border-hairline/80 bg-bone-soft/80 p-4 sm:p-7 text-center shadow-xs">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-gold-deep sm:text-[10px] sm:tracking-[0.3em]">
              Curated Collections
            </span>
            <h3 className="mt-1 font-display text-lg text-ink sm:text-2xl">
              Discover More for Your Home
            </h3>
            <p className="mx-auto mt-1.5 max-w-lg text-[11px] leading-relaxed text-ink-soft sm:mt-2 sm:text-sm">
              Looking for the perfect piece to elevate your space? Browse our most loved bestselling masterworks or explore the entire collection.
            </p>

            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:mt-6 sm:flex-row sm:gap-3.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full border-gold/50 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-deep shadow-2xs transition-all hover:border-gold hover:bg-gold/10 rounded-lg sm:w-auto sm:px-6 sm:py-2.5 sm:text-xs sm:tracking-[0.16em] sm:rounded-xl"
              >
                <Link to="/shop?sort=bestselling" className="flex items-center justify-center gap-1.5">
                  <Flame size={13} className="shrink-0" /> Find Bestsellers
                </Link>
              </Button>

              <Button
                asChild
                variant="primary"
                size="sm"
                className="w-full bg-gold-deep px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-bone shadow-xs transition-all hover:bg-gold rounded-lg sm:w-auto sm:px-6 sm:py-2.5 sm:text-xs sm:tracking-[0.16em] sm:rounded-xl"
              >
                <Link to="/shop" className="flex items-center justify-center gap-1.5">
                  <Compass size={13} className="shrink-0" /> Explore More Collections <FiArrowRight size={12} className="shrink-0" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
