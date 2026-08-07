import { useState } from 'react';
import { toast } from 'sonner';
import { FiRotateCcw, FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import PaymentStatusBadge from '@/components/common/PaymentStatusBadge';
import api from '@/lib/api';
import useAdminList from '@/hooks/useAdminList';
import { AdminListSkeleton } from '@/components/admin/AdminSkeleton';
import AdminSearch from '@/components/admin/AdminSearch';
import AdminPagination from '@/components/admin/AdminPagination';
import { formatINR } from '@/lib/utils';

const PAYMENT_STATUSES = [
  'captured',
  'pending',
  'failed',
  'refund_initiated',
  'refunded',
  'partially_refunded',
  'authorized',
];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const shortId = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '—');

export default function AdminPayments() {
  const [tab, setTab] = useState('payments');

  return (
    <div>
      <Seo title="Admin — Payments" noIndex />

      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Payments</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every payment, refund, and webhook Razorpay has sent us — your reconciliation record.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ['payments', 'Payments & refunds'],
          ['webhooks', 'Webhook log'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              tab === key ? 'bg-ink text-bone' : 'border border-hairline text-ink-soft hover:border-gold/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'payments' ? <PaymentsTab /> : <WebhooksTab />}
    </div>
  );
}

// ── Payments & refunds ───────────────────────────────────────────────────────
function PaymentsTab() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [refunding, setRefunding] = useState(null);

  const makePath = ({ page, limit }) => {
    const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) sp.set('status', status);
    if (q.trim()) sp.set('q', q.trim());
    return `/admin/payments?${sp.toString()}`;
  };
  const { items, meta, loading, goTo, reload, raw } = useAdminList(makePath, [q, status], { limit: 15 });
  const summary = raw?.summary;

  const refund = async (row) => {
    const label = `${formatINR(row.total)} for order ${shortId(row._id)}`;
    if (!window.confirm(`Refund ${label}?\n\nThis moves real money via Razorpay. The order is marked refunded only once Razorpay confirms it.`)) return;
    setRefunding(row._id);
    try {
      const res = await api.post(`/payments/refund/${row._id}`);
      toast.success(`Refund of ${formatINR((res.data?.amount || 0) / 100)} initiated`);
      reload();
    } catch (err) {
      toast.error(err.message || 'Refund failed');
    } finally {
      setRefunding(null);
    }
  };

  return (
    <>
      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat Icon={FiCheckCircle} label="Captured" value={formatINR(summary.capturedAmount)} tone="text-accent" />
          <Stat Icon={FiRotateCcw} label="Refunded" value={formatINR(summary.refundedAmount)} tone="text-ink-soft" />
          <Stat Icon={FiAlertTriangle} label="Failed" value={summary.failedCount} tone="text-sale" />
          <Stat Icon={FiClock} label="Awaiting" value={summary.pendingCount} tone="text-gold-deep" />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <AdminSearch value={q} onChange={setQ} placeholder="Search payment id, order id, customer…" className="max-w-sm flex-1" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-hairline bg-bone px-3 py-2.5 text-sm text-ink-soft outline-none focus:border-gold"
        >
          <option value="">All payment statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <AdminListSkeleton rows={6} cols={6} withAvatar={false} />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-hairline/60 bg-bone">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Payment ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row._id} className="border-b border-hairline/40 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{fmtDate(row.payment?.paidAt || row.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{shortId(row._id)}</td>
                    <td className="px-4 py-3 text-ink-soft">{row.user?.name || row.user?.email || '—'}</td>
                    <td className="px-4 py-3 text-ink-soft">{(row.payment?.method || '—').toUpperCase()}</td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {formatINR(row.total)}
                      {row.payment?.refundedAmount > 0 && (
                        <span className="block text-xs font-normal text-ink-muted">
                          −{formatINR(row.payment.refundedAmount / 100)} refunded
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="break-all font-mono text-xs text-ink-soft">
                        {row.payment?.razorpayPaymentId || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={row.paymentStatus} /></td>
                    <td className="px-4 py-3">
                      {row.paymentStatus === 'captured' ? (
                        <button
                          type="button"
                          onClick={() => refund(row)}
                          disabled={refunding === row._id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-bone px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-sale/50 hover:text-sale disabled:opacity-50"
                        >
                          <FiRotateCcw size={13} /> {refunding === row._id ? 'Refunding…' : 'Refund'}
                        </button>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-ink-muted">
                      {q || status ? 'No payments match those filters.' : 'No payments yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={goTo} />
        </>
      )}
    </>
  );
}

// ── Webhook delivery log ─────────────────────────────────────────────────────
const WEBHOOK_TONE = {
  processed: 'border-accent/30 bg-accent/10 text-accent',
  processing: 'border-gold/30 bg-gold/15 text-gold-deep',
  failed: 'border-sale/30 bg-sale/10 text-sale',
};

function WebhooksTab() {
  const [status, setStatus] = useState('');
  const makePath = ({ page, limit }) => {
    const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) sp.set('status', status);
    return `/admin/webhook-events?${sp.toString()}`;
  };
  const { items, meta, loading, goTo } = useAdminList(makePath, [status], { limit: 15 });

  return (
    <>
      <p className="mt-6 rounded-lg border border-hairline/60 bg-bone-soft px-4 py-2.5 text-xs leading-5 text-ink-soft">
        Razorpay's webhook is the authoritative record of what happened to a payment. Anything marked
        <span className="font-medium"> failed</span> was retried by Razorpay — if it stays failed, the order may need manual reconciliation.
      </p>

      <div className="mt-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-hairline bg-bone px-3 py-2.5 text-sm text-ink-soft outline-none focus:border-gold"
        >
          <option value="">All events</option>
          <option value="processed">Processed</option>
          <option value="failed">Failed</option>
          <option value="processing">Processing</option>
        </select>
      </div>

      {loading ? (
        <AdminListSkeleton rows={6} cols={5} withAvatar={false} />
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-hairline/60 bg-bone">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Event ID</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e._id} className="border-b border-hairline/40 last:border-0">
                    <td className="px-4 py-3 text-ink-muted">{fmtDate(e.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">{e.event}</td>
                    <td className="px-4 py-3"><span className="break-all font-mono text-xs text-ink-soft">{e.eventId}</span></td>
                    <td className="px-4 py-3 text-ink-soft">{e.order ? shortId(e.order) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${WEBHOOK_TONE[e.status] || WEBHOOK_TONE.processing}`}>
                        {e.status}
                      </span>
                      {e.error && <span className="mt-1 block max-w-[220px] truncate text-xs text-sale" title={e.error}>{e.error}</span>}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-ink-muted">
                      No webhook events yet. Once you add the webhook URL in your Razorpay dashboard, deliveries appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={goTo} />
        </>
      )}
    </>
  );
}

function Stat({ Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-hairline/60 bg-bone p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
        <Icon size={14} className={tone} /> {label}
      </div>
      <p className="mt-2 font-display text-xl text-ink sm:text-2xl">{value}</p>
    </div>
  );
}
