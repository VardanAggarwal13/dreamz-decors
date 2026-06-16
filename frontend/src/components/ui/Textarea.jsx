import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full resize-y rounded-md border border-ink/15 bg-bone-soft px-4 py-2.5 text-sm leading-6 text-ink placeholder:text-ink/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
