import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-md border border-ink/15 bg-bone-soft px-4 py-2 text-sm text-ink placeholder:text-ink/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
