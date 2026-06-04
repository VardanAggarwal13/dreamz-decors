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

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: Number,
    shipping: Number,
    discount: Number,
    total: Number,
    currency: { type: String, default: 'INR' },
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
      paidAt: Date,
    },
    shippingAddress: Object,
    notes: String,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.razorpayOrderId': 1 }, { unique: true, sparse: true });
orderSchema.index({ 'payment.razorpayPaymentId': 1 }, { unique: true, sparse: true });

export default mongoose.model('Order', orderSchema);
