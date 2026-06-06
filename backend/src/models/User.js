import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    phone: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

// NOTE: Better Auth owns this "users" collection and manages credentials in its
// own "account" collection — so there is no password/hashing here. This schema
// is the app-side view of the user (profile + relations).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true, strict: false }
);

userSchema.index({ wishlist: 1 });

export default mongoose.model('User', userSchema);
