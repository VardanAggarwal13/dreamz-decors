// Payment status is a SEPARATE business process from order status — it tracks
// what the money actually did, as confirmed by Razorpay's webhook.
const STATUS = {
  pending:            { label: 'Unpaid',        cls: 'border-hairline bg-bone-muted text-ink-muted' },
  authorized:         { label: 'Authorized',    cls: 'border-gold/30 bg-gold/10 text-gold-deep' },
  captured:           { label: 'Paid',          cls: 'border-accent/30 bg-accent/10 text-accent' },
  failed:             { label: 'Failed',        cls: 'border-sale/30 bg-sale/10 text-sale' },
  expired:            { label: 'Expired',       cls: 'border-hairline bg-bone-muted text-ink-muted' },
  refund_initiated:   { label: 'Refunding…',    cls: 'border-gold/30 bg-gold/15 text-gold-deep' },
  refunded:           { label: 'Refunded',      cls: 'border-ink/20 bg-ink/5 text-ink-soft' },
  partially_refunded: { label: 'Part. refunded', cls: 'border-ink/20 bg-ink/5 text-ink-soft' },
};

export default function PaymentStatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
