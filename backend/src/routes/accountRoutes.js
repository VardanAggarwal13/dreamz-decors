import { Router } from 'express';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getNewsletterStatus,
  setNewsletterStatus,
} from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:addrId', updateAddress);
router.delete('/addresses/:addrId', deleteAddress);

router.get('/newsletter', getNewsletterStatus);
router.put('/newsletter', setNewsletterStatus);

export default router;
