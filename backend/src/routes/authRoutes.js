import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many attempts, try again later.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);
router.patch('/me', protect, updateProfile);

export default router;
