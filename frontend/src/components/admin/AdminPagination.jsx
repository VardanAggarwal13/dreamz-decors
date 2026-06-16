import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Windowed list of page numbers: always show first/last + a window around the
// current page, with gaps (…) collapsed by the caller.
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, current - 1, current, current + 1, total - 1, total]);
  return [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

const navCls =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-hairline text-ink-soft transition hover:border-gold hover:text-gold-deep disabled:pointer-events-none disabled:opacity-30';
const numCls =
  'flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-hairline px-2 text-sm font-medium text-ink-soft transition hover:border-gold hover:text-gold-deep';
const activeCls =
  'flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-gold px-2 text-sm font-medium text-ink';

// Shared pagination bar for the admin lists. Shows a "Showing X–Y of Z" label
// plus prev/next + numbered controls (hidden when there's only one page).
export default function AdminPagination({ page, pages = 1, total = 0, limit = 10, onPage }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const nums = pageWindow(page, pages);

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-ink-muted">
        Showing <span className="font-medium text-ink-soft">{from}–{to}</span> of{' '}
        <span className="font-medium text-ink-soft">{total}</span>
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={navCls} aria-label="Previous page">
            <FiChevronLeft size={16} />
          </button>
          {nums.map((n, i) => (
            <span key={n} className="flex items-center gap-1.5">
              {i > 0 && n - nums[i - 1] > 1 && <span className="px-0.5 text-xs text-ink-muted">…</span>}
              <button type="button" onClick={() => onPage(n)} className={n === page ? activeCls : numCls} aria-current={n === page ? 'page' : undefined}>
                {n}
              </button>
            </span>
          ))}
          <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} className={navCls} aria-label="Next page">
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
