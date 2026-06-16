import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiArrowLeft,
  FiShoppingBag,
  FiX,
  FiChevronRight,
} from 'react-icons/fi';
import { ShieldCheck, Package, RotateCcw, Truck } from 'lucide-react';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import MediaImage from '@/components/ui/MediaImage';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import useFetch from '@/hooks/useFetch';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { formatINR, normalizeProduct } from '@/lib/utils';

function QtyButton({ onClick, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-ink-soft transition hover:border-gold/50 hover:bg-gold/10 hover:text-ink"
    >
      {children}
    </button>
  );
}

export default function Cart() {
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const patchItem = useCartStore((state) => state.patchItem);
  const clear = useCartStore((state) => state.clear);
  const subtotal = useCartStore((state) => state.subtotal());

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

  // Popular picks to fill the layout when the cart is sparse.
  const recos = useFetch('/products?limit=6&sort=bestselling');
  const cartIds = new Set(items.map((i) => i.id));
  const recommended = (recos.data?.data || [])
    .map(normalizeProduct)
    .filter((p) => !cartIds.has(p.id))
    .slice(0, 3);
  const showRecommendations = items.length > 0 && items.length <= 2;

  const WHY_SHOP = [
    { Icon: ShieldCheck, title: 'Secure Payments', text: '100% encrypted & safe checkout' },
    { Icon: Package, title: 'Premium Packaging', text: 'Each piece carefully wrapped & boxed' },
    { Icon: RotateCcw, title: 'Easy Returns', text: '7-day hassle-free return policy' },
    { Icon: Truck, title: 'Free Shipping', text: 'Free delivery on all orders' },
  ];

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const shipping = 0; // Free delivery on all orders

  const gstIncluded = Math.round(subtotal - subtotal / 1.18);
  const total = subtotal + shipping;

  const seo = (
    <Seo title="Cart — DreamzDecors" description="Review your DreamzDecors items before checkout." canonical="/cart" noIndex />
  );

  // ── Empty state ──
  if (items.length === 0) {
    return (
      <div className="bg-bone">
        {seo}
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline/60 bg-bone-soft text-ink-muted">
            <FiShoppingBag size={28} />
          </div>
          <h1 className="mt-6 font-display text-4xl text-ink">Your cart is empty</h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-ink-soft">
            Looks quiet here — there is a lot to love in our latest collection.
          </p>
          <Button asChild variant="primary" size="lg" className="mt-8">
            <Link to="/shop">Start shopping <FiArrowRight /></Link>
          </Button>
        </div>
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] xl:gap-8">

          {/* ── Left: items ───────────────────────────────────── */}
          <div>
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
                  className="relative flex gap-4 rounded-2xl border border-hairline/60 bg-bone-soft p-4"
                >
                  {/* Thumbnail */}
                  <Link
                    to={`/product/${item.slug}`}
                    className="aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-bone-muted sm:w-28"
                  >
                    <MediaImage src={item.image} alt={item.title} label={item.title} />
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
                      <div className="flex shrink-0 items-center gap-2">
                        <QtyButton onClick={() => updateQty(item.key, item.qty - 1)} label="Decrease">−</QtyButton>
                        <span className="w-8 text-center text-sm font-medium text-ink">{item.qty}</span>
                        <QtyButton onClick={() => updateQty(item.key, item.qty + 1)} label="Increase">+</QtyButton>
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

            {/* Recommendations — fills the column when the cart is sparse */}
            {showRecommendations && (recos.loading || recommended.length > 0) && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">You may also like</h2>
                <div className="mt-5">
                  {recos.loading ? (
                    <ProductGridSkeleton columns={3} count={3} />
                  ) : (
                    <ProductGrid products={recommended} columns={3} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: summary + why-shop ─────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Order summary */}
            <div className="rounded-2xl border border-hairline/60 bg-bone-soft p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Order Summary</h2>
              <span className="mt-2 block h-0.5 w-10 bg-gold" />

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal ({count} item{count === 1 ? '' : 's'})</dt>
                  <dd className="text-ink">{formatINR(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd className={shipping === 0 ? 'font-medium text-gold-deep' : 'text-ink'}>
                    {shipping === 0 ? 'Free' : formatINR(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">GST (18% incl.)</dt>
                  <dd className="text-ink">{formatINR(gstIncluded)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-hairline/70 pt-4">
                <span className="text-base font-semibold text-ink">Total</span>
                <span className="font-display text-2xl text-gold-deep">{formatINR(total)}</span>
              </div>

              <Button
                asChild
                variant="primary"
                size="md"
                className="mt-5 w-full bg-gold-deep text-bone hover:bg-gold-deep/90"
              >
                <Link to="/checkout">
                  <FiShoppingBag size={16} /> Proceed to Checkout
                </Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="mt-2 w-full text-gold-deep hover:bg-gold/10">
                <Link to="/shop"><FiArrowLeft size={14} /> Continue Shopping</Link>
              </Button>
            </div>

            {/* Why shop with us */}
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
        </div>
      </div>
    </div>
  );
}
