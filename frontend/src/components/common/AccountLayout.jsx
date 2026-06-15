import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiMapPin, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

const TABS = [
  { to: '/account', label: 'Overview', Icon: FiUser, end: true },
  { to: '/account/orders', label: 'My Orders', Icon: FiShoppingBag },
  { to: '/account/addresses', label: 'Addresses', Icon: FiMapPin },
  { to: '/account/notifications', label: 'Notifications', Icon: FiBell },
  { to: '/account/profile', label: 'Profile & Security', Icon: FiSettings },
];

function TabLink({ to, label, Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
          isActive
            ? 'bg-gold/15 font-medium text-gold-deep'
            : 'text-ink-soft hover:bg-bone-muted/70 hover:text-ink'
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export default function AccountLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Google sign-in redirects back here with ?welcome=1 — show a one-time toast
  // (the page reload drops any toast queued before the OAuth redirect), then
  // strip the param so a refresh doesn't re-trigger it.
  useEffect(() => {
    if (searchParams.get('welcome') !== '1') return;
    toast.success('Signed in successfully!');
    searchParams.delete('welcome');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Custom scroll indicator for the mobile tab strip. Native scrollbars are
  // overlay/auto-hidden on phones (and in device emulation), so we render our
  // own always-visible track + thumb that reflects scroll position instead.
  const stripRef = useRef(null);
  const [bar, setBar] = useState({ overflow: false, width: 0, left: 0 });

  const updateBar = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflow = scrollWidth - clientWidth > 1;
    setBar({
      overflow,
      width: overflow ? (clientWidth / scrollWidth) * 100 : 0,
      left: overflow ? (scrollLeft / scrollWidth) * 100 : 0,
    });
  }, []);

  useEffect(() => {
    updateBar();
    const el = stripRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateBar, { passive: true });
    window.addEventListener('resize', updateBar);
    return () => {
      el.removeEventListener('scroll', updateBar);
      window.removeEventListener('resize', updateBar);
    };
  }, [updateBar]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="bg-bone-soft">
      <div className="container-page py-10 sm:py-12">
        <header className="border-b border-hairline/60 pb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">Account</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
            Hello, {user?.name?.split(' ')[0] || 'friend'}
          </h1>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[230px_1fr]">
          {/* Sidebar (desktop) / horizontal tabs (mobile) */}
          {/* lg:h-fit keeps the aside content-height so position:sticky has room
              to move (a stretched grid item can't stick). */}
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start lg:h-fit">
            <nav
              ref={stripRef}
              className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col lg:overflow-visible"
            >
              {TABS.map((tab) => (
                <TabLink key={tab.to} {...tab} />
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-soft transition hover:bg-bone-muted/70 hover:text-accent lg:mt-2 lg:border-t lg:border-hairline/60 lg:pt-4"
              >
                <FiLogOut size={16} />
                Log out
              </button>
            </nav>

            {/* Always-visible scroll indicator (mobile only, only when the tabs
                overflow). Reflects scroll position so users know more tabs exist. */}
            {bar.overflow && (
              <div className="mt-2.5 h-1 rounded-full bg-hairline/60 lg:hidden" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gold-deep/70"
                  style={{ width: `${bar.width}%`, marginLeft: `${bar.left}%` }}
                />
              </div>
            )}
          </aside>

          {/* Active tab content */}
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
