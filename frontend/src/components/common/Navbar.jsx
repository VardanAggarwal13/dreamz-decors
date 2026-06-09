import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX, FiChevronRight } from 'react-icons/fi';
import { navMenu as defaultNavMenu } from '@/lib/sampleData';
import { brand } from '@/lib/brand';
import useFetch from '@/hooks/useFetch';
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
  const headerRef = useRef(null);
  const [menuTop, setMenuTop] = useState(0);
  const count = useCartStore((state) => state.items.reduce((total, item) => total + item.qty, 0));
  const wishCount = useWishlistStore((state) => state.items.length);
  // Admin-editable header menu (Content → Navigation); falls back to defaults.
  const navRes = useFetch('/content/navigation', { deps: [] });
  const navMenu = navRes.data?.data?.menu?.length ? navRes.data.data.menu : defaultNavMenu;
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // While the full-height mobile menu is open: lock background scroll and pin
  // the panel to the real bottom of the header (accounts for the announcement
  // bar pushing the navbar down, and for the sticky state after scrolling).
  useEffect(() => {
    if (!open) return undefined;
    const measure = () => setMenuTop(headerRef.current?.getBoundingClientRect().bottom ?? 0);
    measure();
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', measure);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', measure);
    };
  }, [open]);

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

  // Shared search form. `autoFocus` only for the desktop toggle; `showClose`
  // hides the ✕ on the always-on mobile bar (nothing to close there).
  const searchForm = ({ autoFocus = false, showClose = false } = {}) => (
    <form onSubmit={submitSearch} className="container-page flex items-center gap-3 py-3">
      <FiSearch size={18} className="shrink-0 text-ink-muted" />
      <input
        autoFocus={autoFocus}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search artworks, collections…"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-gold-deep px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-bone transition hover:bg-gold-deep/90"
      >
        Search
      </button>
      {showClose && (
        <button
          type="button"
          onClick={() => setSearchOpen(false)}
          aria-label="Close search"
          className="shrink-0 text-ink-muted transition hover:text-ink"
        >
          <FiX size={18} />
        </button>
      )}
    </form>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-ink/8 bg-bone/85 backdrop-blur-md"
      onMouseLeave={() => setHovered(null)}
    >
      <div className="container-page relative flex h-20 items-center justify-between gap-6 lg:gap-8">
        <button
          className="text-ink lg:hidden"
          onClick={() => {
            if (!open) setMenuTop(headerRef.current?.getBoundingClientRect().bottom ?? 0);
            setOpen((value) => !value);
          }}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        {/* Logo: absolutely centered on mobile (hamburger left, icons right);
            reverts to its normal left-aligned position from lg up. */}
        <Link
          to="/"
          aria-label={brand.name}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center lg:static lg:translate-x-0 lg:translate-y-0 lg:-ml-3 lg:flex-none lg:justify-start"
        >
          <Logo variant="horizontal" className="h-12 w-auto max-w-none sm:h-16 lg:h-[4.5rem]" />
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
          {/* Search lives in the hamburger menu on mobile; icon shows from lg up. */}
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className={`${iconButton} hidden lg:grid ${searchOpen ? 'text-accent' : ''}`}
          >
            <FiSearch size={18} />
          </button>

          {user && <NotificationBell buttonClassName={iconButton} badgeClassName={iconBadge} />}

          <Link to="/wishlist" aria-label="Wishlist" className={`hidden sm:grid ${iconButton}`}>
            <FiHeart size={18} />
            {wishCount > 0 && <span className={iconBadge}>{wishCount}</span>}
          </Link>

          {/* Cart: logged-in users access it from the profile menu on mobile, so
              hide the bar icon there; guests (no profile menu) keep it. Desktop
              always shows it. */}
          <Link
            to="/cart"
            aria-label="Cart"
            className={`${iconButton} ${user ? 'hidden lg:grid' : ''}`}
          >
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

      {/* Search bar — always visible on mobile; toggled by the icon on desktop. */}
      <div className="border-t border-hairline/60 bg-bone lg:hidden">
        {searchForm()}
      </div>
      {searchOpen && (
        <div className="hidden border-t border-hairline/60 bg-bone lg:block">
          {searchForm({ autoFocus: true, showClose: true })}
        </div>
      )}

      {hovered && navMenu.find((menu) => menu.label === hovered)?.groups && (
        <MegaMenu menu={navMenu.find((menu) => menu.label === hovered)} />
      )}

      {open && createPortal(
        <div
          style={{ top: menuTop }}
          className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-t border-ink/8 bg-bone-muted lg:hidden"
        >
          <nav className="container-page flex flex-col py-2">
            <Link
              to={user ? '/account' : '/login'}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-hairline/50 py-4 font-display text-lg text-ink transition hover:text-accent"
            >
              {user ? 'My Account' : 'Sign In'}
              <FiChevronRight size={18} className="text-ink-muted" />
            </Link>
            <Link
              to="/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-hairline/50 py-4 font-display text-lg text-ink transition hover:text-accent"
            >
              <span>Wishlist{wishCount > 0 ? ` (${wishCount})` : ''}</span>
              <FiChevronRight size={18} className="text-ink-muted" />
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-hairline/50 py-4 font-display text-lg text-gold-deep transition hover:text-gold"
              >
                Admin Dashboard
                <FiChevronRight size={18} className="text-gold-deep/60" />
              </Link>
            )}
            {navMenu.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between border-b border-hairline/50 py-4 font-display text-lg text-ink transition hover:text-accent"
              >
                {item.label}
                <FiChevronRight size={18} className="text-ink-muted" />
              </Link>
            ))}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="py-4 text-left font-display text-lg text-ink transition hover:text-accent"
              >
                Log Out
              </button>
            )}
          </nav>
        </div>,
        document.body
      )}
    </header>
  );
}
