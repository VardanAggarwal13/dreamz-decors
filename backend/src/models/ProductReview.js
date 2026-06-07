import mongoose from 'mongoose';

const productReviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, default: 'Customer' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    title: { type: String, trim: true, default: '' },
    comment: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// One review per user per product (upsert on re-review).
productReviewSchema.index({ product: 1, user: 1 }, { unique: true });
productReviewSchema.index({ product: 1, createdAt: -1 });

export default mongoose.model('ProductReview', productReviewSchema);
