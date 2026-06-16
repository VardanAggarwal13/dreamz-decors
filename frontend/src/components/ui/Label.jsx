import * as React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      className={cn('text-xs font-medium leading-none text-ink-soft', className)}
      {...props}
    />
  );
});
