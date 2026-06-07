import { Router } from 'express';
import {
  overview,
  listCustomers,
  updateUserRole,
  listAllProducts,
  listAllCategories,
  listSubscribers,
  removeSubscriber,
  sendCampaign,
  previewCampaign,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect, adminOnly);

router.get('/overview', overview);
router.get('/products', listAllProducts);
router.get('/categories', listAllCategories);
router.get('/customers', listCustomers);
router.patch('/customers/:id/role', updateUserRole);

router.get('/newsletter', listSubscribers);
router.post('/newsletter/send', sendCampaign);
router.post('/newsletter/preview', previewCampaign);
router.delete('/newsletter/:id', removeSubscriber);

export default router;
