// Promote a user to admin by email.
// Usage:  node src/scripts/makeAdmin.js you@example.com
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const email = process.argv[2];

const run = async () => {
  if (!email) {
    console.error('Usage: node src/scripts/makeAdmin.js <email>');
    process.exit(1);
  }
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: 'admin' },
    { new: true }
  ).select('name email role');

  if (!user) console.error(`✗ No user found with email: ${email}`);
  else console.log(`✓ ${user.email} is now an ${user.role}`);

  await mongoose.disconnect();
  process.exit(user ? 0 : 1);
};

run().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
