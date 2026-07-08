import { useId, useState } from 'react';
import { FiTrash2, FiPlus, FiChevronDown } from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import ImageInput from '@/components/admin/ImageInput';

/*
 * Schema-free CMS form built from shadcn-style primitives. It mirrors the
 * content object: scalars become labelled fields in a responsive grid, nested
 * objects/arrays become titled panels, and arrays become add/remove lists.
 *
 * Two things make it friendly for a non-technical admin:
 *   • Top-level sections are collapsible — the page opens as a short outline you
 *     expand one section at a time, instead of one endless wall of fields.
 *   • Photo fields render a real upload/preview widget (ImageInput) instead of a
 *     raw URL text box, so adding an image is just "click → choose file".
 */

// camelCase / snake → "Title Case"
function humanize(key) {
  if (!key && key !== 0) return '';
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Keys whose values are typically multi-line → render as a textarea (full width).
const LONG_TEXT_KEYS = /^(description|intro|body|text|answer|blurb|crafttext|successtext|footnote|quote|message|hint)$/i;
const isLongText = (key, val) =>
  LONG_TEXT_KEYS.test(String(key)) || (typeof val === 'string' && val.length > 70);

// Photo fields → render the upload/preview widget instead of a URL text box.
// Matched by key name (…image / photo / banner / logo …) OR by a value that
// clearly looks like an image URL. NOTE: `icon` is intentionally excluded — those
// hold short icon-name strings (award / truck …), not image URLs.
const IMAGE_KEYS = /(image|img|photo|picture|thumbnail|thumb|banner|cover|logo|avatar|poster|hero|bg|background)$/i;
const looksLikeImageUrl = (v) =>
  typeof v === 'string' &&
  (/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(v) || /res\.cloudinary\.com|\/image\/upload\//i.test(v));
const isImageField = (key, val) =>
  (IMAGE_KEYS.test(String(key)) && (val === '' || typeof val === 'string')) || looksLikeImageUrl(val);

// Short inline hints for keys that aren't self-explanatory.
const fieldHint = (key) =>
  /^icon$/i.test(String(key)) ? 'Icon name — e.g. award, truck, shield, package' : '';

// A blank value of the same shape — used as the template when adding list items.
function blankLike(val) {
  if (Array.isArray(val)) return val.length ? [blankLike(val[0])] : [];
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, blankLike(v)]));
  }
  if (typeof val === 'number') return 0;
  if (typeof val === 'boolean') return false;
  return '';
}

const singularOf = (label) => label.replace(/ies$/, 'y').replace(/s$/, '') || 'Item';

// How wide a field sits in the 2-col grid: structured/long/image content spans full.
function spanFor(key, val) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return 'sm:col-span-2';
  if (isImageField(key, val)) return 'sm:col-span-2';
  if (typeof val === 'boolean') return 'sm:col-span-1';
  if (isLongText(key, val)) return 'sm:col-span-2';
  return 'sm:col-span-1';
}

// ── Primitive control + field ───────────────────────────────────────────────
function Control({ value, onChange, keyName, id }) {
  if (typeof value === 'number') {
    return (
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    );
  }
  if (isLongText(keyName, value)) {
    return <Textarea id={id} rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
}

function Field({ keyName, value, onChange }) {
  const id = useId();

  // Photo → upload/preview widget.
  if (isImageField(keyName, value)) {
    return (
      <ImageInput
        label={humanize(keyName)}
        value={value ?? ''}
        onChange={onChange}
        hint="Upload a photo or paste an image link."
      />
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div className="flex h-full items-center justify-between gap-3 rounded-md border border-ink/12 bg-bone-soft px-4 py-3">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink">{humanize(keyName)}</Label>
        <Switch id={id} checked={value} onCheckedChange={onChange} />
      </div>
    );
  }

  const hint = fieldHint(keyName);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{humanize(keyName)}</Label>
      <Control value={value} onChange={onChange} keyName={keyName} id={id} />
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/15 py-2.5 text-xs font-medium text-ink-soft transition hover:border-gold hover:bg-gold/5 hover:text-gold-deep"
    >
      <FiPlus size={14} /> Add {label}
    </button>
  );
}

// ── Grid + recursion ────────────────────────────────────────────────────────
function Grid({ value, onChange, depth }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
      {Object.entries(value).map(([k, v]) => (
        <div key={k} className={spanFor(k, v)}>
          <Node keyName={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} depth={depth} />
        </div>
      ))}
    </div>
  );
}

// Quiet inset sub-group for nested objects/arrays (depth > 0).
function SubPanel({ title, count, children }) {
  return (
    <div className="rounded-xl bg-bone-soft/50 p-4 ring-1 ring-hairline/50">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-3.5 w-[2px] shrink-0 rounded-full bg-gold/70" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{title}</span>
        {count != null && <span className="text-xs text-ink-muted">({count})</span>}
      </div>
      {children}
    </div>
  );
}

function ObjectField({ keyName, value, onChange, depth }) {
  return (
    <SubPanel title={humanize(keyName)}>
      <Grid value={value} onChange={onChange} depth={depth + 1} />
    </SubPanel>
  );
}

function ArrayBody({ keyName, value, onChange, depth }) {
  const items = value;
  const itemsAreObjects = items.length > 0 && items.every((it) => it && typeof it === 'object' && !Array.isArray(it));
  const template = items.length ? blankLike(items[0]) : '';
  const singular = singularOf(humanize(keyName));

  const setItem = (i, v) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const addItem = () => onChange([...items, template]);

  return (
    <>
      {items.length === 0 && <p className="text-xs text-ink-muted">None yet — add the first one below.</p>}

      {itemsAreObjects ? (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-hairline/60 bg-white p-4 transition hover:border-gold/30">
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[11px] font-semibold text-bone">{i + 1}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">{singular}</span>
                </div>
                <button type="button" onClick={() => removeItem(i)} className="text-ink-muted transition hover:text-sale" aria-label={`Remove ${singular} ${i + 1}`}>
                  <FiTrash2 size={15} />
                </button>
              </div>
              <Grid value={it} onChange={(nv) => setItem(i, nv)} depth={depth + 1} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-3 w-4 shrink-0 text-right text-[11px] font-medium text-ink-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Control value={it} onChange={(nv) => setItem(i, nv)} keyName={keyName} />
              </div>
              <button type="button" onClick={() => removeItem(i)} className="mt-3 shrink-0 text-ink-muted transition hover:text-sale" aria-label={`Remove item ${i + 1}`}>
                <FiTrash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddButton onClick={addItem} label={singular.toLowerCase()} />
    </>
  );
}

function ArrayField({ keyName, value, onChange, depth }) {
  return (
    <SubPanel title={humanize(keyName)} count={value.length}>
      <ArrayBody keyName={keyName} value={value} onChange={onChange} depth={depth} />
    </SubPanel>
  );
}

function Node({ keyName, value, onChange, depth }) {
  if (Array.isArray(value)) return <ArrayField keyName={keyName} value={value} onChange={onChange} depth={depth} />;
  if (value && typeof value === 'object') return <ObjectField keyName={keyName} value={value} onChange={onChange} depth={depth} />;
  return <Field keyName={keyName} value={value} onChange={onChange} />;
}

// ── Top-level collapsible section ────────────────────────────────────────────
function Section({ title, count, badge, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-bone-soft/60"
      >
        <span className="h-5 w-[3px] shrink-0 rounded-full bg-gold" />
        <span className="flex-1 font-display text-lg leading-tight text-ink">{title}</span>
        {badge != null && (
          <span className="rounded-full bg-gold/12 px-2.5 py-0.5 text-xs font-semibold text-gold-deep">{badge}</span>
        )}
        <FiChevronDown size={18} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-hairline/50 px-5 py-5">{children}</div>}
    </Card>
  );
}

// Splits the top-level object into ordered blocks: runs of loose scalar fields
// become one "details" card; each object/array becomes its own section card.
function topLevelBlocks(value) {
  const blocks = [];
  let run = [];
  const flush = () => {
    if (run.length) {
      blocks.push({ type: 'scalars', keys: run });
      run = [];
    }
  };
  Object.entries(value).forEach(([k, v]) => {
    if (Array.isArray(v) || (v && typeof v === 'object')) {
      flush();
      blocks.push({ type: 'node', key: k });
    } else {
      run.push(k);
    }
  });
  flush();
  return blocks;
}

export default function ContentForm({ value, onChange }) {
  if (!value || typeof value !== 'object') {
    return <p className="text-sm text-ink-muted">No editable content for this page.</p>;
  }
  const blocks = topLevelBlocks(value);
  const setKey = (k, nv) => onChange({ ...value, [k]: nv });
  let scalarSeen = false;

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted">
        Click a section to open it. Your changes go live when you press <span className="font-medium text-ink-soft">Save changes</span> below.
      </p>

      {blocks.map((b, bi) => {
        // First section opens by default so the page isn't fully collapsed.
        const openByDefault = bi === 0;

        if (b.type === 'node') {
          const v = value[b.key];
          const badge = Array.isArray(v) ? v.length : null;
          return (
            <Section key={b.key} title={humanize(b.key)} badge={badge} defaultOpen={openByDefault}>
              {Array.isArray(v) ? (
                <ArrayBody keyName={b.key} value={v} onChange={(nv) => setKey(b.key, nv)} depth={1} />
              ) : (
                <Grid value={v} onChange={(nv) => setKey(b.key, nv)} depth={1} />
              )}
            </Section>
          );
        }

        const title = scalarSeen ? 'More details' : 'Page details';
        scalarSeen = true;
        return (
          <Section key={`scalars-${bi}`} title={title} defaultOpen={openByDefault}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              {b.keys.map((k) => (
                <div key={k} className={spanFor(k, value[k])}>
                  <Field keyName={k} value={value[k]} onChange={(nv) => setKey(k, nv)} />
                </div>
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}
