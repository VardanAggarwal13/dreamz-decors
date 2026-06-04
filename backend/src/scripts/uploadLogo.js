// One-off: uploads the brand logo to Cloudinary at a stable public_id
// so the frontend can reference it via a fixed URL with `e_trim`
// applied to strip the dark padding.
import 'dotenv/config';
import cloudinary from '../config/cloudinary.js';

const SOURCE =
  'C:/Users/Vardan Aggarwal/OneDrive/Desktop/e-commerce-site/Gemini_Generated_Image_5ru2t65ru2t65ru2.png';

const PUBLIC_ID = 'dreamzdecors/brand/logo';

const run = async () => {
  console.log(`Uploading ${SOURCE} → ${PUBLIC_ID}`);
  const upload = await cloudinary.uploader.upload(SOURCE, {
    public_id: PUBLIC_ID,
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
  });
  console.log('\n✓ Uploaded');
  console.log('  url      :', upload.secure_url);
  console.log('  bytes    :', upload.bytes);
  console.log('  size     :', `${upload.width}x${upload.height}`);

  // Trimmed wide logo for the navbar / footer (height 120, auto WebP).
  const navbarUrl = cloudinary.url(PUBLIC_ID, {
    secure: true,
    transformation: [
      { effect: 'trim:25' },
      { height: 120, crop: 'scale' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  // Bigger trimmed version for hero / OG / large surfaces.
  const largeUrl = cloudinary.url(PUBLIC_ID, {
    secure: true,
    transformation: [
      { effect: 'trim:25' },
      { height: 320, crop: 'scale' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  // Favicon: trim, then take the top half (the hex emblem only, no wordmark),
  // then square-fit to 96x96 for crisp tab icons.
  const faviconUrl = cloudinary.url(PUBLIC_ID, {
    secure: true,
    transformation: [
      { effect: 'trim:25' },
      { height: 0.55, crop: 'crop', gravity: 'north' }, // 55% from top
      { width: 96, height: 96, crop: 'pad', background: 'rgb:0a0a0a' },
      { quality: 'auto', fetch_format: 'png' },
    ],
  });

  console.log('\nUrls to use in the frontend:');
  console.log('  navbar   :', navbarUrl);
  console.log('  large    :', largeUrl);
  console.log('  favicon  :', faviconUrl);
};

run().catch((e) => {
  console.error('✗ Upload failed:', e?.error || e);
  process.exit(1);
});
