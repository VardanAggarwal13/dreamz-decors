// Maps an order status to a label + token-based pill styling.
const STATUS = {
  pending:                 { label: 'Pending',               cls: 'border-hairline bg-bone-muted text-ink-muted' },
  paid:                    { label: 'Paid',                  cls: 'border-gold/30 bg-gold/15 text-gold-deep' },
  processing:              { label: 'Processing & Shipping', cls: 'border-gold/40 bg-gold/10 text-gold-deep' },
  shipped:                 { label: 'Processing & Shipping', cls: 'border-gold/40 bg-gold/10 text-gold-deep' },
  'processing & shipping': { label: 'Processing & Shipping', cls: 'border-gold/40 bg-gold/10 text-gold-deep' },
  delivered:               { label: 'Delivered',             cls: 'border-accent/30 bg-accent/10 text-accent' },
  cancelled:               { label: 'Cancelled',             cls: 'border-sale/30 bg-sale/10 text-sale' },
  refunded:                { label: 'Refunded',              cls: 'border-hairline bg-bone-muted text-ink-muted' },
};

export default function OrderStatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
