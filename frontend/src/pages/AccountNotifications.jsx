import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiBellOff, FiCheck, FiMail } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import api from '@/lib/api';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDateTime } from '@/lib/utils';
import { isPushSupported, isSubscribed, enablePush, disablePush, pushPermission } from '@/lib/push';

export default function AccountNotifications() {
  const navigate = useNavigate();
  const supported = isPushSupported();
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const denied = supported && pushPermission() === 'denied';

  // Email newsletter (this account's address)
  const [newsletterOn, setNewsletterOn] = useState(false);
  const [nlEmail, setNlEmail] = useState('');
  const [nlBusy, setNlBusy] = useState(false);
  const [nlLoaded, setNlLoaded] = useState(false);

  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

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
    if (n.link) navigate(n.link);
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Recent activity</h2>
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

        {items.length === 0 ? (
          <div className="py-10 text-center">
            <FiBell size={22} className="mx-auto text-ink-muted/50" />
            <p className="mt-3 text-sm text-ink-soft">You’re all caught up.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-hairline/50">
            {items.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-bone-muted/60 ${
                    n.read ? '' : 'bg-gold/[0.05]'
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-gold'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                      <span className="truncate text-sm font-medium text-ink">{n.title}</span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-muted">{formatDateTime(n.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-ink-soft">{n.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
