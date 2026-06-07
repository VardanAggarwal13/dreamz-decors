import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiShoppingBag,
  FiMapPin,
  FiBell,
  FiGrid,
  FiLogOut,
} from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';

const LINKS = [
  { to: '/account', label: 'My Account', Icon: FiUser, end: true },
  { to: '/account/orders', label: 'My Orders', Icon: FiShoppingBag },
  { to: '/account/addresses', label: 'Addresses', Icon: FiMapPin },
  { to: '/account/notifications', label: 'Notifications', Icon: FiBell },
];

// Account control shown when signed in: an avatar button that opens a
// dropdown with the user's account links and a logout action.
export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className={`grid h-9 w-9 place-items-center rounded-full border text-xs font-semibold uppercase transition ${
          open
            ? 'border-gold/50 bg-gold/15 text-gold-deep'
            : 'border-hairline bg-bone-soft text-ink-soft hover:border-gold/40 hover:text-gold-deep'
        }`}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-60 overflow-hidden rounded-2xl border border-hairline/70 bg-bone-soft shadow-card">
          {/* Identity */}
          <div className="border-b border-hairline/60 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{user?.name || 'My account'}</p>
            {user?.email && <p className="mt-0.5 truncate text-xs text-ink-muted">{user.email}</p>}
          </div>

          {/* Links */}
          <nav className="py-1.5">
            {LINKS.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-soft transition hover:bg-bone-muted/70 hover:text-ink"
              >
                <Icon size={16} className="text-ink-muted" />
                {label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold-deep transition hover:bg-gold/10"
              >
                <FiGrid size={16} />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Logout */}
          <div className="border-t border-hairline/60 py-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink-soft transition hover:bg-bone-muted/70 hover:text-accent"
            >
              <FiLogOut size={16} className="text-ink-muted" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
