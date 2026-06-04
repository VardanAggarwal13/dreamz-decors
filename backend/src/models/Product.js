import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    size: String,
    frame: String,
    color: String,
    price: { type: Number, required: true },
    mrp: Number,
    stock: { type: Number, default: 0 },
    image: String,
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    tags: [{ type: String, index: true }],
    images: [{ url: String, publicId: String, alt: String }],
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    badge: String,
    variants: [variantSchema],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    sales: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, sales: -1 });
productSchema.index({ isActive: 1, rating: -1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, category: 1, createdAt: -1 });
productSchema.index({ isActive: 1, category: 1, sales: -1 });

export default mongoose.model('Product', productSchema);
