import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { contentPages, homeContent } from '@/lib/siteContent';

const KEYS = [
  { key: 'home', label: 'Homepage' },
  { key: 'about', label: 'About' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'faq', label: 'FAQ' },
  { key: 'contact', label: 'Contact' },
  { key: 'terms', label: 'Terms' },
];

// Built-in default content for each key (used as fallback + "reset").
const defaultFor = (key) => (key === 'home' ? homeContent : contentPages[key] || {});

export default function AdminContent() {
  const [activeKey, setActiveKey] = useState('about');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const loadKey = async (key) => {
    setActiveKey(key);
    setErr('');
    let effective = defaultFor(key);
    try {
      const res = await api.get(`/content/${key}`);
      if (res.data && Object.keys(res.data).length) {
        effective = { ...defaultFor(key), ...res.data };
      }
    } catch {
      /* fall back to default */
    }
    setText(JSON.stringify(effective, null, 2));
  };

  useEffect(() => { loadKey('home'); /* eslint-disable-next-line */ }, []);

  const save = async () => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setErr(`Invalid JSON — ${e.message}`);
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await api.put(`/content/${activeKey}`, { data: parsed });
      toast.success('Content saved — live on the site');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => setText(JSON.stringify(defaultFor(activeKey), null, 2));

  return (
    <div>
      <Seo title="Admin — Content" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Content pages</h1>
          <p className="mt-1 text-sm text-ink-soft">Edit info-page content — the layout stays the same.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" onClick={resetToDefault}>Reset to default</Button>
          <Button variant="primary" size="md" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
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

      {err && <div className="mt-4 rounded-lg border border-sale/25 bg-sale/8 px-4 py-2 text-sm text-sale">{err}</div>}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        className="mt-4 h-[58vh] w-full rounded-2xl border border-hairline/60 bg-bone p-4 font-mono text-xs leading-6 text-ink outline-none focus:border-gold"
      />
    </div>
  );
}
