import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  refundOrder,
} from '../controllers/paymentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// NOTE: the webhook is NOT mounted here — Razorpay has no session and its
// signature is computed over the raw body, so it's mounted in app.js ahead of
// express.json(). Everything below is session-authenticated.
router.use(protect);

router.post('/razorpay/order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.get('/status/:orderId', getPaymentStatus);

router.post('/refund/:orderId', adminOnly, refundOrder);

export default router;
