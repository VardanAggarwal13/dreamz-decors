import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiArrowRight,
  FiShoppingBag,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRotateCcw,
} from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatINR } from '@/lib/utils';

const PAGE_SIZE = 5;

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'active', label: 'In Progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

const formatItemOptions = (options) => {
  if (!options) return null;
  if (typeof options === 'string') return options;
  const parts = [];
  if (options.size) parts.push(`Size: ${options.size}`);
  if (options.frame) parts.push(`Frame: ${options.frame}`);
  Object.entries(options).forEach(([k, v]) => {
    if (k !== 'size' && k !== 'frame' && v && typeof v === 'string') {
      parts.push(`${k}: ${v}`);
    }
  });
  return parts.length ? parts.join(' · ') : null;
};

// Returns windowed list of page numbers around current page
function pageWindow(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, current - 1, current, current + 1, total]);
  return [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const statusParam = searchParams.get('status') || 'all';

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: String(pageParam),
          limit: String(PAGE_SIZE),
        });
        if (statusParam && statusParam !== 'all') {
          params.set('status', statusParam);
        }

        const res = await api.get(`/orders/me?${params.toString()}`);
        if (!cancelled) {
          const list = Array.isArray(res.data) ? res.data : [];
          setOrders(list);
          setMeta({
            page: res.page || pageParam,
            pages: res.pages || Math.max(1, Math.ceil((res.total ?? list.length) / PAGE_SIZE)),
            total: typeof res.total === 'number' ? res.total : list.length,
            limit: res.limit || PAGE_SIZE,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load your orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pageParam, statusParam]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > meta.pages || newPage === meta.page) return;
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleStatusChange = (newStatus) => {
    const next = new URLSearchParams();
    if (newStatus !== 'all') {
      next.set('status', newStatus);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  const pageNumbers = pageWindow(meta.page, meta.pages);

  return (
    <div>
      <Seo title="My Orders — DreamzDecor" description="Track your DreamzDecor orders." canonical="/account/orders" noIndex />

      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-ink sm:text-3xl">My orders</h1>
            {!loading && meta.total > 0 && (
              <span className="inline-flex items-center rounded-full border border-hairline/80 bg-bone px-2.5 py-0.5 text-xs font-semibold text-ink-soft">
                {meta.total} {meta.total === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Track real-time shipment updates, review order specifications, or view invoices.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-hairline/60 pb-3">
        {STATUS_TABS.map((tab) => {
          const isActive = (statusParam || 'all') === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleStatusChange(tab.key)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'border border-gold/40 bg-gold/15 font-semibold text-gold-deep shadow-2xs'
                  : 'border border-hairline/60 bg-bone text-ink-soft hover:bg-bone-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-hairline/60 bg-bone shadow-2xs">
                <div className="h-14 animate-pulse bg-bone-muted/60" />
                <div className="space-y-3 p-5">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 animate-pulse rounded-xl bg-bone-muted" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-3/5 animate-pulse rounded bg-bone-muted" />
                      <div className="h-3 w-1/4 animate-pulse rounded bg-bone-muted" />
                    </div>
                  </div>
                </div>
                <div className="h-11 border-t border-hairline/60 bg-bone-soft/40" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-sale/25 bg-sale/8 px-5 py-4 text-sm text-sale">
            <p className="font-medium">Error loading orders</p>
            <p className="mt-1 text-xs">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.page)}
              className="mt-3 text-xs"
            >
              <FiRotateCcw size={12} className="mr-1.5" /> Try again
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-hairline/60 bg-bone px-6 py-16 text-center shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-hairline bg-bone-muted/60 text-ink-muted">
              <FiShoppingBag size={24} />
            </div>
            <h2 className="mt-4 font-display text-xl text-ink">
              {statusParam !== 'all' ? `No ${statusParam} orders found` : 'No orders yet'}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">
              {statusParam !== 'all'
                ? `You don't have any orders under "${STATUS_TABS.find((t) => t.key === statusParam)?.label || statusParam}".`
                : "When you purchase handcrafted canvas art, it will show up here with live status tracking."}
            </p>
            {statusParam !== 'all' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('all')}
                className="mt-5 text-xs"
              >
                View all orders
              </Button>
            ) : (
              <Button asChild variant="primary" size="lg" className="mt-6">
                <Link to="/shop">
                  Start shopping <FiArrowRight />
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const items = order.items || [];
              const isClosed = ['cancelled', 'refunded'].includes(order.status);
              const isDelivered = order.status === 'delivered';
              const isInTransit = ['shipped', 'processing', 'processing & shipping'].includes(order.status);

              return (
                <article
                  key={order._id}
                  className="overflow-hidden rounded-2xl border border-hairline/70 bg-bone shadow-2xs transition duration-200 hover:border-gold/50 hover:shadow-card"
                >
                  {/* Top Header Strip */}
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline/60 bg-bone-muted/40 px-5 py-3.5 text-xs text-ink-soft">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                          Placed On
                        </span>
                        <p className="font-medium text-ink">{fmtDate(order.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                          Order ID
                        </span>
                        <p className="font-mono font-semibold text-ink">{shortId(order._id)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                          Total Amount
                        </span>
                        <p className="font-semibold text-ink">{formatINR(order.total)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </header>

                  {/* Order Line Items */}
                  <div className="divide-y divide-hairline/50 p-5 sm:p-6">
                    {items.map((it, idx) => {
                      const opts = formatItemOptions(it.options);
                      return (
                        <div key={idx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                          {/* Artwork Thumbnail */}
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-hairline bg-bone-muted shadow-2xs">
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.title || 'Canvas art'}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-ink-muted">
                                <FiPackage size={22} />
                              </div>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div>
                              <h2 className="line-clamp-1 text-sm font-medium text-ink sm:text-base">
                                {it.title || 'Handcrafted Canvas Artwork'}
                              </h2>
                              {opts && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                                  {opts}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-ink-muted">
                                Qty: <strong className="font-semibold text-ink">{it.qty}</strong>
                                {it.price > 0 && (
                                  <span className="ml-1 text-ink-muted">
                                    × {formatINR(it.price)}
                                  </span>
                                )}
                              </span>
                              <span className="font-semibold text-ink sm:text-sm">
                                {formatINR(it.price * it.qty)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Footer Bar */}
                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline/60 bg-bone-soft/40 px-5 py-3 text-xs">
                    <div className="flex items-center gap-2">
                      {isDelivered ? (
                        <span className="flex items-center gap-1.5 font-medium text-accent">
                          <FiCheckCircle size={14} /> Delivered to your address
                        </span>
                      ) : isClosed ? (
                        <span className="flex items-center gap-1.5 font-medium text-sale">
                          <FiXCircle size={14} /> Order cancelled{order.status === 'refunded' ? ' & refunded' : ''}
                        </span>
                      ) : isInTransit ? (
                        <span className="flex items-center gap-1.5 font-medium text-gold-deep">
                          <FiTruck size={14} /> Handcrafted piece in transit
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-ink-soft">
                          <FiClock size={14} /> Order placed & confirmed
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/account/orders/${order._id}`}
                      className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-bone px-3.5 py-1.5 font-medium text-ink shadow-2xs transition hover:border-gold hover:text-gold-deep hover:shadow-xs"
                    >
                      <span>{order.status === 'delivered' ? 'View Details & Invoice' : 'View Order Details'}</span>
                      <FiArrowRight
                        size={13}
                        className="transition-transform group-hover/btn:translate-x-0.5"
                      />
                    </Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}

        {/* Proper Pagination Controls */}
        {!loading && meta.total > 0 && (
          <nav
            aria-label="Order pagination"
            className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-hairline/70 bg-bone px-5 py-3.5 shadow-2xs sm:flex-row"
          >
            <p className="text-xs text-ink-muted">
              Showing <span className="font-semibold text-ink">{from}–{to}</span> of{' '}
              <span className="font-semibold text-ink">{meta.total}</span> {meta.total === 1 ? 'order' : 'orders'}
            </p>

            {meta.pages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-bone-soft px-2.5 text-xs font-medium text-ink-soft transition hover:border-gold hover:text-gold-deep disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={14} />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {pageNumbers.map((n, i) => (
                  <span key={n} className="flex items-center gap-1.5">
                    {i > 0 && n - pageNumbers[i - 1] > 1 && (
                      <span className="px-1 text-xs text-ink-muted">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePageChange(n)}
                      className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                        n === meta.page
                          ? 'bg-gold font-semibold text-ink shadow-2xs'
                          : 'border border-hairline bg-bone-soft text-ink-soft hover:border-gold hover:text-gold-deep'
                      }`}
                      aria-current={n === meta.page ? 'page' : undefined}
                    >
                      {n}
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.pages}
                  className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-bone-soft px-2.5 text-xs font-medium text-ink-soft transition hover:border-gold hover:text-gold-deep disabled:pointer-events-none disabled:opacity-30"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <FiChevronRight size={14} />
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
