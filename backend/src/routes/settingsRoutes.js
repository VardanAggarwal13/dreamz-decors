import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', getSettings);
router.patch('/', protect, adminOnly, updateSettings);

export default router;
