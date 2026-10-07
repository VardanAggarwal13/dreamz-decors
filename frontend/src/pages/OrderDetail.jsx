import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheck,
  FiShield,
  FiPackage,
  FiTruck,
  FiCopy,
  FiDownload,
  FiPhone,
  FiXCircle,
  FiClock,
  FiExternalLink,
  FiCheckCircle,
  FiMessageCircle,
} from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import OrderStatusBadge from '@/components/common/OrderStatusBadge';
import OrderInvoiceModal from '@/components/common/OrderInvoiceModal';
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

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '');

const TRACKER_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Payment verified' },
  { key: 'processing', label: 'Artisan Crafting', desc: 'Printing & framing' },
  { key: 'shipped', label: 'Dispatched', desc: 'With express courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Safely arrived' },
];

const STEP_INDEX = {
  pending: 0,
  paid: 0,
  confirmed: 0,
  processing: 1,
  'processing & shipping': 2,
  shipped: 2,
  delivered: 3,
};

function ProgressTracker({ status }) {
  const current = STEP_INDEX[status] ?? 0;
  return (
    <div className="py-2">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {TRACKER_STEPS.map((step, i) => {
          const isDone = i <= current;
          const isCurrent = i === current;
          return (
            <div key={step.key} className="relative flex flex-col items-center text-center">
              {/* Connector line for desktop */}
              {i < TRACKER_STEPS.length - 1 && (
                <div
                  className={`hidden sm:block absolute left-[50%] top-4 h-[2px] w-full transition-colors ${
                    i < current ? 'bg-gold' : 'bg-hairline'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator node */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                  isDone
                    ? 'border-gold bg-gold text-ink shadow-xs'
                    : 'border-hairline bg-bone-muted text-ink-muted'
                } ${isCurrent ? 'ring-4 ring-gold/20' : ''}`}
              >
                {isDone ? <FiCheck size={14} className="stroke-[2.5]" /> : i + 1}
              </div>

              {/* Text metadata */}
              <div className="mt-2.5">
                <p
                  className={`text-xs font-semibold ${
                    isDone ? 'text-ink' : 'text-ink-muted'
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-muted hidden sm:block">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const formatItemOptions = (options) => {
  if (!options) return [];
  if (typeof options === 'string') return [{ label: 'Option', val: options }];
  const list = [];
  if (options.size) list.push({ label: 'Size', val: options.size });
  if (options.frame) list.push({ label: 'Frame', val: options.frame });
  Object.entries(options).forEach(([k, v]) => {
    if (k !== 'size' && k !== 'frame' && v && typeof v === 'string') {
      list.push({ label: k.charAt(0).toUpperCase() + k.slice(1), val: v });
    }
  });
  return list;
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
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

  const copyOrderId = () => {
    if (!order?._id) return;
    const cleanId = shortId(order._id);
    navigator.clipboard.writeText(cleanId);
    setCopied(true);
    toast.success(`Copied ${cleanId} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const addr = order?.shippingAddress || {};
  const isClosed = order && ['cancelled', 'refunded'].includes(order.status);
  const isDelivered = order && (order.status === 'delivered' || order.orderStatus === 'delivered');
  const items = order?.items || [];

  const waMessage = order
    ? encodeURIComponent(
        `Hi DreamzDecor! I have a question regarding my order #${String(order._id).slice(-8).toUpperCase()} (Total: ${formatINR(
          order.total
        )}).`
      )
    : '';

  return (
    <div className="order-detail-page">
      <Seo
        title={`Order ${shortId(id)} — DreamzDecor`}
        description="Order details and fulfillment tracking"
        canonical={`/account/orders/${id}`}
        noIndex
      />

      {/* Top back navigation */}
      <div className="no-print flex items-center justify-between">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft transition hover:text-gold-deep"
        >
          <FiArrowLeft size={14} /> Back to My Orders
        </Link>

        {/* ONLY show Download Invoice if the order is successfully DELIVERED */}
        {isDelivered && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInvoiceOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold-deep shadow-2xs transition hover:bg-gold/25"
            >
              <FiDownload size={13} />
              <span>Download Invoice</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-6 space-y-6">
          <div className="h-28 animate-pulse rounded-2xl border border-hairline/60 bg-bone" />
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              <div className="h-56 animate-pulse rounded-2xl border border-hairline/60 bg-bone" />
              <div className="h-44 animate-pulse rounded-2xl border border-hairline/60 bg-bone" />
            </div>
            <div className="space-y-6">
              <div className="h-64 animate-pulse rounded-2xl border border-hairline/60 bg-bone" />
              <div className="h-44 animate-pulse rounded-2xl border border-hairline/60 bg-bone" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-sale/25 bg-sale/8 px-6 py-5 text-sm text-sale">
          <p className="font-semibold">Unable to display order</p>
          <p className="mt-1 text-xs">{error}</p>
          <Button asChild variant="outline" size="sm" className="mt-4 text-xs">
            <Link to="/account/orders">Return to Orders</Link>
          </Button>
        </div>
      ) : !order ? null : (
        <>
          {/* Main Header Card */}
          <section className="mt-5 rounded-2xl border border-hairline/70 bg-bone p-5 shadow-2xs sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl text-ink sm:text-3xl">
                    Order {shortId(order._id)}
                  </h1>
                  <button
                    type="button"
                    onClick={copyOrderId}
                    title="Copy full Order ID"
                    className="inline-flex items-center gap-1 rounded-md border border-hairline bg-bone-muted/60 px-2 py-0.5 text-[11px] font-mono font-medium text-ink-muted transition hover:border-gold hover:text-gold-deep"
                  >
                    {copied ? <FiCheck size={12} className="text-accent" /> : <FiCopy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">
                  Placed on <strong className="font-medium text-ink">{fmtDateTime(order.createdAt)}</strong> ·{' '}
                  {items.length} {items.length === 1 ? 'item' : 'items'} · Total{' '}
                  <strong className="font-semibold text-ink">{formatINR(order.total)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            {/* Lifecycle Status Bar: Stepper or Alert */}
            <div className="mt-6 border-t border-hairline/60 pt-6">
              {isClosed ? (
                <div className="rounded-xl border border-sale/25 bg-sale/5 p-4 sm:p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sale/10 text-sale">
                      <FiXCircle size={18} />
                    </div>
                    <div className="flex-1 text-xs">
                      <h3 className="font-semibold text-ink text-sm">
                        {order.status === 'refunded' ? 'Order Cancelled & Refunded' : 'Order Cancelled'}
                      </h3>
                      <p className="mt-1 leading-relaxed text-ink-soft">
                        {order.status === 'refunded'
                          ? 'This order has been cancelled and the full refund has been credited back to your original payment method.'
                          : 'This order was cancelled. If any payment was deducted, it will be automatically refunded to your original payment source within 3–5 business days.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ProgressTracker status={order.status} />
              )}
            </div>
          </section>

          {/* Balanced 2-Column Grid Architecture */}
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
            {/* ── LEFT COLUMN: Items, Shipping Address & Transit Guarantee ── */}
            <div className="space-y-6 min-w-0">
              {/* Card 1: Ordered Artworks */}
              <div className="rounded-2xl border border-hairline/70 bg-bone p-5 shadow-2xs sm:p-6">
                <div className="flex items-center justify-between border-b border-hairline/60 pb-3.5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                    Ordered Artworks ({items.length})
                  </h2>
                  <span className="text-xs text-ink-muted">Handcrafted Canvas</span>
                </div>

                <ul className="divide-y divide-hairline/50">
                  {items.map((it, idx) => {
                    const opts = formatItemOptions(it.options);
                    const productSlug = it.product?.slug;

                    return (
                      <li key={idx} className="flex gap-4 py-4 first:pt-4 last:pb-1">
                        {/* Artwork Preview Image */}
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-hairline bg-bone-muted shadow-2xs">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt={it.title || 'Canvas artwork'}
                              className="h-full w-full object-cover transition duration-300 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-muted">
                              <FiPackage size={26} />
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            {productSlug ? (
                              <Link
                                to={`/shop/${productSlug}`}
                                className="group inline-flex items-center gap-1.5 font-medium text-ink hover:text-gold-deep text-sm sm:text-base leading-snug line-clamp-1"
                              >
                                <span>{it.title || 'Handcrafted Canvas Artwork'}</span>
                                <FiExternalLink
                                  size={13}
                                  className="shrink-0 text-ink-muted opacity-0 transition group-hover:opacity-100"
                                />
                              </Link>
                            ) : (
                              <h3 className="font-medium text-ink text-sm sm:text-base leading-snug line-clamp-1">
                                {it.title || 'Handcrafted Canvas Artwork'}
                              </h3>
                            )}

                            {/* Option pills: Size, Frame, etc. */}
                            {opts.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {opts.map((o, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className="inline-flex items-center rounded-md border border-hairline bg-bone-soft px-2 py-0.5 text-[11px] text-ink-soft"
                                  >
                                    <strong className="mr-1 text-ink">{o.label}:</strong> {o.val}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline/40 pt-2 text-xs">
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
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Card 2: Delivery & Shipping Address */}
              <div className="rounded-2xl border border-hairline/70 bg-bone p-5 shadow-2xs sm:p-6">
                <div className="flex items-center justify-between border-b border-hairline/60 pb-3.5">
                  <div className="flex items-center gap-2">
                    <FiTruck className="text-gold-deep" size={16} />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      Delivery &amp; Shipping Address
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium text-accent">Insured Express Courier</span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="text-xs leading-relaxed text-ink-soft">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                      Recipient
                    </p>
                    <p className="mt-1 font-semibold text-ink text-sm">
                      {addr.name || 'Customer'}
                    </p>
                    {addr.phone && (
                      <p className="mt-1 flex items-center gap-1.5 text-ink-soft">
                        <FiPhone size={12} className="text-ink-muted" /> {addr.phone}
                      </p>
                    )}
                  </div>

                  <div className="text-xs leading-relaxed text-ink-soft">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                      Destination Address
                    </p>
                    <address className="mt-1 not-italic">
                      {addr.label && <span className="block font-medium text-ink">{addr.label}</span>}
                      {addr.line1 && <span className="block">{addr.line1}</span>}
                      {addr.line2 && <span className="block">{addr.line2}</span>}
                      <span className="block">
                        {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </span>
                      {addr.country && <span className="block text-ink-muted">{addr.country}</span>}
                    </address>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-hairline/60 bg-bone-soft/60 px-3.5 py-2.5 text-xs text-ink-muted">
                  <p>
                    📦 <strong className="text-ink">Packaging Standard:</strong> Shipped in rigid multi-layer shockproof boxes with protective corner guards to guarantee flawless arrival.
                  </p>
                </div>
              </div>

              {/* Card 3: Transit Protection & Unboxing Policy */}
              <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5 sm:p-6 text-xs text-ink-soft shadow-2xs">
                <div className="flex items-center gap-2 font-semibold text-xs tracking-wider uppercase text-ink">
                  <FiShield className="text-gold-deep" size={17} />
                  <span>Transit Protection &amp; Doorstep Guarantee</span>
                </div>
                <p className="mt-2.5 leading-relaxed">
                  All orders are backed by our <strong>100% Free Doorstep Replacement Guarantee</strong>.
                  In the rare event of transit damage, an <strong>uncut, continuous parcel unboxing video</strong> (recorded
                  from opening the sealed courier box) is <strong>strictly mandatory</strong>. Please notify us within{' '}
                  <strong>48 hours of delivery</strong> via WhatsApp or email for instant replacement dispatch.
                </p>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Payment Summary, Payment Details & Concierge ── */}
            <div className="space-y-6 min-w-0 lg:sticky lg:top-24">
              {/* Card 1: Payment Summary */}
              <div className="rounded-2xl border border-hairline/70 bg-bone p-5 shadow-2xs sm:p-6">
                <div className="border-b border-hairline/60 pb-3.5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                    Payment Summary
                  </h2>
                </div>

                <dl className="mt-4 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-ink-soft">
                    <dt>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</dt>
                    <dd className="font-medium text-ink">{formatINR(order.subtotal || order.total)}</dd>
                  </div>

                  <div className="flex items-center justify-between text-ink-soft">
                    <dt>Shipping Fee</dt>
                    <dd className="font-semibold text-accent">
                      {order.shipping ? formatINR(order.shipping) : 'FREE'}
                    </dd>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex items-center justify-between text-sale">
                      <dt>Promotional Discount</dt>
                      <dd className="font-semibold">− {formatINR(order.discount)}</dd>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-ink-muted text-xs">
                    <dt>Taxes</dt>
                    <dd>Price includes all taxes</dd>
                  </div>

                  <div className="flex items-center justify-between border-t border-hairline/70 pt-3.5 text-base font-semibold text-ink">
                    <dt>Total Amount</dt>
                    <dd className="text-lg font-bold text-ink">{formatINR(order.total)}</dd>
                  </div>
                </dl>
              </div>

              {/* Card 2: Payment Details */}
              <div className="rounded-2xl border border-hairline/70 bg-bone p-5 shadow-2xs sm:p-6">
                <div className="border-b border-hairline/60 pb-3.5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                    Payment Information
                  </h2>
                </div>

                <div className="mt-4 space-y-2.5 text-xs text-ink-soft">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Payment Method:</span>
                    <span className="font-semibold uppercase text-ink">
                      {order.payment?.method === 'cod' ? 'Cash On Delivery' : 'Online (Razorpay)'}
                    </span>
                  </div>

                  {order.payment?.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-ink-muted">Paid At:</span>
                      <span className="font-medium text-ink">{fmtDateTime(order.payment.paidAt)}</span>
                    </div>
                  )}

                  {order.payment?.razorpayPaymentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-ink-muted">Payment Ref:</span>
                      <span className="font-mono text-[11px] font-medium text-ink">
                        {order.payment.razorpayPaymentId}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-hairline/60 bg-bone-soft/60 px-3 py-2 text-[11px] text-ink-muted">
                    <FiCheckCircle size={13} className="text-accent shrink-0" />
                    <span>256-Bit SSL Encrypted &amp; Verified</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Art Concierge & Customer Support */}
              <div className="no-print rounded-2xl border border-hairline/70 bg-bone p-5 shadow-2xs sm:p-6">
                <div className="border-b border-hairline/60 pb-3.5">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                    Art Concierge &amp; Help
                  </h2>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                  Need custom framing guidance, delivery inquiries, or assistance with your order? Our art advisors are here to help.
                </p>

                <div className="mt-4 space-y-2.5">
                  {/* ONLY show Download Invoice here if the order is successfully DELIVERED */}
                  {isDelivered && (
                    <button
                      type="button"
                      onClick={() => setInvoiceOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/50 bg-bone-soft px-4 py-2.5 text-xs font-semibold text-gold-deep shadow-2xs transition hover:bg-gold/15"
                    >
                      <FiDownload size={14} />
                      <span>Download Official Invoice</span>
                    </button>
                  )}

                  <a
                    href={`https://wa.me/918284865051?text=${waMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-ink shadow-2xs transition hover:bg-gold-light"
                  >
                    <FiMessageCircle size={15} />
                    <span>WhatsApp Concierge Support</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm" className="w-full text-xs">
                      <Link to="/shop">
                        Explore Art
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full text-xs">
                      <Link to="/account/orders">
                        All Orders
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standardized Tax Invoice Modal (Only opens for delivered orders) */}
          <OrderInvoiceModal
            open={invoiceOpen}
            onClose={() => setInvoiceOpen(false)}
            order={order}
          />
        </>
      )}
    </div>
  );
}
