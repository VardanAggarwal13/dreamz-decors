import mongoose from 'mongoose';

// Notification types — keep in sync with email templates and the frontend.
export const NOTIFICATION_TYPES = [
  'order_placed',
  'order_paid',
  'order_processing',
  'order_shipped',
  'order_delivered',
  'order_cancelled',
  'order_refunded',
  'account_welcome',
  // Admin-facing alerts
  'admin_new_order',
  'admin_order_paid',
  'generic',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'generic' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // Optional context (e.g. orderId, link) used by the UI when the user clicks.
    data: { type: Object, default: {} },
    link: { type: String },
    // Which channels actually delivered — useful for debugging / auditing.
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// List newest-first per user, and count unread quickly.
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

export default mongoose.model('Notification', notificationSchema);
