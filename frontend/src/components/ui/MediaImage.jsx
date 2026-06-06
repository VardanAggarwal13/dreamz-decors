import { useState } from 'react';
import { cn } from '@/lib/utils';

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
  ...props
}) {
  const [failed, setFailed] = useState(!src);

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
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className, imgClassName)}
      {...props}
    />
  );
}