import express from 'express';
import Review from '../models/Review.js';

const router = express.Router();

// GET /api/reviews  — public, returns featured reviews ordered by `order`
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ featured: true })
      .sort({ order: 1, createdAt: 1 })
      .select('author role quote rating -_id')
      .lean();
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
});

export default router;
