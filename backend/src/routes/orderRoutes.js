import { Router } from 'express';
import {
  createOrder,
  myOrders,
  getOrder,
  listOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', createOrder);
router.get('/me', myOrders);
router.get('/:id', getOrder);

router.get('/', adminOnly, listOrders);
router.patch('/:id/status', adminOnly, updateOrderStatus);

export default router;
