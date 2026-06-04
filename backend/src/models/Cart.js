import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    qty: { type: Number, required: true, min: 1, default: 1 },
    options: { type: Object, default: {} },
    priceAtAdd: Number,
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);
export default mongoose.model('Cart', cartSchema);
