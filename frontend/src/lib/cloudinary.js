// Builds a right-sized delivery URL for Cloudinary- or Unsplash-hosted images (the two
// sources used across the site — product photos on Cloudinary, fallback marketing imagery
// from Unsplash in siteContent.js). Product photos are uploaded at full camera resolution
// (see backend cloudinaryUpload.js), so without this every card/thumbnail was downloading
// the original multi-MB file and letting the browser scale + crop it in CSS — slow to load.
//
// Gravity defaults to "center" (same crop position the browser's object-cover was already
// using) rather than Cloudinary's "auto" saliency detection — auto guesses a focal point per
// image and can shift the crop off-center in ways that don't match the original composition.
export function cldTransform(url, { width, height, crop = 'fill', gravity = 'center', quality = 'auto', format = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary: insert a transformation segment right after "/upload/" — no re-upload needed.
  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const parts = [`q_${quality}`, `f_${format}`];
    if (width) parts.push(`w_${Math.round(width)}`);
    if (height) parts.push(`h_${Math.round(height)}`);
    if (width || height) parts.push(`c_${crop}`, `g_${gravity}`);
    return `${url.slice(0, idx + marker.length)}${parts.join(',')}/${url.slice(idx + marker.length)}`;
  }

  // Unsplash: same idea via its own query-param imaging API.
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      if (width) u.searchParams.set('w', Math.round(width));
      if (height) u.searchParams.set('h', Math.round(height));
      if (width || height) {
        u.searchParams.set('fit', 'crop');
        u.searchParams.set('crop', gravity === 'center' ? 'center' : 'entropy');
      }
      u.searchParams.set('auto', 'format');
      u.searchParams.set('q', '80');
      return u.toString();
    } catch {
      return url; // malformed URL — leave untouched rather than throw
    }
  }

  return url; // not a source we know how to resize (e.g. local placeholder) — leave untouched
}
