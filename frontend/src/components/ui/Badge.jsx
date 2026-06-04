import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
  {
    variants: {
      variant: {
        default: 'bg-ink text-bone',
        accent: 'bg-accent text-bone',
        neon: 'bg-accent-neon text-ink',
        outline: 'border border-ink/25 text-ink',
        muted: 'bg-ink/5 text-ink/70',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
