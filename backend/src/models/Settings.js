import mongoose from 'mongoose';

// Single document holding admin-editable, store-wide content/config.
const settingsSchema = new mongoose.Schema(
  {
    brand: {
      name: { type: String, default: 'DreamzDecors' },
      tagline: { type: String, default: 'Creative Decors · Innovative Design' },
      description: {
        type: String,
        default:
          'Premium canvas paintings, gallery sets, and framed decor crafted in India with secure packaging and safe online checkout.',
      },
    },
    contact: {
      email: { type: String, default: 'support@dreamzdecor.com' },
      phone: { type: String, default: '' },
      address: { type: String, default: 'Made in India, delivering pan India' },
      hours: { type: String, default: 'Mon–Sat: 10:00 AM – 7:00 PM\nSunday: Closed' },
    },
    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      pinterest: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    announcement: {
      enabled: { type: Boolean, default: true },
      messages: {
        type: [String],
        default: [
          'Free shipping on orders above ₹1,499',
          'Handcrafted in India',
          'Secure packaging guaranteed',
        ],
      },
    },
    shipping: {
      freeThreshold: { type: Number, default: 1499 },
      flatRate: { type: Number, default: 99 },
    },
  },
  { timestamps: true, minimize: false }
);

// Always work with a single settings document.
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export default mongoose.model('Settings', settingsSchema);
