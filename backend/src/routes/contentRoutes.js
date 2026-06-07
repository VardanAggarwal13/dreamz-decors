import { Router } from 'express';
import { getContent, listContent, putContent } from '../controllers/contentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// Admin
router.get('/', protect, adminOnly, listContent);
router.put('/:key', protect, adminOnly, putContent);

// Public
router.get('/:key', getContent);

export default router;
