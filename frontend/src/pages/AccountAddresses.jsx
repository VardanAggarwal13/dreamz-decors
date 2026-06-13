import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

const empty = { label: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '', isDefault: false };

export default function AccountAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get('/account/addresses').then((res) => setAddresses(res.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditing({}); };
  const openEdit = (a) => { setForm({ ...empty, ...a }); setEditing(a); };
  const close = () => setEditing(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    for (const k of ['line1', 'city', 'state', 'pincode']) {
      if (!form[k]?.trim()) return toast.error('Please complete the address.');
    }
    setSaving(true);
    try {
      const res = editing._id
        ? await api.patch(`/account/addresses/${editing._id}`, form)
        : await api.post('/account/addresses', form);
      setAddresses(res.data || []);
      toast.success('Address saved');
      close();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm('Delete this address?')) return;
    const res = await api.delete(`/account/addresses/${a._id}`);
    setAddresses(res.data || []);
    toast.success('Address removed');
  };

  const makeDefault = async (a) => {
    const res = await api.patch(`/account/addresses/${a._id}`, { isDefault: true });
    setAddresses(res.data || []);
  };

  return (
    <div>
      <Seo title="My Addresses — DreamzDecor" canonical="/account/addresses" noIndex />

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Addresses</h1>
        <Button variant="primary" size="md" onClick={openNew} className="shrink-0 whitespace-nowrap">
          <FiPlus size={15} /> Add address
        </Button>
      </div>

      {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        ) : addresses.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-hairline/60 bg-bone px-6 py-14 text-center">
            <p className="text-sm text-ink-soft">No saved addresses yet.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={a._id} className="rounded-2xl border border-hairline/60 bg-bone p-5">
                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink">{a.label || 'Address'}</span>
                    {a.isDefault && (
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-deep">Default</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <button onClick={() => openEdit(a)} className="text-ink-soft hover:text-gold-deep" aria-label="Edit"><FiEdit2 size={15} /></button>
                    <button onClick={() => remove(a)} className="text-ink-soft hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink-soft">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                  {[a.city, a.state, a.pincode].filter(Boolean).join(', ')}<br />
                  {a.phone}
                </p>
                {!a.isDefault && (
                  <button onClick={() => makeDefault(a)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold-deep hover:underline">
                    <FiCheck size={12} /> Set as default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50" onClick={close} />
          <form onSubmit={save} className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-hairline/60 bg-bone-soft p-6">
            <button type="button" onClick={close} className="absolute right-4 top-4 text-ink-muted hover:text-ink"><FiX size={18} /></button>
            <h2 className="font-display text-xl text-ink">{editing._id ? 'Edit' : 'Add'} address</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Label" full><Input value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="Home, Office…" /></Field>
              <Field label="Address line 1" full><Input value={form.line1} onChange={(e) => set('line1', e.target.value)} /></Field>
              <Field label="Address line 2" full><Input value={form.line2} onChange={(e) => set('line2', e.target.value)} /></Field>
              <Field label="City"><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
              <Field label="State"><Input value={form.state} onChange={(e) => set('state', e.target.value)} /></Field>
              <Field label="Pincode"><Input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} /> Set as default
            </label>
            <Button type="submit" variant="primary" size="lg" disabled={saving} className="mt-6 w-full">
              {saving ? 'Saving…' : 'Save address'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
