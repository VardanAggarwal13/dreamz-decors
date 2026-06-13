import { Skeleton } from '@/components/ui/Skeleton';

// Loading placeholders for the admin list pages. Mirrors the real dual layout
// (mobile cards `lg:hidden` + desktop table `hidden lg:block`) so the page
// doesn't jump when data arrives.
export function AdminListSkeleton({ rows = 6, cols = 5, withAvatar = true }) {
  return (
    <>
      {/* Mobile / tablet: cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-hairline/60 bg-bone p-4">
            <div className="flex items-center gap-3">
              {withAvatar && <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />}
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
            <Skeleton className="mt-4 h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-hidden rounded-2xl border border-hairline/60 bg-bone lg:block">
        <div className="border-b border-hairline/60 px-4 py-3">
          <Skeleton className="h-3.5 w-40" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-hairline/40 px-4 py-4 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 flex-1 ${c === cols - 1 ? 'max-w-[80px]' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
