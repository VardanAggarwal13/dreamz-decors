import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiUser, FiShoppingBag, FiMapPin, FiBell, FiSettings, FiLogOut } from 'react-icons/fi';
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
          <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <nav className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
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
