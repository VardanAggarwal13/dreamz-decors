import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck } from 'react-icons/fi';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDateTime } from '@/lib/utils';
import {
  isPushSupported,
  isSubscribed,
  enablePush,
  disablePush,
} from '@/lib/push';

export default function NotificationBell({ buttonClassName, badgeClassName }) {
  const [open, setOpen] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const pushSupported = isPushSupported();

  // Reflect the current push subscription state when the panel opens.
  useEffect(() => {
    if (open && pushSupported) {
      isSubscribed().then(setPushOn).catch(() => setPushOn(false));
    }
  }, [open, pushSupported]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleItemClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
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
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName || 'relative hover:text-accent'}
      >
        <FiBell size={18} />
        {unread > 0 && (
          <span
            className={
              badgeClassName ||
              'absolute -right-2 -top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-bone'
            }
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[330px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-hairline/70 bg-bone-soft shadow-card">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-hairline/60 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted transition hover:text-accent"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <FiBell size={22} className="mx-auto text-ink-muted/50" />
                <p className="mt-3 text-sm text-ink-soft">You're all caught up</p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline/50">
                {items.map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-bone-muted/60 ${
                        n.read ? '' : 'bg-gold/[0.05]'
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          n.read ? 'bg-transparent' : 'bg-gold'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-medium text-ink">{n.title}</span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-muted">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ink-soft">
                          {n.message}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Push toggle footer */}
          {pushSupported && (
            <div className="border-t border-hairline/60 px-4 py-3">
              <button
                type="button"
                onClick={togglePush}
                disabled={pushBusy}
                className="flex w-full items-center justify-between gap-3 text-left disabled:opacity-60"
              >
                <span className="text-xs leading-5 text-ink-soft">
                  {pushOn ? 'Browser push notifications on' : 'Enable browser notifications'}
                </span>
                <span
                  className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition ${
                    pushOn ? 'justify-end bg-gold' : 'justify-start bg-hairline'
                  }`}
                >
                  <span className="h-4 w-4 rounded-full bg-bone shadow-sm">
                    {pushOn && <FiCheck size={12} className="m-0.5 text-gold-deep" />}
                  </span>
                </span>
              </button>
              {pushError && <p className="mt-2 text-[11px] text-sale">{pushError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
