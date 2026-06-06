import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductGridSkeleton({ columns = 4, count = 8, layout = 'default' }) {
  const cols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid gap-x-4 gap-y-6 sm:gap-y-10 ${cols}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <Skeleton className={layout === 'editorial' ? 'h-4 w-4/5' : 'h-4 w-3/4'} />
          {layout !== 'editorial' && <Skeleton className="h-3 w-1/3" />}
          <Skeleton className={layout === 'editorial' ? 'h-4 w-1/3' : 'h-4 w-1/2'} />
        </div>
      ))}
    </div>
  );
}
