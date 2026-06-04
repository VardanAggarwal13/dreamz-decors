import asyncHandler from 'express-async-handler';
import Category from '../models/Category.js';

export const listCategories = asyncHandler(async (req, res) => {
  const cats = await Category.find({ isActive: true })
    .sort({ order: 1, title: 1 })
    .select('title slug blurb image parent order isActive createdAt updatedAt')
    .lean();
  res.json({ success: true, data: cats });
});

export const createCategory = asyncHandler(async (req, res) => {
  const cat = await Category.create(req.body);
  res.status(201).json({ success: true, data: cat });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true, data: cat });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json({ success: true });
});
