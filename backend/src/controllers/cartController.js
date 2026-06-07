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
  res.json({ success: true, data: cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty = 1, options = {}, variantId } = req.body;
  const quantity = Number.parseInt(qty, 10);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    res.status(400);
    throw new Error('Quantity must be a positive integer');
  }

  const product = await Product.findOne({ _id: productId, isActive: true })
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
    (i) => String(i.product) === productId && createOptionsFingerprint(i.options) === optionsKey
  );

  if (existing) {
    existing.qty += quantity;
  } else {
    cart.items.push({
      product: productId,
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
  res.json({ success: true });
});

// PUT /api/cart — replace the whole cart (used to sync the guest cart on
// login / before checkout). Prices come from the DB, not the client.
export const replaceCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  if (!Array.isArray(items)) {
    res.status(400);
    throw new Error('items must be an array');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const ids = items.map((i) => i.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select('price')
    .lean();
  const priceById = new Map(products.map((p) => [String(p._id), p.price]));

  cart.items = items
    .filter((i) => priceById.has(String(i.productId)) && Number(i.qty) > 0)
    .map((i) => ({
      product: i.productId,
      qty: Math.max(1, Number.parseInt(i.qty, 10) || 1),
      options: i.options || {},
      priceAtAdd: priceById.get(String(i.productId)),
    }));

  await cart.save();
  await populateCart(cart);
  res.json({ success: true, data: cart });
});
