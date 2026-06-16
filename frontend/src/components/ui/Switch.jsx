import * as React from 'react';
import { cn } from '@/lib/utils';

// Dependency-free switch styled to match the shadcn primitive.
export const Switch = React.forwardRef(function Switch(
  { className, checked, onCheckedChange, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={!!checked}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
        checked ? 'bg-gold-deep' : 'bg-ink/15',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
        )}
      />
    </button>
  );
});
