import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/orders/me');
        if (!cancelled) setOrders(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load your orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <Seo title="My Orders — DreamzDecor" description="Track your DreamzDecor orders." canonical="/account/orders" noIndex />

      <h1 className="font-display text-2xl text-ink sm:text-3xl">My orders</h1>

      <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-hairline/60 bg-bone" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-sale/25 bg-sale/8 px-5 py-4 text-sm text-sale">{error}</div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-hairline/60 bg-bone px-6 py-16 text-center">
              <FiShoppingBag size={26} className="mx-auto text-ink-muted/50" />
              <h2 className="mt-4 font-display text-xl text-ink">No orders yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-ink-soft">
                When you place an order it'll show up here with live status updates.
              </p>
              <Button asChild variant="primary" size="lg" className="mt-6">
                <Link to="/shop">Start shopping <FiArrowRight /></Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li key={order._id}>
                  <Link
                    to={`/account/orders/${order._id}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-hairline/60 bg-bone p-5 transition hover:border-gold/40 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      {/* item thumbnails */}
                      <div className="flex shrink-0 -space-x-3">
                        {(order.items || []).slice(0, 3).map((it, idx) => (
                          <span
                            key={idx}
                            className="h-12 w-12 overflow-hidden rounded-lg border border-hairline bg-bone-muted"
                          >
                            {it.image && (
                              <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                            )}
                          </span>
                        ))}
                        {(order.items?.length || 0) > 3 && (
                          <span className="grid h-12 w-12 place-items-center rounded-lg border border-hairline bg-bone-muted text-xs font-medium text-ink-soft">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{shortId(order._id)}</span>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="mt-1 text-xs text-ink-muted">
                          {fmtDate(order.createdAt)} · {order.items?.length || 0} item
                          {(order.items?.length || 0) === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <span className="text-base font-semibold text-ink">{formatINR(order.total)}</span>
                      <FiArrowRight className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-gold-deep" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
