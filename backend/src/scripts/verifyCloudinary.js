// Smoke test for Cloudinary credentials. Uploads a remote sample image
// directly via the SDK (no multer / no HTTP layer), so a green run here
// proves the .env values are valid.
import 'dotenv/config';
import cloudinary from '../config/cloudinary.js';

const SAMPLE_URL =
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=70';

const run = async () => {
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:   ', process.env.CLOUDINARY_API_KEY);
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '[set]' : '[missing]');

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('\nMissing one or more Cloudinary credentials in backend/.env');
    process.exit(1);
  }

  console.log('\nUploading sample image…');
  const result = await cloudinary.uploader.upload(SAMPLE_URL, {
    folder: 'dreamzdecors/_smoke',
    public_id: `smoke_${Date.now()}`,
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  console.log('\n✓ Upload successful');
  console.log('  publicId :', result.public_id);
  console.log('  url      :', result.secure_url);
  console.log('  bytes    :', result.bytes);
  console.log('  format   :', result.format);
  console.log('  width    :', result.width);
  console.log('  height   :', result.height);

  console.log('\nCleaning up smoke-test asset…');
  await cloudinary.uploader.destroy(result.public_id);
  console.log('✓ Removed.');
};

run().catch((e) => {
  console.error('\n✗ Cloudinary verification FAILED');
  console.error(e?.error || e);
  process.exit(1);
});
