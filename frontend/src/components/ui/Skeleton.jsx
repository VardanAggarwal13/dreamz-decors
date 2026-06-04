import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return <div className={cn('animate-pulse rounded-md bg-ink/5', className)} {...props} />;
}
