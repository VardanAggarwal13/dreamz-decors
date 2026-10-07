import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import ProductReview from '../models/ProductReview.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Recompute a product's average rating + review count from its reviews (considering ratings >= 4).
async function recomputeRating(productId) {
  const agg = await ProductReview.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), rating: { $gte: 4 } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 5, count = 0 } = agg[0] || {};
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
    reviewsCount: count,
  });
  return { rating: Math.round(avg * 10) / 10, reviewsCount: count };
}

// GET /api/products/:id/reviews — public list (only reviews >= 4 stars)
export const listProductReviews = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.json({ success: true, data: [] });
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const reviews = await ProductReview.find({
    product: req.params.id,
    rating: { $gte: 4 }, // Only display verified top-tier reviews (>= 4 stars)
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ success: true, data: reviews });
});

// POST /api/products/:id/reviews — create or update the user's review (verified buyers only)
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

  // Strict check: Only users whose order has been successfully delivered and was placed within 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const eligibleOrder = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'delivered',
    createdAt: { $gte: thirtyDaysAgo },
  }).lean();

  if (!eligibleOrder && req.user.role !== 'admin') {
    const anyOrder = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
    }).sort({ createdAt: -1 }).lean();

    if (!anyOrder) {
      res.status(403);
      throw new Error('Only verified art collectors who have ordered this artwork can submit a review.');
    }
    if (anyOrder.orderStatus !== 'delivered') {
      res.status(403);
      throw new Error('Reviews can only be submitted after your order is successfully delivered.');
    }
    if (new Date(anyOrder.createdAt) < thirtyDaysAgo) {
      res.status(403);
      throw new Error('Reviews can only be submitted within 30 days of placing your order.');
    }
    res.status(403);
    throw new Error('You are not eligible to review this artwork.');
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
