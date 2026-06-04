import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { uploadSingle, uploadMultiple, deleteImage } from '../controllers/uploadController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/single', upload.single('image'), uploadSingle);
router.post('/multiple', upload.array('images', 10), uploadMultiple);
router.delete('/', adminOnly, deleteImage);

export default router;
