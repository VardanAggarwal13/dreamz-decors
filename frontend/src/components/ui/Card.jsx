import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef(function Card({ className, ...props }, ref) {
  return <div ref={ref} className={cn('rounded-2xl border border-hairline/60 bg-bone shadow-card', className)} {...props} />;
});

export const CardHeader = React.forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex items-center gap-3 px-5 py-4', className)} {...props} />;
});

export const CardTitle = React.forwardRef(function CardTitle({ className, ...props }, ref) {
  return <h3 ref={ref} className={cn('font-display text-lg leading-tight text-ink', className)} {...props} />;
});

export const CardContent = React.forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('px-5 pb-5', className)} {...props} />;
});
