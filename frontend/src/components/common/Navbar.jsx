import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from 'react-icons/fi';
import { navMenu } from '@/lib/sampleData';
import { brand } from '@/lib/brand';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import Logo from './Logo';
import MegaMenu from './MegaMenu';
import NotificationBell from './NotificationBell';
import AccountMenu from './AccountMenu';

// Shared style for every icon control in the right-hand cluster so they line
// up on a consistent grid and their badges never collide.
const iconButton =
  'relative grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-ink/5 hover:text-accent';
const iconBadge =
  'absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-bone';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const count = useCartStore((state) => state.items.reduce((total, item) => total + item.qty, 0));
  const wishCount = useWishlistStore((state) => state.items.length);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setTerm('');
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-ink/8 bg-bone/85 backdrop-blur-md"
      onMouseLeave={() => setHovered(null)}
    >
      <div className="container-page flex h-20 items-center justify-between gap-6 lg:gap-8">
        <button
          className="text-ink lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        <Link
          to="/"
          aria-label={brand.name}
          className="flex items-center justify-start lg:-ml-3 lg:flex-none"
        >
          <Logo variant="horizontal" className="h-16 w-auto max-w-none sm:h-[4.5rem]" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex xl:gap-10">
          {navMenu.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className="nav-link"
              onMouseEnter={() => setHovered(item.label)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 text-ink sm:gap-1 lg:flex-none">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className={`${iconButton} ${searchOpen ? 'text-accent' : ''}`}
          >
            <FiSearch size={18} />
          </button>

          {user && <NotificationBell buttonClassName={iconButton} badgeClassName={iconBadge} />}

          <Link to="/wishlist" aria-label="Wishlist" className={`hidden sm:grid ${iconButton}`}>
            <FiHeart size={18} />
            {wishCount > 0 && <span className={iconBadge}>{wishCount}</span>}
          </Link>

          <Link to="/cart" aria-label="Cart" className={iconButton}>
            <FiShoppingBag size={18} />
            {count > 0 && <span className={iconBadge}>{count}</span>}
          </Link>

          {/* Divider between quick actions and the account control */}
          <span className="mx-1.5 hidden h-6 w-px bg-hairline sm:block" />

          {user ? (
            <AccountMenu />
          ) : (
            <Link to="/login" aria-label="Sign in" className={iconButton}>
              <FiUser size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-hairline/60 bg-bone">
          <form onSubmit={submitSearch} className="container-page flex items-center gap-3 py-3">
            <FiSearch size={18} className="shrink-0 text-ink-muted" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search artworks, collections…"
              className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            <button
              type="submit"
              className="rounded-full bg-gold-deep px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-bone transition hover:bg-gold-deep/90"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="shrink-0 text-ink-muted transition hover:text-ink"
            >
              <FiX size={18} />
            </button>
          </form>
        </div>
      )}

      {hovered && navMenu.find((menu) => menu.label === hovered)?.groups && (
        <MegaMenu menu={navMenu.find((menu) => menu.label === hovered)} />
      )}

      {open && (
        <div className="border-t border-ink/8 bg-bone-muted lg:hidden">
          <div className="container-page flex flex-col py-4">
            <Link
              to={user ? '/account' : '/login'}
              onClick={() => setOpen(false)}
              className="py-3 text-sm uppercase tracking-[0.2em] text-ink/80 hover:text-accent"
            >
              {user ? 'My Account' : 'Sign In'}
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setOpen(false)}
              className="py-3 text-sm uppercase tracking-[0.2em] text-ink/80 hover:text-accent"
            >
              Wishlist{wishCount > 0 ? ` (${wishCount})` : ''}
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="py-3 text-sm uppercase tracking-[0.2em] text-gold-deep hover:text-gold"
              >
                Admin Dashboard
              </Link>
            )}
            {navMenu.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm uppercase tracking-[0.2em] text-ink/80 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="py-3 text-left text-sm uppercase tracking-[0.2em] text-ink/80 hover:text-accent"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
