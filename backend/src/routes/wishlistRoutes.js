import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  mergeWishlist,
  clearWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/merge', mergeWishlist);
router.delete('/', clearWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
