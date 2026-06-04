import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from 'react-icons/fi';
import { navMenu } from '@/lib/sampleData';
import { brand } from '@/lib/brand';
import { useCartStore } from '@/store/cartStore';
import Logo from './Logo';
import MegaMenu from './MegaMenu';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const count = useCartStore((state) => state.items.reduce((total, item) => total + item.qty, 0));

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

        <div className="flex items-center gap-4 text-ink lg:flex-none">
          <button aria-label="Search" className="hidden hover:text-accent sm:block">
            <FiSearch size={18} />
          </button>
          <Link to="/login" aria-label="Account" className="hover:text-accent">
            <FiUser size={18} />
          </Link>
          <button aria-label="Wishlist" className="hidden hover:text-accent sm:block">
            <FiHeart size={18} />
          </button>
          <Link to="/cart" aria-label="Cart" className="relative hover:text-accent">
            <FiShoppingBag size={18} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-bone">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {hovered && navMenu.find((menu) => menu.label === hovered)?.groups && (
        <MegaMenu menu={navMenu.find((menu) => menu.label === hovered)} />
      )}

      {open && (
        <div className="border-t border-ink/8 bg-bone-muted lg:hidden">
          <div className="container-page flex flex-col py-4">
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
          </div>
        </div>
      )}
    </header>
  );
}