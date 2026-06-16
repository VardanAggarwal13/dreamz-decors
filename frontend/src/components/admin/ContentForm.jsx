import { useId } from 'react';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';

/*
 * Schema-free CMS form built from shadcn-style primitives (Card / Input /
 * Textarea / Label / Switch). It mirrors the content object: scalars become
 * labelled fields in a responsive grid, nested objects/arrays become titled
 * panels, and arrays become add/remove lists (numbered cards for object items,
 * simple rows for primitives). Edits rebuild the object immutably.
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

// How wide a field sits in the 2-col grid: structured/long content spans full.
function spanFor(key, val) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return 'sm:col-span-2';
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
  if (typeof value === 'boolean') {
    return (
      <div className="flex h-full items-center justify-between gap-3 rounded-md border border-ink/12 bg-bone-soft px-4 py-3">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink">{humanize(keyName)}</Label>
        <Switch id={id} checked={value} onCheckedChange={onChange} />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{humanize(keyName)}</Label>
      <Control value={value} onChange={onChange} keyName={keyName} id={id} />
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

// depth 0 → elevated section card; deeper → quiet inset sub-group.
function Panel({ depth, title, count, children }) {
  if (depth === 0) {
    return (
      <Card>
        <CardHeader className="border-b border-hairline/50">
          <span className="h-5 w-[3px] shrink-0 rounded-full bg-gold" />
          <CardTitle className="flex-1">{title}</CardTitle>
          {count != null && (
            <span className="rounded-full bg-gold/12 px-2.5 py-0.5 text-xs font-semibold text-gold-deep">{count}</span>
          )}
        </CardHeader>
        <CardContent className="pt-5">{children}</CardContent>
      </Card>
    );
  }
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
    <Panel depth={depth} title={humanize(keyName)}>
      <Grid value={value} onChange={onChange} depth={depth + 1} />
    </Panel>
  );
}

function ArrayField({ keyName, value, onChange, depth }) {
  const items = value;
  const itemsAreObjects = items.length > 0 && items.every((it) => it && typeof it === 'object' && !Array.isArray(it));
  const template = items.length ? blankLike(items[0]) : '';
  const singular = singularOf(humanize(keyName));

  const setItem = (i, v) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));
  const addItem = () => onChange([...items, template]);

  return (
    <Panel depth={depth} title={humanize(keyName)} count={items.length}>
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
    </Panel>
  );
}

function Node({ keyName, value, onChange, depth }) {
  if (Array.isArray(value)) return <ArrayField keyName={keyName} value={value} onChange={onChange} depth={depth} />;
  if (value && typeof value === 'object') return <ObjectField keyName={keyName} value={value} onChange={onChange} depth={depth} />;
  return <Field keyName={keyName} value={value} onChange={onChange} />;
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
    <div className="space-y-5">
      {blocks.map((b, bi) => {
        if (b.type === 'node') {
          return <Node key={b.key} keyName={b.key} value={value[b.key]} onChange={(nv) => setKey(b.key, nv)} depth={0} />;
        }
        const title = scalarSeen ? 'More details' : 'Page details';
        scalarSeen = true;
        return (
          <Panel key={`scalars-${bi}`} depth={0} title={title}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              {b.keys.map((k) => (
                <div key={k} className={spanFor(k, value[k])}>
                  <Field keyName={k} value={value[k]} onChange={(nv) => setKey(k, nv)} />
                </div>
              ))}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
