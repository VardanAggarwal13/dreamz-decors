import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitContact } from '../controllers/contactController.js';

const router = Router();

// Tighter limit than the global API cap — the contact form is a spam/abuse
// vector. Allow a handful of submissions per IP per 15 minutes.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages — please try again later.' },
});

// Public — no auth.
router.post('/', contactLimiter, submitContact);

export default router;
