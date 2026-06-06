import { cn } from '@/lib/utils';

export default function BaseCard({
  as: Component = 'article',
  className,
  interactive = false,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'surface-card relative h-full overflow-hidden',
        interactive && 'transition-transform duration-300 hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
