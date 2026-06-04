import { Link } from 'react-router-dom';
import { slugify } from '@/lib/utils';

export default function MegaMenu({ menu }) {
  if (!menu?.groups) return null;
  return (
    <div className="absolute left-0 right-0 top-full border-y border-ink/8 bg-bone-soft/95 backdrop-blur-md shadow-soft">
      <div className="container-page grid grid-cols-12 gap-8 py-10">
        <div className="col-span-3">
          <div className="text-xs uppercase tracking-[0.22em] text-ink/50">Shop</div>
          <h3 className="mt-2 font-display text-3xl">{menu.label}</h3>
          <Link
            to={menu.href}
            className="mt-4 inline-block text-xs uppercase tracking-[0.2em] text-accent hover:text-accent-deep"
          >
            See all →
          </Link>
        </div>
        <div className="col-span-9 grid grid-cols-3 gap-8">
          {menu.groups.map((g) => (
            <div key={g.title}>
              <div className="text-xs uppercase tracking-[0.22em] text-ink/50">{g.title}</div>
              <ul className="mt-3 space-y-2">
                {g.items.map((item) => (
                  <li key={item}>
                    <Link
                      to={`${menu.href}?tag=${slugify(item)}`}
                      className="text-sm text-ink/75 hover:text-accent"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
