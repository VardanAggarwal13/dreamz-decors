import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FiCode, FiList, FiRotateCcw } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import ContentForm from '@/components/admin/ContentForm';
import { contentPages, homeContent } from '@/lib/siteContent';

const KEYS = [
  { key: 'home', label: 'Homepage' },
  { key: 'about', label: 'About' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
  { key: 'terms', label: 'Terms' },
  { key: 'product', label: 'Product' },
  { key: 'navigation', label: 'Navigation' },
];

// Short editor hints for keys that use icon-name strings or special structure.
const HINTS = {
  home: 'Includes the "Why Dreamz Decor" cards (icon names: award / madeIn / package / truck / check) and the newsletter band copy.',
  about: 'Value cards use icon names: palette / sparkles / award / shield. Use \\n in a title for a line break.',
  shipping: 'Edit the four "Order\'s Journey" steps plus the shipping info sections.',
  product: 'Trust badges use icon names: shield / award / mapPin / package / truck / check.',
  navigation: 'Header menu + mega-menu. Each item has a label, a link, and groups of links.',
};

// Built-in default content for each key (used as fallback + "reset").
const defaultFor = (key) => (key === 'home' ? homeContent : contentPages[key] || {});

export default function AdminContent() {
  const [activeKey, setActiveKey] = useState('home');
  const [data, setData] = useState({});
  const [mode, setMode] = useState('form'); // 'form' | 'json'
  const [jsonDraft, setJsonDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const loadKey = async (key) => {
    setActiveKey(key);
    setErr('');
    setMode('form');
    setLoading(true);
    let effective = defaultFor(key);
    try {
      const res = await api.get(`/content/${key}`);
      if (res.data && Object.keys(res.data).length) {
        effective = { ...defaultFor(key), ...res.data };
      }
    } catch {
      /* fall back to default */
    }
    setData(effective);
    setLoading(false);
  };

  useEffect(() => { loadKey('home'); /* eslint-disable-next-line */ }, []);

  // Toggle between the form and the raw-JSON escape hatch, keeping them in sync.
  const toForm = () => {
    try {
      setData(JSON.parse(jsonDraft));
      setErr('');
      setMode('form');
    } catch (e) {
      setErr(`Invalid JSON — ${e.message}`);
    }
  };
  const toJson = () => {
    setJsonDraft(JSON.stringify(data, null, 2));
    setErr('');
    setMode('json');
  };

  const save = async () => {
    let payload = data;
    if (mode === 'json') {
      try {
        payload = JSON.parse(jsonDraft);
        setData(payload);
      } catch (e) {
        setErr(`Invalid JSON — ${e.message}`);
        return;
      }
    }
    setSaving(true);
    setErr('');
    try {
      await api.put(`/content/${activeKey}`, { data: payload });
      toast.success('Content saved — live on the site');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (!window.confirm('Reset this page to the built-in default content? Unsaved edits will be lost.')) return;
    const def = defaultFor(activeKey);
    setData(def);
    if (mode === 'json') setJsonDraft(JSON.stringify(def, null, 2));
    toast.message('Reset to default — remember to Save to apply.');
  };

  return (
    <div className="pb-24">
      <Seo title="Admin — Content" noIndex />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Content pages</h1>
          <p className="mt-1 text-sm text-ink-soft">Edit the words and cards on your info pages — the layout stays the same.</p>
        </div>
        <button
          type="button"
          onClick={mode === 'form' ? toJson : toForm}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-bone px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft transition hover:border-gold/50 hover:text-gold-deep"
        >
          {mode === 'form' ? <><FiCode size={14} /> Edit as JSON</> : <><FiList size={14} /> Back to form</>}
        </button>
      </div>

      {/* Page tabs */}
      <div className="mt-5 flex flex-wrap gap-2">
        {KEYS.map((k) => (
          <button
            key={k.key}
            onClick={() => loadKey(k.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
              activeKey === k.key ? 'bg-ink text-bone' : 'border border-hairline text-ink-soft hover:border-gold/50'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {HINTS[activeKey] && (
        <p className="mt-4 rounded-lg border border-hairline/60 bg-bone-soft px-4 py-2 text-xs leading-5 text-ink-soft">
          {HINTS[activeKey]}
        </p>
      )}

      {err && <div className="mt-4 rounded-lg border border-sale/25 bg-sale/8 px-4 py-2 text-sm text-sale">{err}</div>}

      {loading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : mode === 'json' ? (
        <textarea
          value={jsonDraft}
          onChange={(e) => setJsonDraft(e.target.value)}
          spellCheck={false}
          className="mt-5 h-[58vh] w-full rounded-2xl border border-hairline/60 bg-bone p-4 font-mono text-xs leading-6 text-ink outline-none focus:border-gold"
        />
      ) : (
        <div className="mt-5">
          <ContentForm value={data} onChange={setData} />
        </div>
      )}

      {/* Sticky save bar — these pages get long, so keep Save reachable. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline/60 bg-bone-soft/95 px-4 py-3 backdrop-blur-sm lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="truncate text-xs text-ink-muted">
            Editing <span className="font-medium text-ink-soft">{KEYS.find((k) => k.key === activeKey)?.label}</span>
          </span>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="md" onClick={resetToDefault}>
              <FiRotateCcw size={14} /> <span className="hidden sm:inline">Reset to default</span><span className="sm:hidden">Reset</span>
            </Button>
            <Button variant="primary" size="md" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
