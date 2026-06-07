import mongoose from 'mongoose';

// Stores admin-edited content for a page, keyed by a stable string
// (e.g. 'about', 'shipping', 'faq', 'contact', 'terms', 'home').
// `data` mirrors the structure the frontend already renders, so layouts
// are unchanged — only the content is overridden.
const contentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model('Content', contentSchema);
