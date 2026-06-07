import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiShoppingBag,
  FiLayers,
  FiUsers,
  FiMail,
  FiFileText,
  FiSettings,
  FiArrowLeft,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import NotificationBell from '@/components/common/NotificationBell';

// Bell styling shared by the admin header placements.
const bellBadge = 'absolute -right-2 -top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-gold-deep px-1 text-[10px] font-bold text-bone';

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', Icon: FiBox },
  { to: '/admin/orders', label: 'Orders', Icon: FiShoppingBag },
  { to: '/admin/categories', label: 'Categories', Icon: FiLayers },
  { to: '/admin/customers', label: 'Customers', Icon: FiUsers },
  { to: '/admin/newsletter', label: 'Newsletter', Icon: FiMail },
  { to: '/admin/content', label: 'Content', Icon: FiFileText },
  { to: '/admin/settings', label: 'Settings', Icon: FiSettings },
];

function NavItems({ onClick }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition ${
              isActive ? 'bg-gold/15 font-medium text-gold' : 'text-bone/70 hover:bg-bone/5 hover:text-bone'
            }`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  useBodyScrollLock(open);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bone-soft lg:flex">
      {/* Sidebar (desktop) — pinned full-height so it stays put while content scrolls */}
      <aside className="hidden w-64 shrink-0 flex-col bg-ink p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto">
        <Link to="/admin" className="px-2 font-display text-xl text-bone">
          Dreamz<span className="text-gold"> Admin</span>
        </Link>
        <div className="mt-8 flex-1">
          <NavItems />
        </div>
        <div className="space-y-1 border-t border-bone/10 pt-4">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-bone/70 transition hover:bg-bone/5 hover:text-bone">
            <FiArrowLeft size={16} /> Back to store
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-bone/70 transition hover:bg-bone/5 hover:text-bone">
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar + menu — sticky bar, menu overlays content with a dim backdrop */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="relative z-20 flex items-center justify-between bg-ink px-4 py-3">
          <Link to="/admin" className="font-display text-lg text-bone">
            Dreamz<span className="text-gold"> Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <NotificationBell
              buttonClassName="relative text-bone/80 transition hover:text-bone"
              badgeClassName={bellBadge}
            />
            <button onClick={() => setOpen((v) => !v)} className="text-bone" aria-label={open ? 'Close menu' : 'Open menu'}>
              {open ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <>
            {/* Dim backdrop over the page content */}
            <div className="fixed inset-0 z-0 bg-ink/50" onClick={() => setOpen(false)} aria-hidden="true" />
            {/* Menu panel floats over the content (absolute, not in flow) */}
            <div className="absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-3.25rem)] overflow-y-auto border-t border-bone/10 bg-ink px-4 pb-4 shadow-2xl">
              <NavItems onClick={() => setOpen(false)} />
              <div className="mt-3 space-y-1 border-t border-bone/10 pt-3">
                <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-bone/70">
                  <FiArrowLeft size={16} /> Back to store
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm text-bone/70">
                  <FiLogOut size={16} /> Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <main className="min-w-0 flex-1">
        {/* Desktop header bar — notifications live here so admins never leave the dashboard */}
        <div className="sticky top-0 z-30 hidden items-center justify-end border-b border-hairline/60 bg-bone-soft/95 px-8 py-3 backdrop-blur-sm lg:flex">
          <NotificationBell
            buttonClassName="relative text-ink-soft transition hover:text-ink"
            badgeClassName={bellBadge}
          />
        </div>
        <div className="px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet context={{ user }} />
          </div>
        </div>
      </main>
    </div>
  );
}
