import { useEffect, useState } from 'react';
import { FiX, FiBell } from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { isPushSupported, isSubscribed, enablePush, pushPermission } from '@/lib/push';

// Per-user dismissal flag (localStorage) — the opt-in prompt is shown to a
// logged-in user ONCE, the first time. After that we never nag again; they can
// turn browser push on anytime from the account notifications page. A subscribed
// user is never prompted (the subscription check gates that). Per-user key so a
// different account on the same browser is still asked once.
const seenKey = (userId) => `dd:push-prompt-seen:${userId}`;

export default function PushOptInModal() {
  const userId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) {
      setOpen(false);
      return undefined;
    }
    // Gate: push supported and not blocked at the browser level.
    if (!isPushSupported() || pushPermission() === 'denied') return undefined;
    // Already shown to this user before? Never prompt again.
    try {
      if (localStorage.getItem(seenKey(userId))) return undefined;
    } catch {
      return undefined;
    }

    // Only prompt if this browser isn't already subscribed, after a short beat
    // so the modal appears right at the start without slamming first paint.
    let cancelled = false;
    let timer;
    isSubscribed().then((subscribed) => {
      if (cancelled || subscribed) return;
      timer = setTimeout(() => !cancelled && setOpen(true), 1200);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [userId]);

  const markSeen = () => {
    try {
      if (userId) localStorage.setItem(seenKey(userId), '1');
    } catch {
      /* storage unavailable — fine, we just may ask again */
    }
  };

  const dismiss = () => {
    markSeen();
    setOpen(false);
  };

  const handleEnable = async () => {
    setBusy(true);
    try {
      await enablePush();
      markSeen();
      setOpen(false);
      toast.success('Browser notifications enabled');
    } catch (err) {
      // If the user blocks at the browser prompt, don't nag again either.
      markSeen();
      setOpen(false);
      toast.error(err.message || 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && dismiss();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-sm rounded-2xl border border-hairline/60 bg-bone-soft p-7 text-center shadow-card">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 text-ink-muted transition hover:text-ink"
        >
          <FiX size={18} />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
          <FiBell className="text-gold-deep" size={20} />
        </div>
        <h2 className="mt-4 font-display text-2xl text-ink">Stay in the loop</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          Turn on browser notifications to get order updates, shipping alerts and exclusive offers — even when this tab is closed.
        </p>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="block w-full rounded-lg bg-gold-deep py-3 text-sm font-semibold uppercase tracking-[0.16em] text-bone transition hover:bg-gold disabled:opacity-60"
          >
            {busy ? 'Enabling…' : 'Enable notifications'}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="block w-full rounded-lg border border-hairline bg-white py-3 text-sm font-medium text-ink-soft transition hover:border-gold/60 hover:text-ink"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
