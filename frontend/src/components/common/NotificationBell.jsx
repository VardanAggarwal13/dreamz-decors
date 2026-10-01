import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDateTime } from '@/lib/utils';
import {
  isPushSupported,
  isSubscribed,
  enablePush,
  disablePush,
} from '@/lib/push';

const PAGE_SIZE = 5;

export default function NotificationBell({
  buttonClassName,
  badgeClassName,
  iconSize = 18,
  scope,
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' | 'unread'
  const [page, setPage] = useState(1);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, right: 16 });
  const navigate = useNavigate();

  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);

  const pushSupported = isPushSupported();

  // Reset page when tab or open state changes
  useEffect(() => {
    setPage(1);
  }, [tab, open]);

  // Reflect the current push subscription state when the panel opens.
  useEffect(() => {
    if (open && pushSupported) {
      isSubscribed().then(setPushOn).catch(() => setPushOn(false));
    }
  }, [open, pushSupported]);

  // Position the dropdown in viewport coords
  useEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.min(360, window.innerWidth - 24);
      let right = window.innerWidth - r.right;
      if (window.innerWidth - right - width < 16) right = window.innerWidth - width - 16;
      if (right < 16) right = 16;
      setCoords({ top: r.bottom + 12, right });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Filter items by scope (admin vs customer) and active tab
  const scopedItems = items.filter((n) => {
    if (scope === 'admin') return n.type?.startsWith('admin_');
    if (scope === 'customer') return !n.type?.startsWith('admin_');
    return true;
  });

  const filteredItems = scopedItems.filter((n) => {
    if (tab === 'unread') return !n.read;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const unreadScopedCount = scopedItems.filter((n) => !n.read).length;

  const handleItemClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    setOpen(false);
    if (notif.link) {
      let target = notif.link;
      if (typeof target === 'string' && target.startsWith('http')) {
        try {
          const u = new URL(target);
          target = u.pathname + u.search + u.hash;
        } catch {}
      }
      navigate(target);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await remove(id);
    toast.success('Notification removed');
  };

  const togglePush = async () => {
    setPushBusy(true);
    setPushError('');
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
      } else {
        await enablePush();
        setPushOn(true);
      }
    } catch (err) {
      setPushError(err.message || 'Could not update push notifications.');
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName || 'relative hover:text-accent'}
      >
        <FiBell size={iconSize} />
        {unreadScopedCount > 0 && (
          <span
            className={
              badgeClassName ||
              'absolute -right-2 -top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-bone'
            }
          >
            {unreadScopedCount > 9 ? '9+' : unreadScopedCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            style={{ top: coords.top, right: coords.right }}
            className="fixed z-[60] w-[350px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-hairline/80 bg-bone-soft shadow-2xl backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline/60 px-4 py-3 bg-bone/70">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                {unreadScopedCount > 0 && (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold-deep">
                    {unreadScopedCount} new
                  </span>
                )}
              </div>

              {unreadScopedCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold-deep transition hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-hairline/60 bg-bone-muted/40 px-3 py-1.5">
              <button
                type="button"
                onClick={() => setTab('all')}
                className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                  tab === 'all'
                    ? 'bg-bone text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                All ({scopedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('unread')}
                className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                  tab === 'unread'
                    ? 'bg-bone text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Unread ({unreadScopedCount})
              </button>
            </div>

            {/* Notification List (Paginated) */}
            <div className="max-h-[340px] overflow-y-auto">
              {pagedItems.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <FiBell size={22} className="mx-auto text-ink-muted/50" />
                  <p className="mt-2.5 text-xs text-ink-soft">
                    {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-hairline/50">
                  {pagedItems.map((n) => (
                    <li key={n._id} className="group relative">
                      <div
                        onClick={() => handleItemClick(n)}
                        className={`flex w-full cursor-pointer items-start gap-3 px-3.5 py-3 transition hover:bg-bone-muted/60 ${
                          n.read ? 'bg-transparent' : 'bg-gold/[0.06]'
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            n.read
                              ? 'bg-transparent'
                              : n.type?.startsWith('admin_')
                              ? 'bg-gold-deep'
                              : 'bg-gold'
                          }`}
                        />
                        <div className="min-w-0 flex-1 pr-6">
                          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                            <span className="truncate text-xs font-semibold text-ink">
                              {n.title}
                            </span>
                            <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-muted">
                              {formatDateTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-soft">
                            {n.message}
                          </p>
                        </div>
                      </div>

                      {/* Delete / Remove button */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, n._id)}
                        aria-label="Remove notification"
                        title="Remove notification"
                        className="absolute right-2 top-2.5 flex h-6 w-6 items-center justify-center rounded-md text-ink-muted/60 opacity-80 transition hover:bg-black/5 hover:text-sale hover:opacity-100 group-hover:opacity-100"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-hairline/60 bg-bone/60 px-3.5 py-2 text-xs">
                <span className="text-[11px] text-ink-muted">
                  Page <strong className="text-ink">{currentPage}</strong> of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-hairline bg-bone text-ink transition hover:bg-bone-muted disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Previous page"
                  >
                    <FiChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-hairline bg-bone text-ink transition hover:bg-bone-muted disabled:opacity-40 disabled:pointer-events-none"
                    aria-label="Next page"
                  >
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Push toggle footer */}
            {pushSupported && (
              <div className="border-t border-hairline/60 px-4 py-2.5 bg-bone/40">
                <button
                  type="button"
                  onClick={togglePush}
                  disabled={pushBusy}
                  className="flex w-full items-center justify-between gap-3 text-left disabled:opacity-60"
                >
                  <span className="text-[11px] text-ink-soft">
                    {pushOn ? 'Browser push active' : 'Enable browser push'}
                  </span>
                  <span
                    className={`flex h-4 w-8 shrink-0 items-center rounded-full px-0.5 transition ${
                      pushOn ? 'justify-end bg-gold' : 'justify-start bg-hairline'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full bg-bone shadow-sm">
                      {pushOn && <FiCheck size={10} className="m-0.5 text-gold-deep" />}
                    </span>
                  </span>
                </button>
                {pushError && <p className="mt-1 text-[10px] text-sale">{pushError}</p>}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
