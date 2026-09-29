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
          'Handcrafted canvas paintings, gallery sets, and spiritual art designed to bring warmth, soul, and quiet luxury to modern Indian homes.',
      },
    },
    contact: {
      email: { type: String, default: 'dreamzdecor30@gmail.com' },
      phone: { type: String, default: '+91 82848 65051' },
      address: { type: String, default: 'Made in India, delivering pan India' },
      hours: { type: String, default: 'Mon–Sat: 10:00 AM – 7:00 PM\nSunday: Closed' },
    },
    social: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      pinterest: { type: String, default: '' },
      youtube: { type: String, default: '' },
      whatsapp: { type: String, default: 'https://wa.me/918284865051' },
    },
    announcement: {
      enabled: { type: Boolean, default: true },
      messages: {
        type: [String],
        default: [
          'Insured Pan-India Delivery',
          'Handcrafted in India',
          'Secure packaging guaranteed',
        ],
      },
    },
    shipping: {
      freeThreshold: { type: Number, default: 0 },
      flatRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true, minimize: false }
);

// Always work with a single settings document.
settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  let modified = false;
  if (!doc.contact || !doc.contact.email || doc.contact.email.includes('support@dreamzdecor.com')) {
    if (!doc.contact) doc.contact = {};
    doc.contact.email = 'dreamzdecor30@gmail.com';
    modified = true;
  }
  if (!doc.contact.phone || !doc.contact.phone.trim()) {
    doc.contact.phone = '+91 82848 65051';
    modified = true;
  }
  if (!doc.social?.whatsapp || doc.social.whatsapp.includes('1234567890')) {
    if (!doc.social) doc.social = {};
    doc.social.whatsapp = 'https://wa.me/918284865051';
    modified = true;
  }
  if (modified) {
    doc.markModified('contact');
    doc.markModified('social');
    await doc.save();
  }
  return doc;
};

export default mongoose.model('Settings', settingsSchema);
