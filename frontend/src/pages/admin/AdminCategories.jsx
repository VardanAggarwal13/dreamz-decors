import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiEye } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import Modal, { ViewStat } from '@/components/admin/Modal';
import ImageInput from '@/components/admin/ImageInput';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const empty = { title: '', slug: '', blurb: '', image: '', order: 0, isActive: true };

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  useBodyScrollLock(!!editing); // view modal manages its own lock via <Modal/>

  const load = () => api.get('/admin/categories').then((res) => setCats(res.data || []));
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(empty); setEditing({}); };
  const openEdit = (c) => { setForm({ ...empty, ...c }); setEditing(c); };
  const editFromView = (c) => { setViewing(null); openEdit(c); };
  const close = () => setEditing(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || slugify(form.title), order: Number(form.order) || 0 };
    if (!payload.title) return toast.error('Title is required');
    setSaving(true);
    try {
      if (editing._id) await api.patch(`/categories/${editing._id}`, payload);
      else await api.post('/categories', payload);
      toast.success('Category saved');
      close();
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.title}"?`)) return;
    try {
      await api.delete(`/categories/${c._id}`);
      toast.success('Category deleted');
      setViewing(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <Seo title="Admin — Categories" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Categories</h1>
        <Button variant="primary" size="md" onClick={openNew}><FiPlus size={15} /> New category</Button>
      </div>

      {/* Mobile / tablet: cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {cats.map((c) => (
          <div key={c._id} className="rounded-2xl border border-hairline/60 bg-bone p-4">
            <button type="button" onClick={() => setViewing(c)} className="flex w-full items-start gap-3 text-left">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-hairline bg-bone-muted">
                {(c.image?.url || c.image) && <img src={c.image?.url || c.image} alt="" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink line-clamp-1">{c.title}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-muted">/{c.slug}</span>
              </span>
            </button>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline/50 pt-3">
              <span className="text-xs text-ink-soft">Order: {c.order ?? 0} · {c.isActive ? 'Active' : 'Hidden'}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setViewing(c)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                <button onClick={() => openEdit(c)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-gold-deep" aria-label="Edit"><FiEdit2 size={15} /></button>
                <button onClick={() => remove(c)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
        {cats.length === 0 && (
          <p className="col-span-full rounded-2xl border border-hairline/60 bg-bone py-10 text-center text-ink-muted">No categories yet.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-hairline/60 bg-bone lg:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c._id} className="border-b border-hairline/40 last:border-0">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setViewing(c)} className="font-medium text-ink hover:text-gold-deep">{c.title}</button>
                </td>
                <td className="px-4 py-3 text-ink-muted">{c.slug}</td>
                <td className="px-4 py-3 text-ink-soft">{c.order ?? 0}</td>
                <td className="px-4 py-3">{c.isActive ? '✓' : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2.5">
                    <button onClick={() => setViewing(c)} className="text-ink-soft hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                    <button onClick={() => openEdit(c)} className="text-ink-soft hover:text-gold-deep" aria-label="Edit"><FiEdit2 size={15} /></button>
                    <button onClick={() => remove(c)} className="text-ink-soft hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-ink-muted">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-ink/50" onClick={close} />
          <form onSubmit={save} className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-hairline/60 bg-bone-soft">
            {/* Header (stays fixed) */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline/60 px-5 py-4 sm:px-6">
              <h2 className="font-display text-lg text-ink sm:text-xl">{editing._id ? 'Edit' : 'New'} category</h2>
              <button type="button" onClick={close} className="text-ink-muted transition hover:text-ink" aria-label="Close"><FiX size={18} /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
              <Field label="Title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Wall Art" /></Field>
              <Field label="Slug (auto if blank)"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.title) || 'wall-art'} /></Field>
              <Field label="Blurb"><Input value={form.blurb} onChange={(e) => set('blurb', e.target.value)} placeholder="Short description" /></Field>
              <ImageInput label="Image" value={form.image} onChange={(url) => set('image', url)} hint="Upload a file or paste an image link." />
              <div className="flex items-center gap-4">
                <Field label="Order"><Input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} className="w-24" /></Field>
                <label className="mt-6 flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active
                </label>
              </div>
            </div>

            {/* Footer (stays fixed) */}
            <div className="shrink-0 border-t border-hairline/60 px-5 py-4 sm:px-6">
              <Button type="submit" variant="primary" size="lg" disabled={saving} className="w-full">
                {saving ? 'Saving…' : 'Save category'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* View modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.title}
        maxWidth="max-w-lg"
        subtitle={viewing && (
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${viewing.isActive ? 'bg-gold/15 text-gold-deep' : 'bg-bone-muted text-ink-muted'}`}>
            {viewing.isActive ? 'Active' : 'Hidden'}
          </span>
        )}
        footer={viewing && (
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" className="flex-1" onClick={() => editFromView(viewing)}>
              <FiEdit2 size={15} /> Edit
            </Button>
            <Button variant="outline" size="md" className="flex-1 border-sale/40 text-sale hover:bg-sale/5" onClick={() => remove(viewing)}>
              <FiTrash2 size={15} /> Delete
            </Button>
          </div>
        )}
      >
        {viewing && (
          <div className="space-y-5">
            {viewing.image && (
              <div className="h-40 w-full overflow-hidden rounded-xl border border-hairline bg-bone-muted">
                <img src={viewing.image} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <ViewStat label="Slug" value={viewing.slug || '—'} />
              <ViewStat label="Sort order" value={viewing.order ?? 0} />
            </div>
            {viewing.blurb && (
              <div>
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Blurb</span>
                <p className="text-sm leading-6 text-ink-soft">{viewing.blurb}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
