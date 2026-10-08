import cloudinary from '../config/cloudinary.js';
import sharp from 'sharp';

export async function uploadBufferToCloudinary(buffer, options = {}) {
  let uploadBuffer = buffer;
  try {
    uploadBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
  } catch {
    uploadBuffer = buffer;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'dreamzdecors',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(uploadBuffer);
  });
}

