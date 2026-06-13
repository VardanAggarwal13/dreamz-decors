import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronRight, FiLock, FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import { loadRazorpay } from '@/lib/loadRazorpay';
import { formatINR } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

const field = (k, v) => ({ ...{}, [k]: v });

export default function Checkout() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [method, setMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);
  const [saved, setSaved] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [mode, setMode] = useState('new'); // 'new' or a saved address id
  const [addr, setAddr] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const fillFromSaved = (a) =>
    setAddr({
      name: user?.name || '',
      phone: a.phone || user?.phone || '',
      line1: a.line1 || '',
      line2: a.line2 || '',
      city: a.city || '',
      state: a.state || '',
      pincode: a.pincode || '',
    });

  // Load saved addresses; preselect the default.
  useEffect(() => {
    api.get('/account/addresses').then((res) => {
      const list = res.data || [];
      setSaved(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) { setMode(def._id); fillFromSaved(def); }
    }).catch(() => {}).finally(() => setAddrLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSaved = (a) => { setMode(a._id); fillFromSaved(a); };

  const { freeThreshold, flatRate } = useSettingsStore((s) => s.settings.shipping);
  const shipping = subtotal >= freeThreshold ? 0 : flatRate;
  const total = subtotal + shipping;
  const set = (k) => (e) => setAddr((a) => ({ ...a, ...field(k, e.target.value) }));

  if (items.length === 0) {
    return (
      <div className="bg-bone">
        <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
          <h1 className="font-display text-3xl text-ink">Your cart is empty</h1>
          <Button asChild variant="primary" size="lg" className="mt-6">
            <Link to="/shop">Browse the collection</Link>
          </Button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const required = ['name', 'phone', 'line1', 'city', 'state', 'pincode'];
    for (const k of required) {
      if (!addr[k]?.trim()) {
        toast.error('Please complete the shipping address.');
        return false;
      }
    }
    if (!/^\d{6}$/.test(addr.pincode.trim())) {
      toast.error('Enter a valid 6-digit pincode.');
      return false;
    }
    return true;
  };

  // Push the local cart to the server so the order is built server-side.
  const syncCart = () =>
    api.put('/cart', {
      items: items.map((i) => ({ productId: i.id, qty: i.qty, options: i.options })),
    });

  const finishOrder = (orderId) => {
    clearCart();
    toast.success('Order placed!');
    navigate(`/order-success/${orderId}`, { replace: true });
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      await syncCart();
      const { data: order } = await api.post('/orders', {
        shippingAddress: addr,
        paymentMethod: method,
      });

      if (method === 'cod') {
        finishOrder(order._id);
        return;
      }

      // Razorpay flow
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load the payment gateway. Please retry.');

      const { data: rzp } = await api.post('/payments/razorpay/order', { orderId: order._id });

      const rz = new window.Razorpay({
        key: rzp.key,
        amount: rzp.amount,
        currency: rzp.currency,
        order_id: rzp.orderId,
        name: 'DreamzDecor',
        description: `Order ${String(order._id).slice(-8).toUpperCase()}`,
        prefill: { name: addr.name, contact: addr.phone, email: user?.email },
        theme: { color: '#c59e59' },
        handler: async (resp) => {
          try {
            await api.post('/payments/razorpay/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              orderId: order._id,
            });
            finishOrder(order._id);
          } catch (err) {
            toast.error(err.message || 'Payment verification failed.');
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled — your order is saved as pending.');
            setPlacing(false);
          },
        },
      });
      rz.open();
    } catch (err) {
      toast.error(err.message || 'Could not place the order.');
      setPlacing(false);
    }
  };

  return (
    <div className="bg-bone">
      <Seo title="Checkout — DreamzDecor" canonical="/checkout" noIndex />

      <div className="container-page py-8 sm:py-10">
        <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Link to="/cart" className="transition hover:text-gold-deep">Cart</Link>
          <FiChevronRight size={12} />
          <span className="text-ink-soft">Checkout</span>
        </nav>

        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">Checkout</h1>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] xl:gap-10">
          {/* Shipping address */}
          <div className="rounded-2xl border border-hairline/60 bg-bone-soft p-6 sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Shipping address</h2>

            {addrLoading && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[0, 1].map((i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)}
              </div>
            )}

            {!addrLoading && saved.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {saved.map((a) => (
                  <button
                    type="button"
                    key={a._id}
                    onClick={() => selectSaved(a)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                      mode === a._id ? 'border-gold bg-gold/10' : 'border-hairline bg-bone hover:border-gold/50'
                    }`}
                  >
                    <span className="font-medium text-ink">{a.label || 'Address'}{a.isDefault ? ' · Default' : ''}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink-soft">
                      {a.line1}, {[a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition ${
                    mode === 'new' ? 'border-gold text-gold-deep' : 'border-hairline text-ink-soft hover:border-gold/50'
                  }`}
                >
                  <FiPlus size={14} /> New address
                </button>
              </div>
            )}

            {!addrLoading && mode === 'new' && (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input value={addr.name} onChange={set('name')} placeholder="Your name" /></Field>
              <Field label="Phone"><Input value={addr.phone} onChange={set('phone')} placeholder="10-digit mobile" /></Field>
              <Field label="Address line 1" full><Input value={addr.line1} onChange={set('line1')} placeholder="House no, street" /></Field>
              <Field label="Address line 2 (optional)" full><Input value={addr.line2} onChange={set('line2')} placeholder="Area, landmark" /></Field>
              <Field label="City"><Input value={addr.city} onChange={set('city')} placeholder="City" /></Field>
              <Field label="State"><Input value={addr.state} onChange={set('state')} placeholder="State" /></Field>
              <Field label="Pincode"><Input value={addr.pincode} onChange={set('pincode')} placeholder="6-digit" /></Field>
            </div>
            )}

            {/* Payment method */}
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-ink">Payment method</h2>
            <div className="mt-4 space-y-3">
              <PayOption value="razorpay" current={method} onSelect={setMethod} title="Pay online (Razorpay)" desc="UPI, cards, net banking & wallets" />
              <PayOption value="cod" current={method} onSelect={setMethod} title="Cash on delivery" desc="Pay when your order arrives" />
            </div>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-hairline/60 bg-bone-soft p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Order summary</h2>
              <span className="mt-2 block h-0.5 w-10 bg-gold" />

              <ul className="mt-5 space-y-3">
                {items.map((i) => (
                  <li key={i.key} className="flex items-center gap-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-hairline bg-bone-muted">
                      {i.image && <img src={i.image} alt={i.title} className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{i.title}</span>
                      <span className="text-xs text-ink-muted">Qty {i.qty}</span>
                    </span>
                    <span className="text-sm font-medium text-ink">{formatINR(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-5 space-y-3 border-t border-hairline/60 pt-5 text-sm">
                <Row label="Subtotal" value={formatINR(subtotal)} />
                <Row label="Shipping" value={shipping === 0 ? 'Free' : formatINR(shipping)} valueClass={shipping === 0 ? 'text-gold-deep' : ''} />
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-hairline/70 pt-4">
                <span className="text-base font-semibold text-ink">Total</span>
                <span className="font-display text-2xl text-gold-deep">{formatINR(total)}</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="mt-5 w-full bg-gold-deep text-bone hover:bg-gold-deep/90"
                onClick={placeOrder}
                disabled={placing}
              >
                {placing ? 'Processing…' : <><FiLock size={15} /> Place order</>}
              </Button>
              <p className="mt-3 text-center text-[11px] text-ink-muted">Secure checkout · 100% encrypted</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, valueClass = '' }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`text-ink ${valueClass}`}>{value}</dd>
    </div>
  );
}

function PayOption({ value, current, onSelect, title, desc }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
        active ? 'border-gold bg-gold/10' : 'border-hairline bg-bone hover:border-gold/50'
      }`}
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${active ? 'border-gold-deep' : 'border-hairline'}`}>
        {active && <span className="h-2 w-2 rounded-full bg-gold-deep" />}
      </span>
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="text-xs text-ink-muted">{desc}</span>
      </span>
    </button>
  );
}
