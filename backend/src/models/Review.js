import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    role: { type: String, trim: true, default: '' },
    quote: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    featured: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
