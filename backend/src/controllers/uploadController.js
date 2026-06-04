import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js';

export const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  const result = await uploadBufferToCloudinary(req.file.buffer);
  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id },
  });
});

export const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    res.status(400);
    throw new Error('No files uploaded');
  }
  const results = await Promise.all(
    req.files.map((f) => uploadBufferToCloudinary(f.buffer))
  );
  res.status(201).json({
    success: true,
    data: results.map((r) => ({ url: r.secure_url, publicId: r.public_id })),
  });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    res.status(400);
    throw new Error('publicId is required');
  }
  await cloudinary.uploader.destroy(publicId);
  res.json({ success: true });
});
