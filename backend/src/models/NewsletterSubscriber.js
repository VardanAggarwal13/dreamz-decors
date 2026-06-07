import mongoose from 'mongoose';
import crypto from 'node:crypto';

// An email newsletter subscriber. Captured from the homepage band, the account
// page, or anywhere we ask for an email. One document per unique email.
const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed'],
      default: 'subscribed',
      index: true,
    },
    // Linked user, when a signed-in account subscribes (optional — guests too).
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Where the signup came from: 'website' | 'account' | 'checkout'.
    source: { type: String, default: 'website' },
    // Opaque token for one-click unsubscribe links in emails.
    unsubscribeToken: { type: String, index: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Generate an unsubscribe token on first create if one isn't set.
newsletterSubscriberSchema.pre('save', function ensureToken(next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(24).toString('hex');
  }
  next();
});

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
