import { FiX } from 'react-icons/fi';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

/**
 * Shared admin modal: fixed dim overlay (never scrolls), centered panel with a
 * fixed header + optional fixed footer and an internally-scrolling body. Locks
 * page scroll while open so nothing behind it can move.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  fullScreen = false,
  bodyClassName,
}) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        fullScreen ? 'p-2 sm:p-4 lg:left-64' : 'p-4 sm:p-6'
      }`}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-hairline/60 bg-bone-soft ${
          fullScreen ? 'h-full max-w-none' : `max-h-[calc(100dvh-2rem)] ${maxWidth}`
        }`}
      >
        {/* Header (stays fixed) */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-hairline/60 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg text-ink line-clamp-2 sm:text-xl">{title}</h2>
            {subtitle && <div className="mt-1.5">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-ink-muted transition hover:text-ink" aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        {/* Body — internally scrolls by default; override via bodyClassName */}
        <div className={bodyClassName ?? 'flex-1 overflow-y-auto px-5 py-5 sm:px-6'}>{children}</div>

        {/* Footer (stays fixed) */}
        {footer && <div className="shrink-0 border-t border-hairline/60 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

/** Small labelled fact tile used inside view modals. */
export function ViewStat({ label, value }) {
  return (
    <div className="rounded-xl border border-hairline/60 bg-bone px-3 py-2.5">
      <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">{label}</span>
      <span className="mt-1 block truncate text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
