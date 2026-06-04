import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  const exists = await User.findOne({ email: normalizedEmail }).select('_id').lean();
  if (exists) {
    res.status(409);
    throw new Error('Email already registered');
  }
  const user = await User.create({ name, email: normalizedEmail, password, phone });
  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user._id),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token: generateToken(user._id),
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;
  await req.user.save();
  res.json({ success: true, user: req.user });
});
