import cloudinary from '../config/cloudinary.js';

export function uploadBufferToCloudinary(buffer, options = {}) {
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
    stream.end(buffer);
  });
}
