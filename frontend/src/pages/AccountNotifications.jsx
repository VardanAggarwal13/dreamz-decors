import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiBellOff,
  FiCheck,
  FiMail,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDateTime } from '@/lib/utils';
import { isPushSupported, isSubscribed, enablePush, disablePush, pushPermission } from '@/lib/push';

const PAGE_SIZE = 8;

export default function AccountNotifications() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const supported = isPushSupported();
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('customer');
  const [page, setPage] = useState(1);
  const denied = supported && pushPermission() === 'denied';

  // Email newsletter (this account's address)
  const [newsletterOn, setNewsletterOn] = useState(false);
  const [nlEmail, setNlEmail] = useState('');
  const [nlBusy, setNlBusy] = useState(false);
  const [nlLoaded, setNlLoaded] = useState(false);

  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread);
  const loaded = useNotificationStore((s) => s.loaded);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (supported) isSubscribed().then(setPushOn).catch(() => setPushOn(false));
  }, [supported]);

  useEffect(() => {
    api
      .get('/account/newsletter')
      .then((res) => {
        setNewsletterOn(Boolean(res.data?.subscribed));
        setNlEmail(res.data?.email || '');
      })
      .catch(() => {})
      .finally(() => setNlLoaded(true));
  }, []);

  const toggleNewsletter = async () => {
    const next = !newsletterOn;
    setNlBusy(true);
    try {
      const res = await api.put('/account/newsletter', { subscribe: next });
      setNewsletterOn(Boolean(res.data?.subscribed));
      toast.success(next ? 'Subscribed to the newsletter' : 'Unsubscribed from the newsletter');
    } catch (err) {
      toast.error(err.message || 'Could not update your newsletter preference.');
    } finally {
      setNlBusy(false);
    }
  };

  const togglePush = async () => {
    setBusy(true);
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
        toast.success('Browser notifications turned off');
      } else {
        await enablePush();
        setPushOn(true);
        toast.success('Browser notifications enabled');
      }
    } catch (err) {
      toast.error(err.message || 'Could not update push notifications.');
    } finally {
      setBusy(false);
    }
  };

  const openItem = (n) => {
    if (!n.read) markRead(n._id);
    if (n.link) {
      let target = n.link;
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

  return (
    <div>
      <Seo title="Notifications — DreamzDecor" canonical="/account/notifications" noIndex />
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Notifications</h1>

      {/* Browser push settings */}
      <section className="mt-6 rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold-deep">
              {pushOn ? <FiBell size={18} /> : <FiBellOff size={18} />}
            </span>
            <div>
              <h2 className="font-display text-lg text-ink">Browser push notifications</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-ink-soft">
                Get notified about order updates, shipping and offers — even when this tab is closed.
              </p>
            </div>
          </div>

          {supported && !denied && (
            <button
              type="button"
              onClick={togglePush}
              disabled={busy}
              aria-pressed={pushOn}
              className={`flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition disabled:opacity-60 ${
                pushOn ? 'justify-end bg-gold' : 'justify-start bg-hairline'
              }`}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-bone shadow-sm">
                {pushOn && <FiCheck size={13} className="text-gold-deep" />}
              </span>
            </button>
          )}
        </div>

        {!supported && (
          <p className="mt-4 rounded-xl border border-hairline/60 bg-bone-soft px-4 py-3 text-sm text-ink-soft">
            This browser doesn’t support push notifications.
          </p>
        )}
        {denied && (
          <p className="mt-4 rounded-xl border border-sale/25 bg-sale/8 px-4 py-3 text-sm text-sale">
            Notifications are blocked. Enable them for this site in your browser settings, then reload.
          </p>
        )}
      </section>

      {/* Email newsletter */}
      <section className="mt-6 rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold-deep">
              <FiMail size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg text-ink">Email newsletter</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-ink-soft">
                New drops, studio stories and members-only offers{nlEmail ? ', sent to ' : ''}
                {nlEmail && <span className="break-words font-medium text-ink">{nlEmail}</span>}. No spam — unsubscribe anytime.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleNewsletter}
            disabled={nlBusy || !nlLoaded}
            aria-pressed={newsletterOn}
            className={`flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition disabled:opacity-60 ${
              newsletterOn ? 'justify-end bg-gold' : 'justify-start bg-hairline'
            }`}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-bone shadow-sm">
              {newsletterOn && <FiCheck size={13} className="text-gold-deep" />}
            </span>
          </button>
        </div>
      </section>

      {/* In-app notifications */}
      <section className="mt-6 rounded-2xl border border-hairline/60 bg-bone p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg text-ink">Recent activity</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {user?.role === 'admin' && activeTab === 'admin'
                ? 'Store operational alerts and customer orders'
                : 'Updates regarding your personal orders and account'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium uppercase tracking-[0.16em] text-gold-deep hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Tab switch for Admin users to clearly separate personal shopping from store alerts */}
        {user?.role === 'admin' && (
          <div className="mt-4 flex gap-2 border-b border-hairline/60 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'customer'
                  ? 'bg-ink text-bone shadow-sm'
                  : 'bg-bone-soft text-ink-soft hover:bg-bone-muted hover:text-ink'
              }`}
            >
              🛍️ My Personal Orders ({items.filter((n) => !n.type?.startsWith('admin_')).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-gold-deep text-bone shadow-sm'
                  : 'bg-bone-soft text-ink-soft hover:bg-bone-muted hover:text-ink'
              }`}
            >
              ⚡ Store Admin Alerts ({items.filter((n) => n.type?.startsWith('admin_')).length})
            </button>
          </div>
        )}

        {(() => {
          const displayItems =
            user?.role === 'admin'
              ? items.filter((n) =>
                  activeTab === 'admin' ? n.type?.startsWith('admin_') : !n.type?.startsWith('admin_')
                )
              : items.filter((n) => !n.type?.startsWith('admin_'));

          const totalPages = Math.max(1, Math.ceil(displayItems.length / PAGE_SIZE));
          const currentPage = Math.min(page, totalPages);
          const pagedItems = displayItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

          if (!loaded && items.length === 0) {
            return (
              <ul className="mt-4 divide-y divide-hairline/50">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex gap-3 px-2 py-3">
                    <Skeleton className="mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="mt-1.5 h-3 w-3/4" />
                    </span>
                  </li>
                ))}
              </ul>
            );
          }

          if (displayItems.length === 0) {
            return (
              <div className="py-10 text-center">
                <FiBell size={22} className="mx-auto text-ink-muted/50" />
                <p className="mt-3 text-sm text-ink-soft">
                  {user?.role === 'admin' && activeTab === 'admin'
                    ? 'No store alerts currently.'
                    : 'You’re all caught up with your personal orders.'}
                </p>
              </div>
            );
          }

          return (
            <div>
              <ul className="mt-4 divide-y divide-hairline/50">
                {pagedItems.map((n) => (
                  <li key={n._id} className="group relative">
                    <div
                      onClick={() => openItem(n)}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3.5 transition hover:bg-bone-muted/60 ${
                        n.read ? '' : 'bg-gold/[0.05]'
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
                      <div className="min-w-0 flex-1 pr-8">
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                          <span className="truncate text-sm font-medium text-ink">{n.title}</span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-muted">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ink-soft">
                          {n.message}
                        </span>
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, n._id)}
                      aria-label="Delete notification"
                      title="Delete notification"
                      className="absolute right-3 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted/60 opacity-80 transition hover:bg-black/5 hover:text-sale hover:opacity-100 group-hover:opacity-100"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-hairline/60 pt-4 text-xs">
                  <span className="text-ink-muted">
                    Showing <strong className="text-ink">{(currentPage - 1) * PAGE_SIZE + 1}</strong> –{' '}
                    <strong className="text-ink">
                      {Math.min(currentPage * PAGE_SIZE, displayItems.length)}
                    </strong>{' '}
                    of <strong className="text-ink">{displayItems.length}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-bone-soft px-3 font-medium text-ink transition hover:bg-bone-muted disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <FiChevronLeft size={14} /> Prev
                    </button>
                    <span className="px-2 font-medium text-ink-muted">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-8 items-center gap-1 rounded-lg border border-hairline bg-bone-soft px-3 font-medium text-ink transition hover:bg-bone-muted disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Next <FiChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
