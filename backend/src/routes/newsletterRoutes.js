import { Router } from 'express';
import { subscribe, unsubscribeByToken } from '../controllers/newsletterController.js';

const router = Router();

// Public — no auth. Anyone can subscribe; unsubscribe is opened from an email.
router.post('/subscribe', subscribe);
router.get('/unsubscribe', unsubscribeByToken);

export default router;
