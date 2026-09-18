import { useState } from 'react';
import { cn } from '@/lib/utils';
import { cldTransform } from '@/lib/cloudinary';

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
  ...props
}) {
  const [failed, setFailed] = useState(!src);
  // Request an image sized (and smart-cropped) for where it's actually displayed,
  // instead of shipping the full-resolution original down to a small card/thumbnail.
  const optimizedSrc = width || height ? cldTransform(src, { width, height, crop, gravity }) : src;

  if (!src || failed) {
    return (
      <div
        className={cn(
          'grid h-full w-full place-items-center bg-gradient-to-br from-bone-muted via-bone to-bone-soft text-center',
          fallbackClassName
        )}
        aria-label={alt || label}
      >
        <div className="px-4">
          <div className="text-lg font-semibold uppercase tracking-[0.28em] text-ink/55">
            {fallbackInitials(label || alt || 'DreamzDecors')}
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-ink-soft">
            Curated piece
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className, imgClassName)}
      {...props}
    />
  );
}