import { useId } from 'react';
import { FiTrash2, FiPlus, FiArrowUp, FiArrowDown, FiAlertTriangle } from 'react-icons/fi';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import useFetch from '@/hooks/useFetch';
import { normalizeHref } from '@/lib/utils';

/*
 * Purpose-built editor for the header navigation.
 *
 * Every nav item is a plain link — clicking it just goes to a page. There are no
 * dropdowns, sub-items, or headings.
 *
 * Crucially, the admin PICKS a destination rather than typing one. The category
 * routes are slug-based (`/:category`) and Shop renders a 404 for any slug that
 * isn't a real Category, so a hand-typed link like `/best-seller` silently dies.
 * Offering only destinations that actually resolve makes that impossible.
 *
 * Saved shape is normalised to `{ menu: [{ label, href }] }`, stripping any
 * leftover fields from older menu structures.
 */

const CUSTOM = '__custom__';

// Static routes that exist in App.jsx and always resolve. `/shop` accepts sort
// params, so "Best sellers" is a real destination without needing a category.
const STATIC_PAGES = [
  { href: '/shop', label: 'Shop — all products' },
  { href: '/shop?sort=bestselling', label: 'Best sellers' },
  { href: '/shop?sort=newest', label: 'New arrivals' },
  { href: '/about', label: 'About' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
];

// `/shop?sort=x` and `/shop` are the same route — compare paths, not query strings.
const pathOf = (href) => String(href || '').split(/[?#]/)[0];

export default function NavMenuEditor({ value, onChange }) {
  const baseId = useId();
  const catRes = useFetch('/categories', { deps: [] });
  const categories = catRes.data?.data || [];

  const menu = Array.isArray(value?.menu) ? value.menu : [];

  // Everything a nav item is allowed to point at.
  const categoryOptions = categories.map((c) => ({ href: `/${c.slug}`, label: c.title }));
  const destinations = [...categoryOptions, ...STATIC_PAGES];
  const knownHrefs = new Set(destinations.map((d) => d.href));
  const knownPaths = new Set(destinations.map((d) => pathOf(d.href)));

  // Saved hrefs may be `/shop/gallery-sets`; the router sees `/gallery-sets`.
  const resolve = (href) => normalizeHref(href || '');
  // Valid when it matches a destination exactly, or points at a real route with
  // its own query string (e.g. a custom `/shop?sort=price`).
  const isKnown = (href) => knownHrefs.has(resolve(href)) || knownPaths.has(pathOf(resolve(href)));
  const labelFor = (href) => destinations.find((d) => d.href === resolve(href))?.label || '';

  // Always write back a clean { menu: [{ label, href }] } — no stray fields.
  const commit = (next) =>
    onChange({ menu: next.map(({ label = '', href = '' }) => ({ label, href })) });

  const update = (i, patch) => commit(menu.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  // Choosing a destination fills in the link, and the label too when the admin
  // hasn't written their own (or was still showing the previous destination's).
  const setDestination = (i, href) => {
    if (href === CUSTOM) {
      update(i, { href: '' });
      return;
    }
    const item = menu[i];
    const labelWasAuto = !item.label?.trim() || item.label === labelFor(item.href);
    update(i, { href, ...(labelWasAuto && { label: labelFor(href) }) });
  };

  const remove = (i) => commit(menu.filter((_, idx) => idx !== i));
  const add = () => commit([...menu, { label: '', href: '' }]);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= menu.length) return;
    const next = menu.slice();
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  if (catRes.loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-hairline/60 bg-bone-soft px-4 py-2.5 text-xs leading-5 text-ink-soft">
        These are the links across the top of every page. Pick where each one goes — the list
        only shows pages that actually exist, so a menu link can never lead to a dead page.
        To add a new category here, create it first under{' '}
        <span className="font-medium text-ink">Categories</span>.
      </p>

      {menu.length === 0 && (
        <p className="text-sm text-ink-muted">No menu links yet — add your first one below.</p>
      )}

      <div className="space-y-3">
        {menu.map((item, i) => {
          // Only an exact match has a dropdown option; anything else (a hand-typed
          // path, or `/shop?sort=price`) drops into the "Custom link" text field.
          const hasOption = knownHrefs.has(resolve(item.href));
          const custom = !!item.href && !hasOption;
          const selectValue = hasOption ? resolve(item.href) : item.href ? CUSTOM : '';
          // Broken means it will 404 — a custom link to a REAL route is fine.
          const broken = !item.href || !isKnown(item.href);

          return (
            <div key={i} className="rounded-xl border border-hairline/60 bg-bone p-4 transition hover:border-gold/30">
              <div className="mb-3 flex items-center justify-between">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-semibold text-bone">
                  {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition hover:bg-bone-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === menu.length - 1}
                    aria-label="Move down"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition hover:bg-bone-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`Remove ${item.label || `item ${i + 1}`}`}
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition hover:bg-sale/10 hover:text-sale"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`${baseId}-dest-${i}`}>Goes to</Label>
                  <select
                    id={`${baseId}-dest-${i}`}
                    value={selectValue}
                    onChange={(e) => setDestination(i, e.target.value)}
                    className="flex h-11 w-full rounded-md border border-ink/15 bg-bone-soft px-3 text-sm text-ink outline-none focus:border-gold"
                  >
                    <option value="" disabled>Choose a page…</option>
                    {categoryOptions.length > 0 && (
                      <optgroup label="Categories">
                        {categoryOptions.map((d) => (
                          <option key={d.href} value={d.href}>{d.label}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Pages">
                      {STATIC_PAGES.map((d) => (
                        <option key={d.href} value={d.href}>{d.label}</option>
                      ))}
                    </optgroup>
                    <option value={CUSTOM}>Custom link…</option>
                  </select>

                  {custom && (
                    <Input
                      value={item.href ?? ''}
                      placeholder="/some-path"
                      onChange={(e) => update(i, { href: e.target.value })}
                    />
                  )}

                  {broken && (
                    <p className="flex items-start gap-1.5 text-xs text-sale">
                      <FiAlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {item.href
                        ? `“${item.href}” isn’t a real page — visitors clicking this will see a 404.`
                        : 'Pick where this link should go.'}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${baseId}-label-${i}`}>Label</Label>
                  <Input
                    id={`${baseId}-label-${i}`}
                    value={item.label ?? ''}
                    placeholder="e.g. Wall Art"
                    onChange={(e) => update(i, { label: e.target.value })}
                  />
                  <p className="text-xs text-ink-muted">What visitors see in the menu.</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/15 py-2.5 text-xs font-medium text-ink-soft transition hover:border-gold hover:bg-gold/5 hover:text-gold-deep"
      >
        <FiPlus size={14} /> Add menu link
      </button>
    </div>
  );
}
