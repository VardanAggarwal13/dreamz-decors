import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductGridSkeleton({ columns = 4, count = 8 }) {
  const cols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid gap-x-4 gap-y-10 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
