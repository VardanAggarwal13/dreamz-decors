import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductGridSkeleton({ columns = 4, count = 8, layout = 'default' }) {
  const cols = {
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns] || 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid gap-3 sm:gap-5 lg:gap-6 ${cols}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-hairline/60 bg-bone-soft p-3.5 sm:p-4"
        >
          <Skeleton className="aspect-[4/5] w-full rounded-xl" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="mt-2 h-8 w-full rounded-xl sm:h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}

