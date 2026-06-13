import { useEffect, useState } from 'react';
import { FiEye } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import api from '@/lib/api';
import Modal, { ViewStat } from '@/components/admin/Modal';
import { AdminListSkeleton } from '@/components/admin/AdminSkeleton';
import { formatINR } from '@/lib/utils';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '');
const fmtDateLong = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [viewing, setViewing] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/orders${filter ? `?status=${filter}` : ''}`)
      .then((res) => setOrders(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const changeStatus = async (id, status) => {
    setOrders((list) => list.map((o) => (o._id === id ? { ...o, status } : o)));
    setViewing((v) => (v && v._id === id ? { ...v, status } : v));
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success(`Order marked ${status}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
      load();
    }
  };

  return (
    <div>
      <Seo title="Admin — Orders" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-hairline bg-bone px-3 py-2 text-sm text-ink-soft outline-none focus:border-gold"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <AdminListSkeleton cols={8} withAvatar={false} /> : (<>
      {/* Mobile / tablet: cards */}
      <div className="mt-6 space-y-3 lg:hidden">
        {orders.map((o) => (
          <div key={o._id} className="rounded-2xl border border-hairline/60 bg-bone p-4">
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => setViewing(o)} className="font-medium text-ink hover:text-gold-deep">{shortId(o._id)}</button>
              <OrderStatusBadge status={o.status} />
            </div>
            <div className="mt-2 space-y-0.5 text-sm">
              <p className="truncate text-ink-soft">{o.user?.name || o.user?.email || '—'}</p>
              <p className="text-xs text-ink-muted">{fmtDate(o.createdAt)} · {o.items?.length || 0} item{(o.items?.length || 0) === 1 ? '' : 's'}</p>
              <p className="font-medium text-ink">{formatINR(o.total)}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <select
                value={o.status}
                onChange={(e) => changeStatus(o._id, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-hairline bg-bone-soft px-2 py-2 text-xs text-ink-soft outline-none focus:border-gold"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => setViewing(o)} className="shrink-0 rounded-lg border border-hairline bg-bone-soft px-3 py-2 text-ink-soft transition hover:text-ink" aria-label="View"><FiEye size={15} /></button>
            </div>
          </div>
        ))}
        {!loading && orders.length === 0 && (
          <p className="rounded-2xl border border-hairline/60 bg-bone py-10 text-center text-ink-muted">No orders found.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-hairline/60 bg-bone lg:block">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Update</th>
              <th className="px-4 py-3 text-right font-medium">View</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-b border-hairline/40 last:border-0">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setViewing(o)} className="font-medium text-ink hover:text-gold-deep">{shortId(o._id)}</button>
                </td>
                <td className="px-4 py-3 text-ink-soft">{o.user?.name || o.user?.email || '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{fmtDate(o.createdAt)}</td>
                <td className="px-4 py-3 text-ink-soft">{o.items?.length || 0}</td>
                <td className="px-4 py-3 font-medium text-ink">{formatINR(o.total)}</td>
                <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => changeStatus(o._id, e.target.value)}
                    className="rounded-lg border border-hairline bg-bone px-2 py-1.5 text-xs text-ink-soft outline-none focus:border-gold"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewing(o)} className="text-ink-soft hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={8} className="py-10 text-center text-ink-muted">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </>)}

      {/* View modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Order ${shortId(viewing._id)}` : ''}
        subtitle={viewing && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <OrderStatusBadge status={viewing.status} />
            <span>·</span>
            <span>{fmtDateLong(viewing.createdAt)}</span>
          </div>
        )}
        footer={viewing && (
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">Update status</span>
            <select
              value={viewing.status}
              onChange={(e) => changeStatus(viewing._id, e.target.value)}
              className="rounded-lg border border-hairline bg-bone px-3 py-2 text-sm text-ink-soft outline-none focus:border-gold"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
      >
        {viewing && (
          <div className="space-y-5">
            {/* Customer + payment */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <ViewStat label="Customer" value={viewing.user?.name || '—'} />
              <ViewStat label="Email" value={viewing.user?.email || '—'} />
              <ViewStat label="Payment" value={(viewing.payment?.method || '—').toUpperCase()} />
            </div>

            {/* Items */}
            <div>
              <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Items</span>
              <div className="divide-y divide-hairline/50 rounded-xl border border-hairline/60 bg-bone">
                {(viewing.items || []).map((it, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-hairline bg-bone-muted">
                      {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{it.title}</span>
                      <span className="block text-xs text-ink-muted">{formatINR(it.price)} × {it.qty}</span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-ink">{formatINR((it.price || 0) * (it.qty || 0))}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-hairline/60 bg-bone p-4 text-sm">
              <Row label="Subtotal" value={formatINR(viewing.subtotal)} />
              <Row label="Shipping" value={viewing.shipping ? formatINR(viewing.shipping) : 'Free'} />
              {viewing.discount > 0 && <Row label="Discount" value={`− ${formatINR(viewing.discount)}`} />}
              <div className="mt-2 flex items-center justify-between border-t border-hairline/60 pt-2 font-display text-base text-ink">
                <span>Total</span><span>{formatINR(viewing.total)}</span>
              </div>
            </div>

            {/* Shipping address */}
            {viewing.shippingAddress && (
              <div>
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Shipping address</span>
                <div className="rounded-xl border border-hairline/60 bg-bone p-4 text-sm leading-6 text-ink-soft">
                  {[viewing.shippingAddress.name, viewing.shippingAddress.phone].filter(Boolean).join(' · ') && (
                    <p className="font-medium text-ink">{[viewing.shippingAddress.name, viewing.shippingAddress.phone].filter(Boolean).join(' · ')}</p>
                  )}
                  <p>{[viewing.shippingAddress.line1, viewing.shippingAddress.line2, viewing.shippingAddress.city, viewing.shippingAddress.state, viewing.shippingAddress.pincode, viewing.shippingAddress.country].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-ink-soft">
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
