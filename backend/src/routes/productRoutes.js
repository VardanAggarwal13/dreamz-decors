import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { listProductReviews, upsertProductReview } from '../controllers/productReviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', listProducts);
// Product reviews (keep before /:slug so the param shape is unambiguous)
router.get('/:id/reviews', listProductReviews);
router.post('/:id/reviews', protect, upsertProductReview);

router.get('/:slug', getProduct);
router.post('/', protect, adminOnly, createProduct);
router.patch('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
