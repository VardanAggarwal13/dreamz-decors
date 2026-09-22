// Builds a right-sized delivery URL for Cloudinary-hosted images.
// Product photos are uploaded at full camera resolution (see backend cloudinaryUpload.js),
// so without this every card/thumbnail was downloading the original multi-MB file.
//
// Gravity defaults to "auto" for smart framing when cropped.
export function cldTransform(url, { width, height, crop = 'fill', gravity = 'auto', quality = 'auto', format = 'auto', dpr = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary: strip any stale manual c_crop segment first so the full original artwork is used
  let normalizedUrl = url;
  if (normalizedUrl.includes('/c_crop')) {
    normalizedUrl = normalizedUrl.replace(/\/upload\/c_crop[^/]+\//, '/upload/');
  }

  const marker = '/upload/';
  const idx = normalizedUrl.indexOf(marker);
  if (idx !== -1) {
    const parts = [`q_${quality}`, `f_${format}`];
    if (dpr) parts.push(`dpr_${dpr}`);
    if (width) parts.push(`w_${Math.round(width)}`);
    if (height) parts.push(`h_${Math.round(height)}`);
    if (width || height) {
      parts.push(`c_${crop}`);
      const isCropMode = ['fill', 'crop', 'thumb', 'lfill'].includes(crop);
      if (isCropMode && gravity) {
        parts.push(`g_${gravity}`);
      }
    }
    return `${normalizedUrl.slice(0, idx + marker.length)}${parts.join(',')}/${normalizedUrl.slice(idx + marker.length)}`;
  }

  return url;
}
