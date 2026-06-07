import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import ProductReview from '../models/ProductReview.js';
import Product from '../models/Product.js';

// Recompute a product's average rating + review count from its reviews.
async function recomputeRating(productId) {
  const agg = await ProductReview.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
    reviewsCount: count,
  });
  return { rating: Math.round(avg * 10) / 10, reviewsCount: count };
}

// GET /api/products/:id/reviews — public list
export const listProductReviews = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.json({ success: true, data: [] });
  const reviews = await ProductReview.find({ product: req.params.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data: reviews });
});

// POST /api/products/:id/reviews — create or update the user's review
export const upsertProductReview = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  if (!mongoose.isValidObjectId(productId)) {
    res.status(400);
    throw new Error('Invalid product');
  }
  const product = await Product.findById(productId).select('_id').lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const rating = Math.min(5, Math.max(1, Number(req.body.rating) || 5));
  const review = await ProductReview.findOneAndUpdate(
    { product: productId, user: req.user._id },
    { name: req.user.name, rating, title: req.body.title || '', comment: req.body.comment || '' },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const stats = await recomputeRating(productId);
  res.status(201).json({ success: true, data: { review, ...stats } });
});
