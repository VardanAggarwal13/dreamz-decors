// One-off cleanup: removes any assets left over in the old `lumora/` folder
// from before the brand was renamed. Safe to delete this file after running once.
import 'dotenv/config';
import cloudinary from '../config/cloudinary.js';

const run = async () => {
  console.log('Listing assets under lumora/ ...');
  const list = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'lumora/',
    max_results: 500,
  });
  console.log(`Found ${list.resources.length} asset(s).`);
  if (list.resources.length === 0) {
    console.log('Nothing to clean up.');
    return;
  }
  const ids = list.resources.map((r) => r.public_id);
  console.log('Deleting assets:', ids);
  const result = await cloudinary.api.delete_resources(ids);
  console.log('Delete result:', result.deleted);

  console.log('Removing empty folders...');
  try {
    await cloudinary.api.delete_folder('lumora/_smoke');
  } catch {}
  try {
    await cloudinary.api.delete_folder('lumora');
  } catch {}
  console.log('✓ Cleanup complete.');
};

run().catch((e) => {
  console.error('✗ Cleanup failed:', e?.error || e);
  process.exit(1);
});
