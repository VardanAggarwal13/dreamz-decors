import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'btn-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bone',
  {
    variants: {
      variant: {
        default: 'bg-ink text-bone hover:bg-ink/90',
        primary: 'bg-gold-deep text-bone shadow-glow-gold hover:bg-gold',
        outline: 'border border-hairline bg-transparent text-ink hover:border-gold hover:bg-bone-muted/70',
        ghost: 'bg-transparent text-ink hover:bg-ink/5',
        link: 'bg-transparent text-ink underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 whitespace-nowrap px-3 text-[11px] uppercase tracking-[0.14em] sm:h-9 sm:px-4 sm:text-xs sm:tracking-[0.18em]',
        md: 'h-10 whitespace-nowrap px-4 text-xs uppercase tracking-[0.12em] sm:h-11 sm:px-6 sm:text-sm sm:tracking-[0.18em]',
        lg: 'h-12 whitespace-nowrap px-4 text-xs uppercase tracking-[0.1em] sm:h-14 sm:px-8 sm:text-sm sm:tracking-[0.22em]',
        icon: 'h-9 w-9 sm:h-10 sm:w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});

export { buttonVariants };