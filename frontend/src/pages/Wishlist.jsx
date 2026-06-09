import { Link } from 'react-router-dom';
import { FiArrowRight, FiHeart } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import ProductGrid from '@/components/common/ProductGrid';
import { Button } from '@/components/ui/Button';
import { useWishlistStore } from '@/store/wishlistStore';

export default function Wishlist() {
  const items = useWishlistStore((s) => s.items);
  const clear = useWishlistStore((s) => s.clear);

  const seo = (
    <Seo title="Wishlist — DreamzDecors" description="Your saved pieces at DreamzDecors." canonical="/wishlist" noIndex />
  );

  if (items.length === 0) {
    return (
      <div className="bg-bone">
        {seo}
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline/60 bg-bone-soft text-ink-muted">
            <FiHeart size={26} />
          </div>
          <h1 className="mt-6 font-display text-4xl text-ink">Your wishlist is empty</h1>
          <p className="mt-3 max-w-sm text-sm leading-7 text-ink-soft">
            Tap the heart on any piece to save it here for later.
          </p>
          <Button asChild variant="primary" size="lg" className="mt-8">
            <Link to="/shop">Explore the collection <FiArrowRight /></Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bone">
      {seo}

      {/* Header */}
      <div className="border-b border-hairline/60">
        <div className="container-page py-8 text-center sm:py-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-gold-deep">Saved for later</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Your Wishlist</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'} you love
          </p>
        </div>
      </div>

      <div className="container-page py-8 sm:py-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="min-w-0 text-sm font-semibold uppercase tracking-[0.16em] text-ink">
            Wishlist <span className="text-ink-muted">({items.length})</span>
          </h2>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 text-xs text-ink-muted transition hover:text-sale"
          >
            Clear all
          </button>
        </div>

        <ProductGrid products={items} columns={4} />
      </div>
    </div>
  );
}
