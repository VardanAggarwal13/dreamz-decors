import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Settings from '../models/Settings.js';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in environment.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.');

  let settings = await Settings.findOne();
  if (!settings) {
    console.log('Creating settings singleton...');
    settings = new Settings({});
  }

  settings.contact = {
    email: 'dreamzdecor30@gmail.com',
    phone: '+91 82848 65051',
    address: settings.contact?.address || 'Made in India, delivering pan India',
    hours: settings.contact?.hours || 'Mon–Sat: 10:00 AM – 7:00 PM\nSunday: Closed',
  };

  if (!settings.social) settings.social = {};
  settings.social.whatsapp = 'https://wa.me/918284865051';

  if (settings.announcement && Array.isArray(settings.announcement.messages)) {
    settings.announcement.messages = settings.announcement.messages.map((m) =>
      m.replace(/free shipping on all orders/gi, 'Insured Pan-India Delivery')
    );
  }

  settings.markModified('contact');
  settings.markModified('social');
  settings.markModified('announcement');

  await settings.save();
  console.log('Updated settings in MongoDB:');
  console.log('Contact:', settings.contact);
  console.log('Social:', settings.social);
  console.log('Announcement:', settings.announcement);

  await mongoose.disconnect();
  console.log('Disconnected.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error updating settings:', err);
  process.exit(1);
});
