import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

export const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.cookies?.token;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — no token');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select(
    'name email role phone addresses wishlist createdAt updatedAt'
  );
  if (!user) {
    res.status(401);
    throw new Error('Not authorized — user not found');
  }
  req.user = user;
  next();
});

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    return next(new Error('Admin access required'));
  }
  next();
};
