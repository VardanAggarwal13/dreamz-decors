import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    blurb: String,
    image: { url: String, publicId: String },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ isActive: 1, order: 1, title: 1 });
categorySchema.index({ parent: 1, isActive: 1, order: 1 });

export default mongoose.model('Category', categorySchema);
