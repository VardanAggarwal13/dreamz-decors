import asyncHandler from 'express-async-handler';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth.js';
import User from '../models/User.js';

// Validates the Better Auth session (cookie) and loads the app user.
export const protect = asyncHandler(async (req, res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) {
    res.status(401);
    throw new Error('Not authorized — please sign in');
  }

  // Better Auth shares the "users" collection (native ObjectId _id), so the
  // session user id maps straight to our mongoose User document.
  const user = await User.findById(session.user.id).select(
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
