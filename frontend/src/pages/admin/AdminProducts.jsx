import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUploadCloud, FiEye } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import Modal, { ViewStat } from '@/components/admin/Modal';
import { AdminListSkeleton } from '@/components/admin/AdminSkeleton';
import { formatINR } from '@/lib/utils';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const empty = {
  title: '', slug: '', description: '', category: '', price: '', mrp: '',
  stock: 0, badge: '', tags: '', images: [], isActive: true, isFeatured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgLink, setImgLink] = useState('');
  const fileRef = useRef(null);
  useBodyScrollLock(!!editing); // view modal manages its own lock via <Modal/>

  const load = () =>
    api.get('/admin/products?limit=100').then((res) => setProducts(res.data || [])).finally(() => setLoading(false));
  useEffect(() => {
    load();
    api.get('/admin/categories').then((res) => setCats(res.data || []));
  }, []);

  const openNew = () => { setForm(empty); setEditing({}); };
  const openEdit = (p) => {
    setForm({
      ...empty,
      ...p,
      category: p.category?._id || p.category || '',
      tags: (p.tags || []).join(', '),
      images: p.images || [],
    });
    setEditing(p);
  };
  const close = () => setEditing(null);
  const editFromView = (p) => { setViewing(null); openEdit(p); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/uploads/single', fd);
      set('images', [...form.images, res.data]);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (idx) => set('images', form.images.filter((_, i) => i !== idx));

  // Add an image by pasting a direct link (no upload needed).
  const addImageLink = () => {
    const v = imgLink.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) {
      toast.error('Enter a valid link starting with http:// or https://');
      return;
    }
    set('images', [...form.images, { url: v }]);
    setImgLink('');
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) return toast.error('Title and price are required');
    const payload = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description,
      category: form.category || undefined,
      price: Number(form.price),
      mrp: form.mrp ? Number(form.mrp) : undefined,
      stock: Number(form.stock) || 0,
      badge: form.badge || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      images: form.images,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };
    setSaving(true);
    try {
      if (editing._id) await api.patch(`/products/${editing._id}`, payload);
      else await api.post('/products', payload);
      toast.success('Product saved');
      close();
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast.success('Product deleted');
      setViewing(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <Seo title="Admin — Products" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Products</h1>
        <Button variant="primary" size="md" onClick={openNew}><FiPlus size={15} /> New product</Button>
      </div>

      {loading ? <AdminListSkeleton cols={6} /> : (<>
      {/* Mobile / tablet: cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {products.map((p) => (
          <div key={p._id} className="rounded-2xl border border-hairline/60 bg-bone p-4">
            <button type="button" onClick={() => setViewing(p)} className="flex w-full items-start gap-3 text-left">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-hairline bg-bone-muted">
                {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink line-clamp-2">{p.title}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">{p.category?.title || 'Uncategorised'}</span>
              </span>
            </button>
            <div className="mt-3 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium text-ink">{formatINR(p.price)}</span>
              <span className="text-xs text-ink-soft">Stock: {p.stock ?? 0}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${p.isActive ? 'bg-gold/15 text-gold-deep' : 'bg-bone-muted text-ink-muted'}`}>
                {p.isActive ? 'Active' : 'Hidden'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-hairline/50 pt-3">
              <button onClick={() => setViewing(p)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-ink" aria-label="View"><FiEye size={15} /></button>
              <button onClick={() => openEdit(p)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-gold-deep" aria-label="Edit"><FiEdit2 size={15} /></button>
              <button onClick={() => remove(p)} className="rounded-lg border border-hairline bg-bone-soft px-3 py-1.5 text-ink-soft transition hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="col-span-full rounded-2xl border border-hairline/60 bg-bone py-10 text-center text-ink-muted">No products yet.</p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-hairline/60 bg-bone lg:block">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-hairline/40 last:border-0">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setViewing(p)} className="group flex items-center gap-3 text-left">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-bone-muted">
                      {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="font-medium text-ink line-clamp-1 group-hover:text-gold-deep">{p.title}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-ink-soft">{p.category?.title || '—'}</td>
                <td className="px-4 py-3 text-ink">{formatINR(p.price)}</td>
                <td className="px-4 py-3 text-ink-soft">{p.stock ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${p.isActive ? 'bg-gold/15 text-gold-deep' : 'bg-bone-muted text-ink-muted'}`}>
                    {p.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2.5">
                    <button onClick={() => setViewing(p)} className="text-ink-soft hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                    <button onClick={() => openEdit(p)} className="text-ink-soft hover:text-gold-deep" aria-label="Edit"><FiEdit2 size={15} /></button>
                    <button onClick={() => remove(p)} className="text-ink-soft hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-ink-muted">No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
      </>)}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-ink/50" onClick={close} />
          <form onSubmit={save} className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-hairline/60 bg-bone-soft">
            {/* Header (stays fixed) */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline/60 px-5 py-4 sm:px-6">
              <h2 className="font-display text-lg text-ink sm:text-xl">{editing._id ? 'Edit' : 'New'} product</h2>
              <button type="button" onClick={close} className="text-ink-muted transition hover:text-ink" aria-label="Close"><FiX size={18} /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Title" full><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Product title" /></Field>
              <Field label="Slug (auto if blank)"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(form.title)} /></Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-gold">
                  <option value="">— none —</option>
                  {cats.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </Field>
              <Field label="Price (₹)"><Input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" /></Field>
              <Field label="MRP (₹)"><Input type="number" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} placeholder="0" /></Field>
              <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} /></Field>
              <Field label="Badge (NEW / BEST / LTD)"><Input value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="optional" /></Field>
              <Field label="Tags (comma separated)" full><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="abstract, gold, canvas" /></Field>
              <Field label="Description" full>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-gold" placeholder="Product description" />
              </Field>
            </div>

            {/* Images */}
            <div className="mt-4">
              <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Images</span>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-hairline">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-bone"><FiX size={11} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-hairline text-ink-muted hover:border-gold hover:text-gold-deep">
                  <FiUploadCloud size={18} />
                  <span className="text-[10px]">{uploading ? '…' : 'Upload'}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
              </div>
              {/* Or add by direct link */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  value={imgLink}
                  onChange={(e) => setImgLink(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageLink(); } }}
                  placeholder="or paste an image link…"
                  className="min-w-0 flex-1 rounded-lg border border-hairline bg-bone-soft px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none transition focus:border-gold"
                />
                <button type="button" onClick={addImageLink} className="shrink-0 rounded-lg border border-hairline bg-bone px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft transition hover:border-gold/50 hover:text-gold-deep">
                  Add
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Featured</label>
            </div>
            </div>

            {/* Footer (stays fixed) */}
            <div className="shrink-0 border-t border-hairline/60 px-5 py-4 sm:px-6">
              <Button type="submit" variant="primary" size="lg" disabled={saving} className="w-full">
                {saving ? 'Saving…' : 'Save product'}
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
        subtitle={viewing && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${viewing.isActive ? 'bg-gold/15 text-gold-deep' : 'bg-bone-muted text-ink-muted'}`}>
              {viewing.isActive ? 'Active' : 'Hidden'}
            </span>
            {viewing.isFeatured && <span className="rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-soft">Featured</span>}
            {viewing.badge && <span className="rounded-full border border-hairline px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-soft">{viewing.badge}</span>}
          </div>
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
            {viewing.images?.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {viewing.images.map((img, i) => (
                  <div key={i} className="h-24 w-24 overflow-hidden rounded-lg border border-hairline bg-bone-muted">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ViewStat label="Price" value={formatINR(viewing.price)} />
              <ViewStat label="MRP" value={viewing.mrp ? formatINR(viewing.mrp) : '—'} />
              <ViewStat label="Stock" value={viewing.stock ?? 0} />
              <ViewStat label="Category" value={viewing.category?.title || '—'} />
            </div>

            {viewing.tags?.length > 0 && (
              <div>
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {viewing.tags.map((t) => (
                    <span key={t} className="rounded-full border border-hairline bg-bone px-2.5 py-1 text-xs text-ink-soft">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {viewing.description && (
              <div>
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Description</span>
                <p className="text-sm leading-6 text-ink-soft">{viewing.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
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
