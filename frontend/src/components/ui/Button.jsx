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
        primary: 'bg-accent text-bone shadow-glow hover:bg-accent-deep',
        outline: 'border border-hairline bg-transparent text-ink hover:border-accent hover:bg-bone-muted/70',
        ghost: 'bg-transparent text-ink hover:bg-ink/5',
        link: 'bg-transparent text-ink underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-xs uppercase tracking-[0.18em]',
        md: 'h-11 px-6 text-sm uppercase tracking-[0.18em]',
        lg: 'h-14 px-8 text-sm uppercase tracking-[0.22em]',
        icon: 'h-10 w-10',
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