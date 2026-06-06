import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import User from '../models/User.js';

const PRODUCT_SELECT = 'title slug description price mrp badge images rating reviewsCount stock category';

const validId = (id) => mongoose.isValidObjectId(id);

// Return the user's wishlist as populated product documents.
const loadWishlist = async (userId) => {
  const user = await User.findById(userId)
    .select('wishlist')
    .populate({ path: 'wishlist', select: PRODUCT_SELECT })
    .lean();
  return user?.wishlist || [];
};

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await loadWishlist(req.user._id) });
});

// POST /api/wishlist  { productId }
export const addToWishlist = asyncHandler(async (req, res) => {
  const productId = req.body.productId;
  if (!validId(productId)) {
    res.status(400);
    throw new Error('Valid productId is required');
  }
  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });
  res.json({ success: true, data: await loadWishlist(req.user._id) });
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!validId(productId)) {
    res.status(400);
    throw new Error('Valid productId is required');
  }
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });
  res.json({ success: true, data: await loadWishlist(req.user._id) });
});

// POST /api/wishlist/merge  { productIds: [] }  — merge guest items into the account
export const mergeWishlist = asyncHandler(async (req, res) => {
  const ids = (Array.isArray(req.body.productIds) ? req.body.productIds : []).filter(validId);
  if (ids.length) {
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: { $each: ids } } });
  }
  res.json({ success: true, data: await loadWishlist(req.user._id) });
});

// DELETE /api/wishlist  — clear all
export const clearWishlist = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $set: { wishlist: [] } });
  res.json({ success: true, data: [] });
});
