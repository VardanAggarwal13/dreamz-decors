import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    image: String,
    price: Number,
    qty: Number,
    options: Object,
  },
  { _id: false }
);

/*
 * Order status, payment status, and fulfillment status are three DIFFERENT
 * business processes and must never be collapsed into one field:
 *
 *   orderStatus       — where the order is in its lifecycle
 *   paymentStatus     — what the money has actually done (source of truth: Razorpay)
 *   fulfillmentStatus — where the goods are
 *
 * `status` is a LEGACY mirror of orderStatus, kept in sync by the pre-save hook
 * below purely so existing dashboard aggregations and UI badges keep working.
 * New code should read orderStatus / paymentStatus and never write `status`.
 */
export const ORDER_STATUS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
  'expired',
  'refunded',
  'partially_refunded',
];

export const PAYMENT_STATUS = [
  'pending',
  'authorized',
  'captured',
  'failed',
  'expired',
  'refund_initiated',
  'refunded',
  'partially_refunded',
];

export const FULFILLMENT_STATUS = ['unfulfilled', 'packed', 'shipped', 'delivered'];

// orderStatus → the value the old `status` enum used, so nothing downstream breaks.
const LEGACY_STATUS = {
  pending: 'pending',
  confirmed: 'paid',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  failed: 'cancelled',
  expired: 'cancelled',
  refunded: 'refunded',
  partially_refunded: 'refunded',
};

export const legacyStatusFor = (orderStatus) => LEGACY_STATUS[orderStatus] || 'pending';

// Append-only audit trail. Nothing in the payment flow should happen silently.
const orderEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // e.g. 'payment.captured'
    at: { type: Date, default: Date.now },
    source: String, // 'verify' | 'webhook' | 'admin' | 'reconcile'
    meta: Object,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: Number,
    shipping: Number,
    discount: Number,
    total: Number,
    currency: { type: String, default: 'INR' },

    orderStatus: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'pending', index: true },
    fulfillmentStatus: { type: String, enum: FULFILLMENT_STATUS, default: 'unfulfilled' },

    // Deprecated mirror of orderStatus — see note above. Do not write directly.
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    payment: {
      method: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      amount: Number, // paise, exactly what Razorpay charged
      paidAt: Date,
      failedAt: Date,
      failureReason: String,
      refundId: String,
      refundedAmount: { type: Number, default: 0 }, // paise
      refundedAt: Date,
    },

    events: [orderEventSchema],

    shippingAddress: Object,
    notes: String,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.razorpayOrderId': 1 }, { unique: true, sparse: true });
orderSchema.index({ 'payment.razorpayPaymentId': 1 }, { unique: true, sparse: true });

// Keep the legacy `status` field consistent with orderStatus on every save.
orderSchema.pre('save', function syncLegacyStatus(next) {
  this.status = legacyStatusFor(this.orderStatus);
  next();
});

export default mongoose.model('Order', orderSchema);
