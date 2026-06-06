import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

// Happy-path progress steps. cancelled/refunded are handled separately.
const STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const STEP_INDEX = {
  pending: 0,
  paid: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function ProgressTracker({ status }) {
  const current = STEP_INDEX[status] ?? 0;
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  done ? 'border-gold bg-gold text-bone' : 'border-hairline bg-bone text-ink-muted'
                }`}
              >
                {done ? <FiCheck size={14} /> : i + 1}
              </span>
              <span className={`mt-2 text-[10px] uppercase tracking-[0.14em] ${done ? 'text-ink' : 'text-ink-muted'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`mx-1 mb-5 h-px flex-1 ${i < current ? 'bg-gold' : 'bg-hairline'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/${id}`);
        if (!cancelled) setOrder(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load this order.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const addr = order?.shippingAddress || {};
  const isClosed = order && ['cancelled', 'refunded'].includes(order.status);

  return (
    <div className="bg-bone-soft">
      <Seo title={`Order ${shortId(id)} — DreamzDecor`} description="Order details" canonical={`/account/orders/${id}`} noIndex />

      <div className="container-page py-10 sm:py-14">
        <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-ink-soft transition hover:text-gold-deep">
          <FiArrowLeft size={15} /> All orders
        </Link>

        {loading ? (
          <div className="mt-8 h-72 animate-pulse rounded-2xl border border-hairline/60 bg-bone" />
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-sale/25 bg-sale/8 px-5 py-4 text-sm text-sale">{error}</div>
        ) : !order ? null : (
          <>
            {/* Header */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl text-ink sm:text-4xl">Order {shortId(order._id)}</h1>
                <p className="mt-1.5 text-sm text-ink-muted">Placed on {fmtDateTime(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Progress / closed banner */}
            <div className="mt-8 rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
              {isClosed ? (
                <p className="text-sm text-ink-soft">
                  This order was <span className="font-medium text-ink">{order.status}</span>
                  {order.status === 'refunded' ? ' — your refund has been processed.' : '.'}
                </p>
              ) : (
                <ProgressTracker status={order.status} />
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* Items */}
              <div className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted">Items</h2>
                <ul className="mt-5 divide-y divide-hairline/50">
                  {(order.items || []).map((it, idx) => (
                    <li key={idx} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-hairline bg-bone-muted">
                        {it.image && <img src={it.image} alt={it.title} className="h-full w-full object-cover" />}
                      </span>
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{it.title}</p>
                          <p className="mt-1 text-xs text-ink-muted">Qty {it.qty}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink">{formatINR(it.price * it.qty)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Summary + address + payment */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
                  <h2 className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted">Summary</h2>
                  <dl className="mt-5 space-y-2.5 text-sm">
                    <Row label="Subtotal" value={formatINR(order.subtotal)} />
                    <Row label="Shipping" value={order.shipping ? formatINR(order.shipping) : 'Free'} />
                    {order.discount > 0 && <Row label="Discount" value={`− ${formatINR(order.discount)}`} />}
                    <div className="mt-3 flex items-center justify-between border-t border-hairline/60 pt-3">
                      <dt className="text-sm font-semibold text-ink">Total</dt>
                      <dd className="text-base font-semibold text-ink">{formatINR(order.total)}</dd>
                    </div>
                  </dl>
                </div>

                {(addr.line1 || addr.city) && (
                  <div className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
                    <h2 className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted">Shipping to</h2>
                    <address className="mt-4 text-sm not-italic leading-7 text-ink-soft">
                      {addr.label && <span className="block font-medium text-ink">{addr.label}</span>}
                      {addr.line1 && <span className="block">{addr.line1}</span>}
                      {addr.line2 && <span className="block">{addr.line2}</span>}
                      <span className="block">
                        {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </span>
                      {addr.country && <span className="block">{addr.country}</span>}
                      {addr.phone && <span className="block">{addr.phone}</span>}
                    </address>
                  </div>
                )}

                <div className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
                  <h2 className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted">Payment</h2>
                  <p className="mt-4 text-sm text-ink-soft">
                    Method:{' '}
                    <span className="font-medium uppercase text-ink">
                      {order.payment?.method === 'cod' ? 'Cash on delivery' : 'Razorpay'}
                    </span>
                  </p>
                  {order.payment?.paidAt && (
                    <p className="mt-1 text-sm text-ink-soft">Paid on {fmtDateTime(order.payment.paidAt)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button asChild variant="outline" size="md">
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
