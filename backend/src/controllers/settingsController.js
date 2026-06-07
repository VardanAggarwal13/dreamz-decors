import asyncHandler from 'express-async-handler';
import Settings from '../models/Settings.js';

const GROUPS = ['brand', 'contact', 'social', 'announcement', 'shipping'];

// GET /api/settings — public, used across the storefront
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.json({ success: true, data: settings });
});

// PATCH /api/settings — admin only; merges the provided groups
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();

  for (const group of GROUPS) {
    const incoming = req.body[group];
    if (incoming && typeof incoming === 'object') {
      for (const [key, value] of Object.entries(incoming)) {
        settings[group][key] = value;
      }
      settings.markModified(group);
    }
  }

  await settings.save();
  res.json({ success: true, data: settings });
});
