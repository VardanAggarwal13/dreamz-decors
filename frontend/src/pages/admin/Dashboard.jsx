import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBox, FiShoppingBag, FiUsers, FiTrendingUp } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview').then((res) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Revenue', value: data ? formatINR(data.revenue) : '—', Icon: FiTrendingUp },
    { label: 'Orders', value: data?.orders ?? '—', Icon: FiShoppingBag },
    { label: 'Products', value: data?.products ?? '—', Icon: FiBox },
    { label: 'Customers', value: data?.customers ?? '—', Icon: FiUsers },
  ];

  return (
    <div>
      <Seo title="Admin Dashboard — DreamzDecor" noIndex />
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-soft">Overview of your store.</p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-hairline/60 bg-bone p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">{label}</span>
              <Icon size={16} className="text-gold-deep" />
            </div>
            <div className="mt-3 font-display text-2xl text-ink">{loading ? '…' : value}</div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {data?.statusBreakdown && Object.keys(data.statusBreakdown).length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(data.statusBreakdown).map(([status, count]) => (
            <span key={status} className="inline-flex items-center gap-2 rounded-full border border-hairline/60 bg-bone px-3 py-1.5 text-xs text-ink-soft">
              <OrderStatusBadge status={status} /> {count}
            </span>
          ))}
        </div>
      )}

      {/* Recent orders */}
      <div className="mt-8 rounded-2xl border border-hairline/60 bg-bone p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">Recent orders</h2>
          <Link to="/admin/orders" className="text-xs text-gold-deep hover:underline">View all</Link>
        </div>
        {/* Mobile: stacked rows */}
        <div className="mt-4 divide-y divide-hairline/40 sm:hidden">
          {(data?.recentOrders || []).map((o) => (
            <div key={o._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{shortId(o._id)}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-muted">{o.user?.name || o.user?.email || '—'} · {fmtDate(o.createdAt)}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-ink">{formatINR(o.total)}</span>
            </div>
          ))}
          {!loading && (data?.recentOrders || []).length === 0 && (
            <p className="py-8 text-center text-ink-muted">No orders yet.</p>
          )}
        </div>

        {/* Tablet/desktop: table */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
                <th className="py-2 pr-4 font-medium">Order</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders || []).map((o) => (
                <tr key={o._id} className="border-b border-hairline/40 last:border-0">
                  <td className="py-3 pr-4 font-medium text-ink">{shortId(o._id)}</td>
                  <td className="py-3 pr-4 text-ink-soft">{o.user?.name || o.user?.email || '—'}</td>
                  <td className="py-3 pr-4 text-ink-muted">{fmtDate(o.createdAt)}</td>
                  <td className="py-3 pr-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="py-3 text-right font-medium text-ink">{formatINR(o.total)}</td>
                </tr>
              ))}
              {!loading && (data?.recentOrders || []).length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-ink-muted">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
