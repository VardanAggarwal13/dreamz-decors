import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { buildPagination, buildPaginationMeta, paginationPresets, parseNumber } from '../utils/query.js';

import mongoose from 'mongoose';

const PRODUCT_LIST_SELECT =
  'title slug description price mrp badge images rating reviewsCount stock isFeatured sales category variants createdAt';

const SORT_MAP = {
  new: { createdAt: -1, _id: -1 },
  bestselling: { sales: -1, isFeatured: -1, rating: -1, reviewsCount: -1, createdAt: -1, _id: -1 },
  rating: { rating: -1, reviewsCount: -1, sales: -1, _id: -1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: -1 },
};

export const listProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    tag,
    minPrice,
    maxPrice,
    sort = 'new',
    page,
    limit,
    featured,
    isFeatured,
    exclude,
    badge,
  } = req.query;

  const filter = { isActive: true };
  const normalizedSearch = typeof q === 'string' ? q.trim() : '';
  const normalizedTag = typeof tag === 'string' ? tag.trim() : '';
  const min = parseNumber(minPrice);
  const max = parseNumber(maxPrice);

  if (normalizedSearch) filter.$text = { $search: normalizedSearch };
  if (category) {
    const rawCategory = String(category).trim();
    if (mongoose.Types.ObjectId.isValid(rawCategory) && rawCategory.length === 24) {
      filter.category = new mongoose.Types.ObjectId(rawCategory);
    } else {
      const catDoc = await Category.findOne({ slug: rawCategory.toLowerCase() }).select('_id').lean();
      if (catDoc) {
        filter.category = catDoc._id;
      } else {
        filter.category = new mongoose.Types.ObjectId();
      }
    }
  }
  if (normalizedTag) filter.tags = normalizedTag;
  if (badge) filter.badge = badge;
  if (featured === 'true' || isFeatured === 'true') {
    filter.isFeatured = true;
  } else if (featured === 'false' || isFeatured === 'false') {
    filter.isFeatured = false;
  }
  if (exclude) {
    const rawIds = typeof exclude === 'string' ? exclude.split(',') : Array.isArray(exclude) ? exclude : [];
    const excludeIds = rawIds
      .map((id) => (typeof id === 'string' ? id.trim() : ''))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (excludeIds.length > 0) {
      filter._id = { $nin: excludeIds };
    }
  }
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

  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  res.json({
    success: true,
    data: items,
    ...buildPaginationMeta(total, currentPage, pageSize),
  });
});

const escapeRegex = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getProduct = asyncHandler(async (req, res) => {
  const rawParam = String(req.params.slug || '').trim();
  let decoded = rawParam;
  try {
    decoded = decodeURIComponent(rawParam).trim();
  } catch {}

  const slugKebab = slugify(decoded);
  const slugSpace = decoded.replace(/-/g, ' ').trim();

  // Build candidate slugs to query
  const candidates = Array.from(
    new Set([
      rawParam,
      decoded,
      decoded.toLowerCase(),
      slugKebab,
      slugSpace,
      `${decoded} `,
      `${slugKebab} `,
      `${slugSpace} `,
    ])
  ).filter(Boolean);

  const queryOr = [
    { slug: { $in: candidates } },
    { slug: new RegExp(`^${escapeRegex(slugKebab).replace(/-/g, '[- ]*')}\\s*$`, 'i') },
  ];

  if (mongoose.Types.ObjectId.isValid(decoded) && decoded.length === 24) {
    queryOr.push({ _id: new mongoose.Types.ObjectId(decoded) });
  }

  let product = await Product.findOne({
    isActive: true,
    $or: queryOr,
  })
    .populate('category', 'title slug')
    .lean();

  if (!product && decoded) {
    // Fallback: match by title prefix if slug didn't directly match
    product = await Product.findOne({
      isActive: true,
      title: new RegExp(`^${escapeRegex(decoded)}`, 'i'),
    })
      .populate('category', 'title slug')
      .lean();
  }

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  res.json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.slug || payload.title) {
    payload.slug = slugify(payload.slug || payload.title);
  }
  if (Array.isArray(payload.frameOptions)) {
    payload.frameOptions = payload.frameOptions.map((f) => String(f).trim()).filter(Boolean);
  }
  if (Array.isArray(payload.variants)) {
    payload.variants = payload.variants
      .filter((v) => v && (v.size || v.frame || v.price != null))
      .map((v, idx) => ({
        ...v,
        size: v.size ? String(v.size).trim() : '',
        frame: v.frame ? String(v.frame).trim() : '',
        sku: v.sku || `${payload.slug || 'item'}-${v.size || idx}${v.frame ? `-${v.frame.replace(/[^a-zA-Z0-9]+/g, '')}` : ''}`,
        price: Number(v.price) || 0,
        mrp: v.mrp ? Number(v.mrp) : undefined,
        stock: v.stock ? Number(v.stock) : 0,
      }));
    if (payload.variants.length > 0 && (!payload.price || payload.price === 0)) {
      payload.price = payload.variants[0].price;
    }
  }
  const product = await Product.create(payload);
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.slug || payload.title) {
    payload.slug = slugify(payload.slug || payload.title);
  }
  if (Array.isArray(payload.frameOptions)) {
    payload.frameOptions = payload.frameOptions.map((f) => String(f).trim()).filter(Boolean);
  }
  if (Array.isArray(payload.variants)) {
    payload.variants = payload.variants
      .filter((v) => v && (v.size || v.frame || v.price != null))
      .map((v, idx) => ({
        ...v,
        size: v.size ? String(v.size).trim() : '',
        frame: v.frame ? String(v.frame).trim() : '',
        sku: v.sku || `${payload.slug || 'item'}-${v.size || idx}${v.frame ? `-${v.frame.replace(/[^a-zA-Z0-9]+/g, '')}` : ''}`,
        price: Number(v.price) || 0,
        mrp: v.mrp ? Number(v.mrp) : undefined,
        stock: v.stock ? Number(v.stock) : 0,
      }));
    if (payload.variants.length > 0 && (!payload.price || payload.price === 0)) {
      payload.price = payload.variants[0].price;
    }
  }
  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
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
