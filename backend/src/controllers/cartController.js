import asyncHandler from 'express-async-handler';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { createOptionsFingerprint } from '../utils/query.js';

const populateCart = (cart) =>
  cart.populate({
    path: 'items.product',
    select: 'title slug price mrp images stock',
  });

export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  await populateCart(cart);

  // Filter out any stale items whose product was removed or deactivated
  const validItems = cart.items.filter((i) => Boolean(i.product && i.product.isActive !== false));
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
    await populateCart(cart);
  }

  res.json({ success: true, data: cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, id, qty = 1, options = {}, variantId } = req.body;
  const targetId = String(productId || id || '');
  const quantity = Number.parseInt(qty, 10);
  if (!targetId || !Number.isInteger(quantity) || quantity <= 0) {
    res.status(400);
    throw new Error('Valid product and positive quantity required');
  }

  const product = await Product.findOne({ _id: targetId, isActive: true })
    .select('price stock')
    .lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const optionsKey = createOptionsFingerprint(options);
  const existing = cart.items.find(
    (i) => String(i.product) === targetId && createOptionsFingerprint(i.options) === optionsKey
  );

  if (existing) {
    existing.qty += quantity;
  } else {
    cart.items.push({
      product: targetId,
      qty: quantity,
      options,
      variantId,
      priceAtAdd: product.price,
    });
  }

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, data: cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const quantity = Number.parseInt(qty, 10);
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  const item = cart.items.id(req.params.itemId);
  if (!item) {
    res.status(404);
    throw new Error('Item not in cart');
  }
  if (!Number.isInteger(quantity)) {
    res.status(400);
    throw new Error('Quantity must be an integer');
  }
  if (quantity <= 0) cart.items.pull(req.params.itemId);
  else item.qty = quantity;
  await cart.save();
  await populateCart(cart);
  res.json({ success: true, data: cart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  cart.items.pull(req.params.itemId);
  await cart.save();
  await populateCart(cart);
  res.json({ success: true, data: cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ success: true, data: { items: [] } });
});

// PUT /api/cart — replace the whole cart (used to sync the cart on
// login / before checkout). Prices come from the DB, not the client.
export const replaceCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  if (!Array.isArray(items)) {
    res.status(400);
    throw new Error('items must be an array');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const ids = items.map((i) => i.productId || i.id).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select('price')
    .lean();
  const priceById = new Map(products.map((p) => [String(p._id), p.price]));

  cart.items = items
    .filter((i) => {
      const pid = String(i.productId || i.id || '');
      return priceById.has(pid) && Number(i.qty) > 0;
    })
    .map((i) => {
      const pid = String(i.productId || i.id || '');
      return {
        product: pid,
        qty: Math.max(1, Number.parseInt(i.qty, 10) || 1),
        options: i.options || {},
        priceAtAdd: priceById.get(pid),
      };
    });

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, data: cart });
});

// POST /api/cart/merge — merges guest items into user account cart
export const mergeCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  if (!Array.isArray(items)) {
    res.status(400);
    throw new Error('items must be an array');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const ids = items.map((i) => i.productId || i.id).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select('price stock')
    .lean();
  const productById = new Map(products.map((p) => [String(p._id), p]));

  for (const item of items) {
    const pid = String(item.productId || item.id || '');
    const product = productById.get(pid);
    if (!product) continue;

    const quantity = Math.max(1, Number.parseInt(item.qty, 10) || 1);
    const options = item.options || {};
    const optionsKey = createOptionsFingerprint(options);

    const existing = cart.items.find(
      (i) => String(i.product) === pid && createOptionsFingerprint(i.options) === optionsKey
    );

    if (existing) {
      existing.qty = Math.min(product.stock != null ? product.stock : Infinity, existing.qty + quantity);
    } else {
      cart.items.push({
        product: pid,
        qty: Math.min(product.stock != null ? product.stock : Infinity, quantity),
        options,
        priceAtAdd: product.price,
      });
    }
  }

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, data: cart });
});

