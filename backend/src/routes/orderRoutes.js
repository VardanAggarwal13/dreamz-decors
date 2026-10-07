import { Router } from 'express';
import {
  createOrder,
  myOrders,
  getOrder,
  getOrderReviews,
  listOrders,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', createOrder);
router.get('/me', myOrders);
router.get('/:id', getOrder);
router.get('/:id/reviews', getOrderReviews);

router.get('/', adminOnly, listOrders);
router.patch('/:id/status', adminOnly, updateOrderStatus);
router.delete('/:id', adminOnly, deleteOrder);

export default router;
