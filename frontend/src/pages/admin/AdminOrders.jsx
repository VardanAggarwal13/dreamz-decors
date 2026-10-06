import { useState } from 'react';
import { FiEye, FiArrowRight, FiTrash2, FiFilter, FiX, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import PaymentStatusBadge from '@/components/common/PaymentStatusBadge';
import api from '@/lib/api';
import useAdminList from '@/hooks/useAdminList';
import Modal, { ViewStat } from '@/components/admin/Modal';
import { AdminListSkeleton } from '@/components/admin/AdminSkeleton';
import AdminSearch from '@/components/admin/AdminSearch';
import AdminPagination from '@/components/admin/AdminPagination';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Processing & Shipping' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid / Captured' },
  { value: 'pending', label: 'Unpaid / Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'razorpay', label: 'Razorpay (Online)' },
  { value: 'cod', label: 'Cash on Delivery (COD)' },
];

const DATE_PRESET_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom Date Range…' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'total_high', label: 'Amount: High to Low' },
  { value: 'total_low', label: 'Amount: Low to High' },
];

const normalizeOrderStatus = (st) => (st === 'processing' ? 'shipped' : (st || 'pending'));

const statusLabelFor = (val) => {
  const opt = ORDER_STATUS_OPTIONS.find((o) => o.value === val);
  return opt ? opt.label : (val ? String(val).toUpperCase() : 'Pending');
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '');
const fmtDateLong = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

export default function AdminOrders() {
  const [filter, setFilter] = useState(''); // Order status
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [q, setQ] = useState('');
  const [viewing, setViewing] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);

  const hasActiveFilters = Boolean(
    filter || paymentStatus || paymentMethod || datePreset || dateFrom || dateTo || q
  );

  const clearAllFilters = () => {
    setFilter('');
    setPaymentStatus('');
    setPaymentMethod('');
    setDatePreset('');
    setDateFrom('');
    setDateTo('');
    setQ('');
  };

  // Server-side pagination + status filter + payment + date + search + sort.
  const makePath = ({ page, limit }) => {
    const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filter) sp.set('status', filter);
    if (paymentStatus) sp.set('paymentStatus', paymentStatus);
    if (paymentMethod) sp.set('paymentMethod', paymentMethod);
    if (datePreset && datePreset !== 'custom') sp.set('datePreset', datePreset);
    if (datePreset === 'custom' || (!datePreset && (dateFrom || dateTo))) {
      if (dateFrom) sp.set('from', dateFrom);
      if (dateTo) sp.set('to', dateTo);
    }
    if (sortBy && sortBy !== 'newest') sp.set('sort', sortBy);
    if (q.trim()) sp.set('q', q.trim());
    return `/orders?${sp.toString()}`;
  };

  const { items: orders, setItems: setOrders, meta, loading, goTo, reload } = useAdminList(
    makePath,
    [q, filter, paymentStatus, paymentMethod, datePreset, dateFrom, dateTo, sortBy],
    { limit: 10 }
  );

  /*
   * No optimistic update here: "refunded" doesn't just flip a field — it asks
   * Razorpay to move money, and the order only becomes refunded once the webhook
   * confirms it. So we always render whatever the server says came back.
   */
  const changeStatus = async (id, status) => {
    try {
      const res = await api.patch(`/orders/${id}/status`, { status });
      const updated = res.data;
      // The response isn't populated with the customer, so keep the one we have.
      const merge = (o) => ({ ...o, ...updated, user: o.user });
      setOrders((list) => list.map((o) => (o._id === id ? merge(o) : o)));
      setViewing((v) => (v && v._id === id ? merge(v) : v));
      toast.success(res.message || `Order marked ${updated.orderStatus || status}`);
      return true;
    } catch (err) {
      toast.error(err.message || 'Update failed');
      reload();
      return false;
    }
  };

  const requestStatusChange = (order, newStatus) => {
    if (!order) return;
    const currentNorm = normalizeOrderStatus(order.status);
    if (currentNorm === newStatus) return;
    setStatusConfirm({
      orderId: order._id,
      orderNumber: shortId(order._id),
      customerName: order.user?.name || order.user?.email || 'Customer',
      total: order.total,
      currentStatus: order.status,
      newStatus,
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusConfirm) return;
    setUpdatingStatus(true);
    try {
      const success = await changeStatus(statusConfirm.orderId, statusConfirm.newStatus);
      if (success) {
        setStatusConfirm(null);
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const requestDeleteOrder = (order) => {
    if (!order) return;
    setOrderToDelete({
      id: order._id,
      orderNumber: shortId(order._id),
      customerName: order.user?.name || order.user?.email || 'Customer',
      total: order.total,
      status: order.status,
      date: fmtDate(order.createdAt),
    });
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeletingOrder(true);
    try {
      await api.delete(`/orders/${orderToDelete.id}`);
      toast.success(`Order ${orderToDelete.orderNumber} deleted successfully`);
      setOrders((list) => list.filter((o) => o._id !== orderToDelete.id));
      if (viewing?._id === orderToDelete.id) {
        setViewing(null);
      }
      setOrderToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Failed to delete order');
    } finally {
      setDeletingOrder(false);
    }
  };

  return (
    <div>
      <Seo title="Admin — Orders" noIndex />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl text-ink sm:text-3xl">Orders</h1>
            {meta.total > 0 && (
              <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold-deep">
                {meta.total} {meta.total === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            Manage customer orders, track payments, update fulfillment, and filter records.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          <AdminSearch
            value={q}
            onChange={setQ}
            placeholder="Search by order ID, customer…"
            className="flex-1 sm:w-72 sm:flex-none"
          />

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-hairline bg-bone px-3 py-2 text-xs font-medium text-ink-soft outline-none transition focus:border-gold"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Bar Panel */}
      <div className="mt-4 rounded-2xl border border-hairline/70 bg-bone/70 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink-muted pr-1">
            <FiFilter size={13} className="text-gold-deep" />
            <span className="uppercase tracking-wider text-[10px]">Filter by:</span>
          </div>

          {/* 1. Order Status */}
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-gold font-medium"
            >
              <option value="">Status: All</option>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  Status: {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Payment Status */}
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-gold font-medium"
            >
              <option value="">Payment: All</option>
              {PAYMENT_STATUS_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  Payment: {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Payment Method */}
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-gold font-medium"
            >
              <option value="">Method: All</option>
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  Method: {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Date Range Preset */}
          <div className="min-w-[140px] flex-1 sm:flex-none">
            <select
              value={datePreset}
              onChange={(e) => {
                const val = e.target.value;
                setDatePreset(val);
                if (val !== 'custom') {
                  setDateFrom('');
                  setDateTo('');
                }
              }}
              className="w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-gold font-medium"
            >
              <option value="">Date: All Time</option>
              {DATE_PRESET_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  Date: {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs font-semibold text-sale transition hover:border-sale/40 hover:bg-sale/10 ml-auto"
              title="Reset all filters"
            >
              <FiX size={12} /> Clear Filters
            </button>
          )}
        </div>

        {/* Custom Date Range Pickers (only shown if 'custom' is selected) */}
        {datePreset === 'custom' && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-hairline/60 pt-3 text-xs">
            <span className="font-semibold text-ink-muted">Custom Date:</span>
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-gold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-hairline bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-gold"
              />
            </div>
          </div>
        )}

        {/* Active Filter Chips Row */}
        {hasActiveFilters && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-hairline/50 pt-2.5">
            <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider mr-1">Active:</span>

            {filter && (
              <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white px-2.5 py-0.5 text-[11px] text-ink-soft">
                <span>Status: <strong>{statusLabelFor(filter)}</strong></span>
                <button type="button" onClick={() => setFilter('')} className="text-ink-muted hover:text-sale ml-0.5" aria-label="Remove status filter"><FiX size={11} /></button>
              </span>
            )}

            {paymentStatus && (
              <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white px-2.5 py-0.5 text-[11px] text-ink-soft">
                <span>Payment: <strong>{PAYMENT_STATUS_OPTIONS.find((p) => p.value === paymentStatus)?.label || paymentStatus}</strong></span>
                <button type="button" onClick={() => setPaymentStatus('')} className="text-ink-muted hover:text-sale ml-0.5" aria-label="Remove payment filter"><FiX size={11} /></button>
              </span>
            )}

            {paymentMethod && (
              <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white px-2.5 py-0.5 text-[11px] text-ink-soft">
                <span>Method: <strong>{PAYMENT_METHOD_OPTIONS.find((m) => m.value === paymentMethod)?.label || paymentMethod}</strong></span>
                <button type="button" onClick={() => setPaymentMethod('')} className="text-ink-muted hover:text-sale ml-0.5" aria-label="Remove method filter"><FiX size={11} /></button>
              </span>
            )}

            {(datePreset || dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white px-2.5 py-0.5 text-[11px] text-ink-soft">
                <span>Date: <strong>{datePreset === 'custom' ? `${dateFrom || 'start'} → ${dateTo || 'end'}` : (DATE_PRESET_OPTIONS.find((d) => d.value === datePreset)?.label || 'Custom')}</strong></span>
                <button type="button" onClick={() => { setDatePreset(''); setDateFrom(''); setDateTo(''); }} className="text-ink-muted hover:text-sale ml-0.5" aria-label="Remove date filter"><FiX size={11} /></button>
              </span>
            )}

            {q && (
              <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white px-2.5 py-0.5 text-[11px] text-ink-soft">
                <span>Search: <strong>"{q}"</strong></span>
                <button type="button" onClick={() => setQ('')} className="text-ink-muted hover:text-sale ml-0.5" aria-label="Remove search filter"><FiX size={11} /></button>
              </span>
            )}
          </div>
        )}
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
                value={normalizeOrderStatus(o.status)}
                onChange={(e) => requestStatusChange(o, e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-hairline bg-bone-soft px-2 py-2 text-xs font-medium text-ink-soft outline-none focus:border-gold"
              >
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setViewing(o)}
                className="shrink-0 rounded-lg border border-hairline bg-bone-soft px-3 py-2 text-ink-soft transition hover:text-ink"
                aria-label="View"
                title="View order details"
              >
                <FiEye size={15} />
              </button>
              <button
                onClick={() => requestDeleteOrder(o)}
                className="shrink-0 rounded-lg border border-hairline bg-bone-soft px-3 py-2 text-ink-muted transition hover:border-sale/40 hover:bg-sale/10 hover:text-sale"
                aria-label="Delete"
                title="Delete order"
              >
                <FiTrash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-hairline/60 bg-bone py-10 text-center text-ink-muted">
            <p>{hasActiveFilters ? 'No orders match the selected filters.' : 'No orders found.'}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:underline"
              >
                <FiX size={12} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-hairline/60 bg-bone lg:block">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Actions</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-b border-hairline/40 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewing(o)}
                      className="rounded-lg p-1.5 text-ink-soft transition hover:bg-bone-muted hover:text-ink"
                      aria-label="View"
                      title="View details"
                    >
                      <FiEye size={15} />
                    </button>
                    <button
                      onClick={() => requestDeleteOrder(o)}
                      className="rounded-lg p-1.5 text-ink-muted transition hover:bg-sale/10 hover:text-sale"
                      aria-label="Delete"
                      title="Delete order"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setViewing(o)} className="font-medium text-ink hover:text-gold-deep">{shortId(o._id)}</button>
                </td>
                <td className="px-4 py-3 text-ink-soft">{o.user?.name || o.user?.email || '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{fmtDate(o.createdAt)}</td>
                <td className="px-4 py-3 text-ink-soft">{o.items?.length || 0}</td>
                <td className="px-4 py-3 font-medium text-ink">{formatINR(o.total)}</td>
                <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                <td className="px-4 py-3"><PaymentStatusBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-3">
                  <select
                    value={normalizeOrderStatus(o.status)}
                    onChange={(e) => requestStatusChange(o, e.target.value)}
                    className="rounded-lg border border-hairline bg-bone px-2 py-1.5 text-xs font-medium text-ink-soft outline-none focus:border-gold"
                  >
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-ink-muted">
                  <p>{hasActiveFilters ? 'No orders match the selected filters.' : 'No orders found.'}</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:underline"
                    >
                      <FiX size={12} /> Clear all filters
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={goTo} />
      </>)}

      {/* View modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Order ${shortId(viewing._id)}` : ''}
        subtitle={viewing && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <OrderStatusBadge status={viewing.status} />
            <PaymentStatusBadge status={viewing.paymentStatus} />
            <span>·</span>
            <span>{fmtDateLong(viewing.createdAt)}</span>
          </div>
        )}
        footer={viewing && (
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => requestDeleteOrder(viewing)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-bone-soft px-3.5 py-2 text-xs font-semibold text-sale transition hover:border-sale/50 hover:bg-sale/10"
              title="Delete this order"
            >
              <FiTrash2 size={14} /> Delete Order
            </button>
            <label className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink">Update status:</span>
              <select
                value={normalizeOrderStatus(viewing.status)}
                onChange={(e) => requestStatusChange(viewing, e.target.value)}
                className="rounded-lg border border-hairline bg-bone px-3 py-2 text-sm font-medium text-ink-soft outline-none focus:border-gold"
              >
                {ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
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

            {/* Payment detail — the money side of the order, straight from Razorpay. */}
            <div>
              <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Payment</span>
              <div className="space-y-1 rounded-xl border border-hairline/60 bg-bone p-4 text-sm">
                <Row label="Payment status" value={<PaymentStatusBadge status={viewing.paymentStatus} />} />
                <Row label="Method" value={(viewing.payment?.method || '—').toUpperCase()} />
                <Row label="Paid at" value={viewing.payment?.paidAt ? fmtDateLong(viewing.payment.paidAt) : '—'} />
                <Row label="Payment ID" value={<Mono>{viewing.payment?.razorpayPaymentId || '—'}</Mono>} />
                <Row label="Razorpay order" value={<Mono>{viewing.payment?.razorpayOrderId || '—'}</Mono>} />
                {viewing.payment?.refundId && (
                  <>
                    <Row label="Refund ID" value={<Mono>{viewing.payment.refundId}</Mono>} />
                    <Row label="Refunded" value={formatINR((viewing.payment.refundedAmount || 0) / 100)} />
                  </>
                )}
                {viewing.payment?.failureReason && (
                  <Row label="Failure reason" value={<span className="text-sale">{viewing.payment.failureReason}</span>} />
                )}
              </div>
            </div>

            {/* Audit trail — nothing in the payment flow happens silently. */}
            {viewing.events?.length > 0 && (
              <div>
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Activity</span>
                <ol className="space-y-2 rounded-xl border border-hairline/60 bg-bone p-4">
                  {viewing.events.map((e, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="font-mono text-ink">{e.type}</span>
                      <span className="shrink-0 text-ink-muted">
                        {e.source ? `${e.source} · ` : ''}{fmtDateLong(e.at)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

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

      {/* Status change confirmation modal */}
      <Modal
        open={!!statusConfirm}
        onClose={() => !updatingStatus && setStatusConfirm(null)}
        title="Confirm Order Status Update"
        subtitle={
          statusConfirm && (
            <span className="text-xs text-ink-muted">
              {statusConfirm.orderNumber} · {statusConfirm.customerName}
            </span>
          )
        }
        maxWidth="max-w-md"
        footer={
          statusConfirm && (
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={updatingStatus}
                onClick={() => setStatusConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={updatingStatus}
                onClick={handleConfirmStatusChange}
              >
                {updatingStatus ? 'Updating…' : 'Confirm Update'}
              </Button>
            </div>
          )
        }
      >
        {statusConfirm && (
          <div className="space-y-4 text-sm text-ink-soft">
            <div className="rounded-xl border border-hairline/80 bg-bone p-4">
              <div className="flex items-center justify-between text-xs text-ink-muted mb-2">
                <span>Status Transition</span>
                <span>Total: {formatINR(statusConfirm.total)}</span>
              </div>
              <div className="flex items-center justify-center gap-3 py-2">
                <OrderStatusBadge status={statusConfirm.currentStatus} />
                <FiArrowRight className="text-gold-deep shrink-0" size={16} />
                <OrderStatusBadge status={statusConfirm.newStatus} />
              </div>
            </div>

            <p className="text-xs leading-relaxed text-ink-soft">
              Are you sure you want to change the status of{' '}
              <strong className="text-ink font-semibold">{statusConfirm.orderNumber}</strong> from{' '}
              <span className="font-semibold uppercase text-ink">
                {statusLabelFor(statusConfirm.currentStatus)}
              </span>{' '}
              to{' '}
              <span className="font-semibold uppercase text-gold-deep">
                {statusLabelFor(statusConfirm.newStatus)}
              </span>?
            </p>

            {statusConfirm.newStatus === 'delivered' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
                <strong>Delivery Notice:</strong> This will mark the order as successfully delivered to the customer.
              </div>
            )}

            {statusConfirm.newStatus === 'shipped' && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800">
                <strong>Processing &amp; Shipping Notice:</strong> This will mark the order as processed / dispatched and update tracking for the customer.
              </div>
            )}

            {(statusConfirm.newStatus === 'cancelled' || statusConfirm.newStatus === 'refunded') && (
              <div className="rounded-xl border border-sale/30 bg-sale/10 p-3 text-xs text-sale">
                <strong>Warning:</strong> Marking an order as {statusConfirm.newStatus} cannot be undone automatically and may trigger customer notifications or refund adjustments.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete order confirmation modal */}
      <Modal
        open={!!orderToDelete}
        onClose={() => !deletingOrder && setOrderToDelete(null)}
        title="Delete Order"
        subtitle={
          orderToDelete && (
            <span className="text-xs text-ink-muted">
              {orderToDelete.orderNumber} · {orderToDelete.customerName}
            </span>
          )
        }
        maxWidth="max-w-md"
        footer={
          orderToDelete && (
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={deletingOrder}
                onClick={() => setOrderToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={deletingOrder}
                onClick={handleConfirmDeleteOrder}
                className="bg-sale text-bone hover:bg-sale/90 border-transparent shadow-xs"
              >
                {deletingOrder ? 'Deleting…' : 'Delete Order'}
              </Button>
            </div>
          )
        }
      >
        {orderToDelete && (
          <div className="space-y-4 text-sm text-ink-soft">
            <div className="rounded-xl border border-sale/30 bg-sale/5 p-4 text-xs text-sale leading-relaxed">
              <p className="font-semibold text-sale mb-1 flex items-center gap-1.5">
                <FiTrash2 size={14} /> Permanently delete this order?
              </p>
              <p>This action cannot be undone. Order records, payment details, and audit logs will be permanently deleted for clean-up.</p>
            </div>

            <div className="rounded-xl border border-hairline/80 bg-bone p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Order ID:</span>
                <span className="font-mono font-bold text-ink">{orderToDelete.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Customer:</span>
                <span className="font-semibold text-ink">{orderToDelete.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Total:</span>
                <span className="font-semibold text-ink">{formatINR(orderToDelete.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Status:</span>
                <OrderStatusBadge status={orderToDelete.status} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5 text-ink-soft">
      <span className="shrink-0">{label}</span><span className="min-w-0 text-right">{value}</span>
    </div>
  );
}

function Mono({ children }) {
  return <span className="break-all font-mono text-xs text-ink">{children}</span>;
}
