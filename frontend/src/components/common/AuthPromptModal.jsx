import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiX, FiHeart } from 'react-icons/fi';
import { useAuthPrompt } from '@/store/authPromptStore';

export default function AuthPromptModal() {
  const { open, message, hide } = useAuthPrompt();
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && hide();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hide]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={hide} />
      <div className="relative w-full max-w-sm rounded-2xl border border-hairline/60 bg-bone-soft p-7 text-center shadow-card">
        <button
          onClick={hide}
          aria-label="Close"
          className="absolute right-4 top-4 text-ink-muted transition hover:text-ink"
        >
          <FiX size={18} />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
          <FiHeart className="text-gold-deep" size={20} />
        </div>
        <h2 className="mt-4 font-display text-2xl text-ink">Sign in to continue</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{message}</p>

        <div className="mt-6 space-y-2.5">
          <Link
            to="/login"
            state={{ from: location }}
            onClick={hide}
            className="block w-full rounded-lg bg-gold-deep py-3 text-sm font-semibold uppercase tracking-[0.16em] text-bone transition hover:bg-gold"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            onClick={hide}
            className="block w-full rounded-lg border border-hairline bg-white py-3 text-sm font-medium text-ink transition hover:border-gold/60"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
