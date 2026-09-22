import { useState } from 'react';
import { cn } from '@/lib/utils';
import { cldTransform } from '@/lib/cloudinary';
import { FiImage } from 'react-icons/fi';

function fallbackInitials(label = '') {
  return String(label)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function MediaImage({
  src,
  alt,
  label,
  className,
  imgClassName,
  fallbackClassName,
  width,
  height,
  crop,
  gravity,
  priority = false,
  fit = 'cover',
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);

  // When fit is 'contain', use 'limit' crop in Cloudinary so images are scaled without clipping edges
  const effectiveCrop = crop || (fit === 'contain' ? 'limit' : 'fill');
  const optimizedSrc = width || height ? cldTransform(src, { width, height, crop: effectiveCrop, gravity }) : src;

  if (!src || failed) {
    return (
      <div
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center overflow-hidden border border-hairline/40 bg-gradient-to-br from-bone-muted via-bone to-bone-soft p-4 text-center select-none',
          fallbackClassName
        )}
        aria-label={alt || label}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-sm">
          <FiImage size={22} />
        </div>
        <div className="mt-2.5 max-w-[85%] text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">
          {fallbackInitials(label || alt || 'DreamzDecors')}
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-ink-muted">
          Curated Art
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      {/* Shimmer loading skeleton underneath until image is fully decoded */}
      {!loaded && (
        <div className="img-skeleton absolute inset-0 z-0 h-full w-full rounded-lg" />
      )}
      <img
        src={optimizedSrc}
        alt={alt || label || 'DreamzDecors Art'}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'h-full w-full transition-all duration-500',
          fit === 'contain' ? 'object-contain' : 'object-cover',
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]',
          imgClassName
        )}
        {...props}
      />
    </div>
  );
}