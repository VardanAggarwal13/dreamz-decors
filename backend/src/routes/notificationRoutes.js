import { Router } from 'express';
import {
  myNotifications,
  unreadCount,
  markRead,
  markAllRead,
  removeNotification,
  vapidPublicKey,
  subscribePush,
  unsubscribePush,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// In-app notifications
router.get('/', myNotifications);
router.get('/unread-count', unreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', removeNotification);

// Web-push subscription management
router.get('/vapid-public-key', vapidPublicKey);
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);

export default router;
