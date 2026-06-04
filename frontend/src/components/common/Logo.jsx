import { brand } from '@/lib/brand';
import { cn } from '@/lib/utils';

const LOGO_SRC = '/IMG_3811-removebg-preview.png';

export default function Logo({ variant = 'horizontal', className = '' }) {
  if (variant === 'emblem') {
    return (
      <img
        src={LOGO_SRC}
        alt={brand.name}
        draggable="false"
        loading="eager"
        decoding="async"
        className={cn('h-12 w-auto select-none object-contain sm:h-14', className)}
      />
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        <img
          src={LOGO_SRC}
          alt={brand.name}
          draggable="false"
          loading="eager"
          decoding="async"
          className="h-28 w-auto select-none object-contain sm:h-36"
        />
        <span className="mt-2 text-[10px] uppercase tracking-[0.4em] text-ink/50 sm:text-[11px]">
          Creative - Decors - Innovative - Design
        </span>
      </div>
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt={brand.name}
      draggable="false"
      loading="eager"
      decoding="async"
      className={cn('h-14 w-auto max-w-[220px] select-none object-contain sm:h-16 sm:max-w-[280px]', className)}
    />
  );
}