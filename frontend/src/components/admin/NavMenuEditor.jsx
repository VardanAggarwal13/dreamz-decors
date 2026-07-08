import { useId } from 'react';
import { FiTrash2, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

/*
 * Purpose-built editor for the header navigation.
 *
 * Every nav item in the UI is a plain link — clicking it just goes to a page.
 * There are no dropdowns, sub-items, or headings, so the editor deliberately
 * exposes only two things per item: the Label (what shows in the menu) and the
 * Link (where it goes). It also normalises the saved shape to `{ menu: [{ label,
 * href }] }`, which strips any leftover fields from older menu structures.
 */
// "Best Sellers" → "best-sellers". Routes are slug-based (/:category), so a
// slugified label is a valid link on its own.
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// The link we derive from a label. Empty label → empty link.
const autoHref = (label) => {
  const slug = slugify(label);
  return slug ? `/shop/${slug}` : '';
};

// True when the current link was auto-derived (or never set) — i.e. the admin
// hasn't typed a custom path, so it's safe to keep it in sync with the label.
const isAutoHref = (href, label) => !href || href === '/' || href === autoHref(label);

export default function NavMenuEditor({ value, onChange }) {
  const baseId = useId();
  const menu = Array.isArray(value?.menu) ? value.menu : [];

  // Always write back a clean { menu: [{ label, href }] } — no stray fields.
  const commit = (next) =>
    onChange({ menu: next.map(({ label = '', href = '' }) => ({ label, href })) });

  const update = (i, patch) => commit(menu.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  // Typing the label auto-fills the link — unless the admin has set a custom one.
  const setLabel = (i, label) => {
    const item = menu[i];
    const href = isAutoHref(item.href, item.label) ? autoHref(label) : item.href;
    update(i, { label, href });
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

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-hairline/60 bg-bone-soft px-4 py-2.5 text-xs leading-5 text-ink-soft">
        These are the links across the top of every page. Just type the{' '}
        <span className="font-medium">Label</span> — the <span className="font-medium">Link</span>{' '}
        fills in for you automatically. Use the arrows to reorder.
      </p>

      {menu.length === 0 && (
        <p className="text-sm text-ink-muted">No menu links yet — add your first one below.</p>
      )}

      <div className="space-y-3">
        {menu.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-hairline/60 bg-bone p-4 transition hover:border-gold/30"
          >
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
                <Label htmlFor={`${baseId}-label-${i}`}>Label</Label>
                <Input
                  id={`${baseId}-label-${i}`}
                  value={item.label ?? ''}
                  placeholder="e.g. Wall Art"
                  onChange={(e) => setLabel(i, e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${baseId}-href-${i}`}>Link</Label>
                <Input
                  id={`${baseId}-href-${i}`}
                  value={item.href ?? ''}
                  placeholder="e.g. /wall-art"
                  onChange={(e) => update(i, { href: e.target.value })}
                />
                <p className="text-xs text-ink-muted">
                  Fills in automatically from the label. Leave it as-is, or type your
                  own path (e.g. <span className="font-mono">/about</span>) for a custom link.
                </p>
              </div>
            </div>
          </div>
        ))}
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
