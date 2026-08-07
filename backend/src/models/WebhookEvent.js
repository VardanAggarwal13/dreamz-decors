import mongoose from 'mongoose';

/*
 * Dedupe store for Razorpay webhooks. Razorpay retries delivery and can send the
 * same event more than once, so every event is claimed by its `eventId` (the
 * `x-razorpay-event-id` header) behind a unique index. A duplicate insert throws
 * E11000, which the handler treats as "already processed" and answers 200.
 */
const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    event: String, // e.g. 'payment.captured'
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    status: { type: String, enum: ['processing', 'processed', 'failed'], default: 'processing' },
    error: String,
    payload: Object,
    processedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('WebhookEvent', webhookEventSchema);
