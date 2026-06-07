import asyncHandler from 'express-async-handler';
import Content from '../models/Content.js';

// GET /api/content/:key — public; returns the override data or null.
export const getContent = asyncHandler(async (req, res) => {
  const doc = await Content.findOne({ key: req.params.key.toLowerCase() }).lean();
  res.json({ success: true, data: doc?.data ?? null });
});

// GET /api/content — admin; list all overrides (keys + data).
export const listContent = asyncHandler(async (req, res) => {
  const docs = await Content.find().select('key data updatedAt').lean();
  res.json({ success: true, data: docs });
});

// PUT /api/content/:key — admin; upsert the content override.
export const putContent = asyncHandler(async (req, res) => {
  const key = req.params.key.toLowerCase();
  const { data } = req.body;
  if (data === undefined || typeof data !== 'object') {
    res.status(400);
    throw new Error('data (object) is required');
  }
  const doc = await Content.findOneAndUpdate(
    { key },
    { key, data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, data: doc.data });
});
