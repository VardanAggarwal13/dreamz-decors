import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { useSettingsStore, DEFAULT_SETTINGS } from '@/store/settingsStore';

export default function AdminSettings() {
  const setStore = useSettingsStore((s) => s.setSettings);
  // Seed from the (persisted) store so the form opens with the real values
  // already filled in — no flash from defaults to fetched data.
  const [form, setForm] = useState(() => ({ ...DEFAULT_SETTINGS, ...useSettingsStore.getState().settings }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => setForm({ ...DEFAULT_SETTINGS, ...res.data })).catch(() => {});
  }, []);

  const setGroup = (group, key, value) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        brand: form.brand,
        contact: form.contact,
        social: form.social,
        announcement: form.announcement,
        shipping: {
          freeThreshold: Number(form.shipping.freeThreshold) || 0,
          flatRate: Number(form.shipping.flatRate) || 0,
        },
      };
      const res = await api.patch('/settings', payload);
      setStore({ ...DEFAULT_SETTINGS, ...res.data });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <Seo title="Admin — Settings" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Site settings</h1>
        <Button type="submit" variant="primary" size="md" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
      <p className="mt-1 text-sm text-ink-soft">Edit store-wide content shown across the site.</p>

      <div className="mt-6 space-y-6">
        {/* Brand */}
        <Section title="Brand">
          <Grid>
            <Field label="Store name"><Input value={form.brand.name} onChange={(e) => setGroup('brand', 'name', e.target.value)} /></Field>
            <Field label="Tagline"><Input value={form.brand.tagline} onChange={(e) => setGroup('brand', 'tagline', e.target.value)} /></Field>
          </Grid>
          <Field label="Footer description" className="mt-4">
            <textarea value={form.brand.description} onChange={(e) => setGroup('brand', 'description', e.target.value)} rows={3} className={areaCls} />
          </Field>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <Grid>
            <Field label="Support email"><Input value={form.contact.email} onChange={(e) => setGroup('contact', 'email', e.target.value)} /></Field>
            <Field label="Phone"><Input value={form.contact.phone} onChange={(e) => setGroup('contact', 'phone', e.target.value)} /></Field>
          </Grid>
          <Field label="Address" className="mt-4"><Input value={form.contact.address} onChange={(e) => setGroup('contact', 'address', e.target.value)} /></Field>
          <Field label="Business hours (one line per row)" className="mt-4">
            <textarea value={form.contact.hours || ''} onChange={(e) => setGroup('contact', 'hours', e.target.value)} rows={2} className={areaCls} placeholder={'Mon–Sat: 10:00 AM – 7:00 PM\nSunday: Closed'} />
          </Field>
        </Section>

        {/* Social */}
        <Section title="Social links">
          <Grid>
            {['instagram', 'facebook', 'pinterest', 'youtube', 'whatsapp'].map((k) => (
              <Field key={k} label={k}><Input value={form.social[k] || ''} onChange={(e) => setGroup('social', k, e.target.value)} placeholder="https://…" /></Field>
            ))}
          </Grid>
        </Section>

        {/* Announcement */}
        <Section title="Announcement bar">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.announcement.enabled} onChange={(e) => setGroup('announcement', 'enabled', e.target.checked)} />
            Show announcement bar
          </label>
          <Field label="Messages (one per line)" className="mt-4">
            <textarea
              value={(form.announcement.messages || []).join('\n')}
              onChange={(e) => setGroup('announcement', 'messages', e.target.value.split('\n').map((m) => m.trim()).filter(Boolean))}
              rows={4}
              className={areaCls}
            />
          </Field>
        </Section>

        {/* Shipping */}
        <Section title="Shipping">
          <Grid>
            <Field label="Free shipping over (₹)"><Input type="number" value={form.shipping.freeThreshold} onChange={(e) => setGroup('shipping', 'freeThreshold', e.target.value)} /></Field>
            <Field label="Flat shipping rate (₹)"><Input type="number" value={form.shipping.flatRate} onChange={(e) => setGroup('shipping', 'flatRate', e.target.value)} /></Field>
          </Grid>
        </Section>
      </div>

      <div className="mt-6">
        <Button type="submit" variant="primary" size="lg" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

const areaCls = 'w-full resize-y rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-gold';

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-hairline/60 bg-bone p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
