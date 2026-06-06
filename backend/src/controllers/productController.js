import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import { buildPagination, buildPaginationMeta, paginationPresets, parseNumber } from '../utils/query.js';

const PRODUCT_LIST_SELECT =
  'title slug description price mrp badge images rating reviewsCount stock isFeatured sales category createdAt';

const SORT_MAP = {
  new: { createdAt: -1 },
  bestselling: { sales: -1, _id: -1 },
  rating: { rating: -1, _id: -1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: -1 },
};

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, tag, minPrice, maxPrice, sort = 'new', page, limit } = req.query;

  const filter = { isActive: true };
  const normalizedSearch = typeof q === 'string' ? q.trim() : '';
  const normalizedTag = typeof tag === 'string' ? tag.trim() : '';
  const min = parseNumber(minPrice);
  const max = parseNumber(maxPrice);

  if (normalizedSearch) filter.$text = { $search: normalizedSearch };
  if (category) filter.category = category;
  if (normalizedTag) filter.tags = normalizedTag;
  if (min !== null || max !== null) {
    filter.price = {};
    if (min !== null) filter.price.$gte = min;
    if (max !== null) filter.price.$lte = max;
  }

  const { page: currentPage, limit: pageSize, skip } = buildPagination(
    page,
    limit,
    paginationPresets.product
  );
  const sortBy = normalizedSearch
    ? { score: { $meta: 'textScore' }, createdAt: -1, _id: -1 }
    : SORT_MAP[sort] || SORT_MAP.new;
  const query = Product.find(filter)
    .select(PRODUCT_LIST_SELECT)
    .sort(sortBy)
    .skip(skip)
    .limit(pageSize)
    .populate('category', 'title slug')
    .lean();

  const [items, total] = await Promise.all([
    query,
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    ...buildPaginationMeta(total, currentPage, pageSize),
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'title slug')
    .lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true });
});
