// Builds a right-sized delivery URL and responsive srcset for Cloudinary assets.
// Ensures next-gen WebP / auto-format delivery with smart compression and responsive breakpoints.

export function cldTransform(
  url,
  {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    quality = 'auto',
    format = 'auto',
    dpr = 'auto',
  } = {}
) {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary transformations
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

  return normalizedUrl;
}

/**
 * Builds a responsive srcset string with optimal breakpoints.
 * Allows modern mobile and desktop browsers to download the exact right-sized WebP image from Cloudinary.
 */
export function cldSrcSet(url, { widths = [360, 540, 720, 960, 1200], aspectRatio, ...opts } = {}) {
  if (!url || typeof url !== 'string') return undefined;
  if (!url.includes('/upload/')) return undefined;

  return widths
    .map((w) => {
      const h = aspectRatio ? Math.round(w / aspectRatio) : opts.height ? Math.round((w / (opts.width || w)) * opts.height) : undefined;
      const transformedUrl = cldTransform(url, { ...opts, width: w, height: h });
      return `${transformedUrl} ${w}w`;
    })
    .join(', ');
}
