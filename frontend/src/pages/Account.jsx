import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShoppingBag, FiMapPin, FiBell, FiHeart, FiSettings } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

const CARDS = [
  { to: '/account/orders', Icon: FiShoppingBag, title: 'Orders & tracking', desc: 'Track orders and view live status updates.' },
  { to: '/account/addresses', Icon: FiMapPin, title: 'Addresses', desc: 'Manage your saved shipping addresses.' },
  { to: '/account/notifications', Icon: FiBell, title: 'Notifications', desc: 'Browser push and account alerts.' },
  { to: '/wishlist', Icon: FiHeart, title: 'Wishlist', desc: 'The pieces you’ve saved for later.' },
];

export default function Account() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/orders/me')
      .then((res) => !cancelled && setOrders((res.data || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <Seo title="My Account — DreamzDecor" description="Manage your DreamzDecor profile, orders, and preferences." canonical="/account" noIndex />

      {/* Profile summary */}
      <section className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-ink">{user?.name || 'Welcome'}</h2>
            <p className="mt-1 truncate text-sm text-ink-soft">{user?.email}</p>
            {user?.phone && <p className="mt-0.5 text-sm text-ink-soft">{user.phone}</p>}
          </div>
          <Link
            to="/account/profile"
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-bone-soft px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-soft transition hover:border-gold/40 hover:text-gold-deep"
          >
            <FiSettings size={14} /> Edit profile
          </Link>
        </div>
      </section>

      {/* Quick navigation */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map(({ to, Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-4 rounded-2xl border border-hairline/60 bg-bone p-6 transition hover:border-gold/40 hover:shadow-card"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
              <Icon size={18} className="text-gold-deep" />
            </span>
            <span className="flex-1">
              <span className="flex items-center justify-between">
                <span className="font-display text-lg text-ink">{title}</span>
                <FiArrowRight className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-gold-deep" />
              </span>
              <span className="mt-1 block text-sm leading-6 text-ink-soft">{desc}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* Recent orders */}
      <section className="rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-ink">Recent orders</h3>
          <Link to="/account/orders" className="text-xs font-medium uppercase tracking-[0.16em] text-gold-deep hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="mt-5 space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-hairline/60 bg-bone-soft" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="mt-5 text-sm text-ink-soft">No orders yet — your purchases will show up here with live tracking.</p>
        ) : (
          <ul className="mt-5 divide-y divide-hairline/50">
            {orders.map((o) => (
              <li key={o._id}>
                <Link
                  to={`/account/orders/${o._id}`}
                  className="group flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  {/* Left column flexes & wraps internally (id + badge); right column
                      never shrinks so the price stays aligned on the smallest screens. */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-ink">{shortId(o._id)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {fmtDate(o.createdAt)} · {o.items?.length || 0} item{(o.items?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="whitespace-nowrap text-sm font-semibold text-ink">{formatINR(o.total)}</span>
                    <FiArrowRight className="text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-gold-deep" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
