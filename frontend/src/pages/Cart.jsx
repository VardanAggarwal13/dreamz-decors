import { Link } from 'react-router-dom';
import { FiTrash2, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';
import { formatINR } from '@/lib/utils';

export default function Cart() {
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  const shipping = subtotal === 0 ? 0 : subtotal >= 1499 ? 0 : 99;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container-page grid place-items-center py-32 text-center">
        <h1 className="font-display text-4xl">Your cart is empty</h1>
        <p className="mt-3 max-w-md text-ink/70">
          Looks quiet here. Let's fix that — there's a lot to love in our latest drop.
        </p>
        <Button asChild variant="primary" size="lg" className="mt-8">
          <Link to="/shop">Start Shopping <FiArrowRight /></Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl">Your Cart</h1>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-ink/8">
            {items.map((i) => (
              <li key={i.key} className="flex gap-4 py-6">
                <div className="aspect-square w-24 shrink-0 overflow-hidden rounded-md bg-bone-muted">
                  <img src={i.image} alt={i.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/product/${i.slug}`} className="text-sm font-medium hover:text-accent">
                        {i.title}
                      </Link>
                      {i.options && Object.values(i.options).filter(Boolean).length > 0 && (
                        <div className="mt-1 text-xs text-ink/60">
                          {Object.entries(i.options).filter(([, v]) => v).map(([, v]) => v).join(' · ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(i.key)}
                      aria-label="Remove"
                      className="text-ink/55 hover:text-accent"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-md border border-ink/20">
                      <button onClick={() => updateQty(i.key, i.qty - 1)} className="px-3 py-1 hover:text-accent">−</button>
                      <span className="w-8 text-center text-sm">{i.qty}</span>
                      <button onClick={() => updateQty(i.key, i.qty + 1)} className="px-3 py-1 hover:text-accent">+</button>
                    </div>
                    <span className="text-sm font-medium">{formatINR(i.price * i.qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-md border border-ink/8 bg-bone-soft p-6 shadow-soft">
          <h2 className="font-display text-2xl">Order Summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{shipping === 0 ? 'Free' : formatINR(shipping)}</dd>
            </div>
            {shipping === 0 && subtotal > 0 && (
              <div className="text-xs text-accent-deep">You unlocked free shipping ✦</div>
            )}
            <div className="border-t border-ink/8 pt-3 flex justify-between text-base font-semibold">
              <dt>Total</dt><dd>{formatINR(total)}</dd>
            </div>
          </dl>
          <Button variant="primary" size="lg" className="mt-6 w-full">
            Proceed to Checkout <FiArrowRight />
          </Button>
          <p className="mt-3 text-center text-xs text-ink/50">
            Razorpay · UPI · Cards · Net Banking · COD
          </p>
        </aside>
      </div>
    </div>
  );
}
