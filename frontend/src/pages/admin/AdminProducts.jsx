import { useEffect, useRef, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUploadCloud, FiEye, FiHelpCircle, FiLayers, FiCopy, FiList, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'sonner';
import Seo from '@/components/common/Seo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import useAdminList from '@/hooks/useAdminList';
import Modal, { ViewStat } from '@/components/admin/Modal';
import { AdminListSkeleton } from '@/components/admin/AdminSkeleton';
import AdminSearch from '@/components/admin/AdminSearch';
import AdminPagination from '@/components/admin/AdminPagination';
import DimensionGuideModal from '@/components/admin/DimensionGuideModal';
import { formatINR } from '@/lib/utils';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const PRESET_FRAMES = [
  'Without Frame',
  'Black / White Frame',
  'Antique Frame',
  'Stretched Frame',
];

const empty = {
  title: '', slug: '', description: '', category: '', price: '', mrp: '',
  stock: 10, badge: '', tags: '', images: [], isActive: true, isFeatured: false,
  frameOptions: ['Without Frame', 'Black / White Frame', 'Antique Frame', 'Stretched Frame'],
  variants: [{ size: '18x36', frame: 'Without Frame', price: '', mrp: '', stock: 10 }],
};

const SUGGESTED_SIZES = ['18x36', '24x24', '12x18', '20x30', '24x36', '30x40'];

export default function AdminProducts() {
  const [q, setQ] = useState('');
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgLink, setImgLink] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [newFrameName, setNewFrameName] = useState('');
  const [matrixViewMode, setMatrixViewMode] = useState('cards'); // 'cards' | 'flat'
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetFrame, setCopyTargetFrame] = useState('');
  const [copySourceFrame, setCopySourceFrame] = useState('');
  const [copyPriceMarkup, setCopyPriceMarkup] = useState('');
  const [collapsedFrames, setCollapsedFrames] = useState({});
  const fileRef = useRef(null);
  useBodyScrollLock(!!editing); // view modal manages its own lock via <Modal/>

  // Server-side pagination + search (by name / slug / badge / tag).
  const makePath = ({ page, limit }) => {
    const sp = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q.trim()) sp.set('q', q.trim());
    return `/admin/products?${sp.toString()}`;
  };
  const { items: products, meta, loading, goTo, reload } = useAdminList(makePath, [q], { limit: 12 });

  // Categories for the form's dropdown — fetch all (high limit) just once.
  useEffect(() => {
    api.get('/admin/categories?limit=100').then((res) => setCats(res.data || []));
  }, []);

  const openNew = () => {
    setForm({
      ...empty,
      frameOptions: [...PRESET_FRAMES],
      variants: [{ size: '18x36', frame: 'Without Frame', price: '', mrp: '', stock: 10 }],
    });
    setMatrixViewMode('cards');
    setCopyModalOpen(false);
    setCollapsedFrames({});
    setEditing({});
  };

  const openEdit = (p) => {
    const existingFrames = [
      ...new Set([
        ...(p.frameOptions || []),
        ...(p.variants || []).map((v) => v.frame).filter(Boolean),
      ]),
    ];
    const initialFrameOptions = existingFrames.length > 0 ? existingFrames : [...PRESET_FRAMES];

    const initialVariants = (p.variants && p.variants.length > 0)
      ? p.variants.map((v) => ({
          size: v.size || '',
          frame: v.frame || '',
          price: v.price != null ? v.price : '',
          mrp: v.mrp != null ? v.mrp : '',
          stock: v.stock != null ? v.stock : 10,
        }))
      : [{ size: '18x36', frame: 'Without Frame', price: p.price != null ? p.price : '', mrp: p.mrp != null ? p.mrp : '', stock: p.stock ?? 10 }];

    setForm({
      ...empty,
      ...p,
      frameOptions: initialFrameOptions,
      price: p.price != null ? p.price : (initialVariants[0]?.price || ''),
      mrp: p.mrp != null ? p.mrp : (initialVariants[0]?.mrp || ''),
      category: p.category?._id || p.category || '',
      tags: (p.tags || []).join(', '),
      images: p.images || [],
      variants: initialVariants,
    });
    setMatrixViewMode('cards');
    setCopyModalOpen(false);
    setCollapsedFrames({});
    setEditing(p);
  };

  const close = () => setEditing(null);
  const editFromView = (p) => { setViewing(null); openEdit(p); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCollapseFrame = (frameName) => {
    setCollapsedFrames((prev) => ({
      ...prev,
      [frameName]: !prev[frameName],
    }));
  };

  const addFrameOption = (frameName) => {
    const trimmed = String(frameName || newFrameName).trim();
    if (!trimmed) return;
    if ((form.frameOptions || []).some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      toast.info(`Frame "${trimmed}" is already enabled.`);
      return;
    }
    setForm((f) => ({
      ...f,
      frameOptions: [...(f.frameOptions || []), trimmed],
    }));
    setNewFrameName('');
    toast.success(`Frame "${trimmed}" enabled. You can now add sizes for it below.`);
  };

  const removeFrameWithConfirmation = (frameName) => {
    if ((form.frameOptions || []).length <= 1) {
      toast.info('At least one framing option is required for a product.');
      return;
    }
    const matchingVariants = (form.variants || []).filter(
      (v) => (v.frame || '').toLowerCase() === frameName.toLowerCase()
    );
    const count = matchingVariants.length;
    const msg = count > 0
      ? `Remove frame "${frameName}" and its ${count} size variant(s)?`
      : `Remove frame "${frameName}" from framing options?`;
    if (!window.confirm(msg)) return;

    setForm((f) => {
      const nextFrames = (f.frameOptions || []).filter((fr) => fr.toLowerCase() !== frameName.toLowerCase());
      const nextVariants = f.variants.filter((v) => (v.frame || '').toLowerCase() !== frameName.toLowerCase());
      const finalVariants = nextVariants.length > 0
        ? nextVariants
        : [{ size: '18x36', frame: nextFrames[0] || 'Without Frame', price: '', mrp: '', stock: 10 }];


      return {
        ...f,
        frameOptions: nextFrames,
        variants: finalVariants,
      };
    });
    toast.success(`Removed "${frameName}"`);
  };

  const toggleFrameOption = (frameName) => {
    const isEnabled = (form.frameOptions || []).some(
      (f) => f.toLowerCase() === frameName.toLowerCase()
    );
    if (isEnabled) {
      removeFrameWithConfirmation(frameName);
    } else {
      addFrameOption(frameName);
    }
  };

  const openCopyModalForFrame = (targetFrame) => {
    setCopyTargetFrame(targetFrame);
    const possibleSources = (form.frameOptions || []).filter(
      (fr) =>
        fr.toLowerCase() !== targetFrame.toLowerCase() &&
        form.variants.some((v) => (v.frame || '').toLowerCase() === fr.toLowerCase())
    );
    setCopySourceFrame(possibleSources[0] || '');
    setCopyPriceMarkup('');
    setCopyModalOpen(true);
  };

  const copySizesToAllEmptyFrames = (markup = 500) => {
    const sourceFrame = (form.frameOptions || []).find((fr) =>
      form.variants.some((v) => (v.frame || '').toLowerCase() === fr.toLowerCase())
    );
    if (!sourceFrame) {
      toast.info('Please configure sizes for at least one frame first.');
      return;
    }
    const sourceVariants = form.variants.filter(
      (v) => (v.frame || '').toLowerCase() === sourceFrame.toLowerCase()
    );

    const emptyFrames = (form.frameOptions || []).filter(
      (fr) =>
        fr.toLowerCase() !== sourceFrame.toLowerCase() &&
        !form.variants.some((v) => (v.frame || '').toLowerCase() === fr.toLowerCase())
    );

    if (emptyFrames.length === 0) {
      toast.info('All enabled frames already have sizes configured.');
      return;
    }

    const numMarkup = Number(markup) || 0;
    const newVariants = [...form.variants];

    emptyFrames.forEach((targetFrame) => {
      sourceVariants.forEach((v) => {
        const newPrice = v.price !== '' ? Math.max(0, Number(v.price) + numMarkup) : '';
        const newMrp = v.mrp !== '' ? Math.max(0, Number(v.mrp) + numMarkup) : '';
        newVariants.push({
          size: v.size,
          frame: targetFrame,
          price: newPrice,
          mrp: newMrp,
          stock: v.stock != null ? v.stock : 10,
        });
      });
    });

    setForm((f) => ({ ...f, variants: newVariants }));
    toast.success(`Copied sizes from "${sourceFrame}" to ${emptyFrames.length} empty frame(s)${numMarkup ? ` (+₹${numMarkup} markup)` : ''}!`);
  };

  const addSizeToFrame = (frameName, presetSize = '') => {
    const targetFrame = frameName || form.frameOptions?.[0] || 'Without Frame';
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { size: presetSize || '', frame: targetFrame, price: '', mrp: '', stock: 10 },
      ],
    }));
  };

  const copySizesFromFrame = (sourceFrame, targetFrame, markup = 0) => {
    if (!sourceFrame || !targetFrame || sourceFrame === targetFrame) {
      toast.info('Please select a different source frame to copy from.');
      return;
    }
    const numMarkup = Number(markup) || 0;

    setForm((f) => {
      const sourceVariants = f.variants.filter(
        (v) => (v.frame || '').toLowerCase() === sourceFrame.toLowerCase()
      );
      if (sourceVariants.length === 0) {
        toast.info(`No sizes found in "${sourceFrame}" to copy.`);
        return f;
      }

      const existingInTarget = new Set(
        f.variants
          .filter((v) => (v.frame || '').toLowerCase() === targetFrame.toLowerCase())
          .map((v) => (v.size || '').toLowerCase().trim())
      );

      const added = [];
      sourceVariants.forEach((v) => {
        const sKey = (v.size || '').toLowerCase().trim();
        if (!existingInTarget.has(sKey)) {
          const newPrice = v.price !== '' ? Math.max(0, Number(v.price) + numMarkup) : '';
          const newMrp = v.mrp !== '' ? Math.max(0, Number(v.mrp) + numMarkup) : '';
          added.push({
            size: v.size,
            frame: targetFrame,
            price: newPrice,
            mrp: newMrp,
            stock: v.stock != null ? v.stock : 10,
          });
        }
      });

      if (added.length === 0) {
        toast.info(`All sizes from "${sourceFrame}" already exist in "${targetFrame}".`);
        return f;
      }

      toast.success(`Copied ${added.length} size(s) from "${sourceFrame}" to "${targetFrame}"${numMarkup ? ` (+₹${numMarkup})` : ''}`);
      return {
        ...f,
        variants: [...f.variants, ...added],
      };
    });
    setCopyModalOpen(false);
    setCopyPriceMarkup('');
  };

  const addVariantRow = (presetSize = '', defaultFrame = '') => {
    setForm((f) => {
      const chosenFrame = defaultFrame || (f.frameOptions && f.frameOptions[0]) || 'Without Frame';
      return {
        ...f,
        variants: [
          ...f.variants,
          { size: presetSize || '', frame: chosenFrame, price: '', mrp: '', stock: 10 },
        ],
      };
    });
  };

  const updateVariantRow = (idx, field, val) => {
    setForm((f) => {
      const updated = [...f.variants];
      updated[idx] = { ...updated[idx], [field]: val };
      const nextForm = { ...f, variants: updated };
      if (idx === 0) {
        if (field === 'price') nextForm.price = val;
        if (field === 'mrp') nextForm.mrp = val;
      }
      return nextForm;
    });
  };

  const removeVariantRow = (idx) => {
    setForm((f) => {
      if (f.variants.length <= 1) {
        toast.info('At least one size variant is required');
        return f;
      }
      const updated = f.variants.filter((_, i) => i !== idx);
      const nextForm = { ...f, variants: updated };
      if (updated[0]) {
        if (updated[0].price) nextForm.price = updated[0].price;
        if (updated[0].mrp) nextForm.mrp = updated[0].mrp;
      }
      return nextForm;
    });
  };

  const onUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      const fileNames = oversized.map((f) => `"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)}MB)`).join(', ');
      toast.error(`Image limit is 10MB to save storage. Please choose images under 10MB: ${fileNames}`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploading(true);

    const toastId = toast.loading(
      files.length === 1 ? 'Uploading image…' : `Uploading ${files.length} images…`
    );

    try {
      if (files.length === 1) {
        const fd = new FormData();
        fd.append('image', files[0]);
        const res = await api.post('/uploads/single', fd, { timeout: 60000 });
        const uploaded = res.data;
        setForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), uploaded],
        }));
        toast.success('Image uploaded successfully!', { id: toastId });
      } else {
        const BATCH_SIZE = 10;
        const allUploaded = [];

        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE);
          const fd = new FormData();
          batch.forEach((file) => fd.append('images', file));
          const res = await api.post('/uploads/multiple', fd, { timeout: 120000 });
          const batchUploaded = Array.isArray(res.data) ? res.data : [res.data];
          allUploaded.push(...batchUploaded);
        }

        setForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), ...allUploaded],
        }));
        toast.success(`${allUploaded.length} images added successfully!`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed. Please check image format/size and retry.', { id: toastId });
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
    if (!form.title) return toast.error('Title is required');

    const cleanedVariants = (form.variants || [])
      .filter((v) => v && (v.size?.trim() || v.frame?.trim() || v.price !== ''))
      .map((v) => ({
        size: String(v.size || '').trim(),
        frame: String(v.frame || '').trim(),
        price: Number(v.price) || 0,
        mrp: v.mrp !== '' && v.mrp != null ? Number(v.mrp) : undefined,
        stock: Number(v.stock) || 0,
      }));

    const basePrice = cleanedVariants.length > 0 && cleanedVariants[0].price > 0
      ? cleanedVariants[0].price
      : Number(form.price);

    if (!basePrice || basePrice <= 0) {
      return toast.error('Please enter a valid price for at least one size');
    }

    const baseMrp = cleanedVariants.length > 0 && cleanedVariants[0].mrp
      ? cleanedVariants[0].mrp
      : (form.mrp ? Number(form.mrp) : undefined);

    const baseStock = cleanedVariants.length > 0
      ? cleanedVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : (Number(form.stock) || 0);

    const payload = {
      title: form.title,
      slug: slugify(form.slug || form.title),
      description: form.description,
      category: form.category || undefined,
      price: basePrice,
      mrp: baseMrp,
      stock: baseStock,
      badge: form.badge || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      images: form.images,
      frameOptions: (form.frameOptions || []).map((f) => String(f).trim()).filter(Boolean),
      variants: cleanedVariants,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };
    setSaving(true);
    try {
      if (editing._id) await api.patch(`/products/${editing._id}`, payload);
      else await api.post('/products', payload);
      toast.success('Product saved');
      close();
      reload();
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
      reload();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <Seo title="Admin — Products" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Products</h1>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <AdminSearch value={q} onChange={setQ} placeholder="Search by name, slug, tag…" className="flex-1 sm:w-80 sm:flex-none" />
          <Button variant="primary" size="md" onClick={openNew}><FiPlus size={15} /> New product</Button>
        </div>
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
          <p className="col-span-full rounded-2xl border border-hairline/60 bg-bone py-10 text-center text-ink-muted">
            {q ? `No products match “${q}”.` : 'No products yet.'}
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-hairline/60 bg-bone lg:block">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-hairline/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Actions</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-hairline/40 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setViewing(p)} className="text-ink-soft hover:text-ink" aria-label="View"><FiEye size={15} /></button>
                    <button onClick={() => openEdit(p)} className="text-ink-soft hover:text-gold-deep" aria-label="Edit"><FiEdit2 size={15} /></button>
                    <button onClick={() => remove(p)} className="text-ink-soft hover:text-sale" aria-label="Delete"><FiTrash2 size={15} /></button>
                  </div>
                </td>
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
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-ink-muted">{q ? `No products match “${q}”.` : 'No products yet.'}</td></tr>}
          </tbody>
        </table>
      </div>

      <AdminPagination page={meta.page} pages={meta.pages} total={meta.total} limit={meta.limit} onPage={goTo} />
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
              <Field label="Category" full>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-gold">
                  <option value="">— none —</option>
                  {cats.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </Field>
              <Field label="Badge (NEW / BEST / LTD)"><Input value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="optional" /></Field>
              <Field label="Tags (comma separated)"><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="abstract, gold, canvas" /></Field>
              <Field label="Description" full>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none focus:border-gold" placeholder="Product description" />
              </Field>
            </div>

            {/* ── Frame-First Pricing & Size Manager (Multi-Frame Stacked Cards) ──── */}
            {(() => {
              const enabledFrames = form.frameOptions || [];
              const allAvailableFrames = [
                ...PRESET_FRAMES,
                ...enabledFrames.filter((f) => !PRESET_FRAMES.includes(f)),
              ];

              const framesWithSizes = enabledFrames.filter((fr) =>
                form.variants.some((v) => (v.frame || '').toLowerCase() === fr.toLowerCase())
              );

              const emptyFrames = enabledFrames.filter(
                (fr) => !form.variants.some((v) => (v.frame || '').toLowerCase() === fr.toLowerCase())
              );

              const firstFrameWithSizes = framesWithSizes[0] || '';

              const activeTargetForModal = copyTargetFrame || (emptyFrames[0] || enabledFrames[0] || '');
              const possibleSourcesForModal = enabledFrames.filter(
                (fr) =>
                  fr.toLowerCase() !== activeTargetForModal.toLowerCase() &&
                  form.variants.some((v) => (v.frame || '').toLowerCase() === fr.toLowerCase())
              );
              const selectedSourceForModal =
                copySourceFrame && possibleSourcesForModal.includes(copySourceFrame)
                  ? copySourceFrame
                  : possibleSourcesForModal[0] || '';

              const sourceVariantsForModal = selectedSourceForModal
                ? form.variants.filter((v) => (v.frame || '').toLowerCase() === selectedSourceForModal.toLowerCase())
                : [];

              return (
                <div className="mt-5 rounded-2xl border border-gold/40 bg-gradient-to-b from-gold/[0.05] via-bone-soft to-bone p-4 sm:p-5 shadow-xs">
                  {/* Top Bar: Section Title + Master View Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="block text-[12px] font-bold uppercase tracking-[0.16em] text-ink">
                          🖼️ Frame &amp; Size Pricing Manager
                        </span>
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-deep">
                          Admin Authority
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Select multiple frames for this product below. Each selected frame gets its own dedicated size &amp; pricing card.
                      </p>
                    </div>

                    {/* View Switcher: Stacked Frame Cards vs Flat Master Table */}
                    <div className="flex items-center rounded-xl border border-hairline bg-bone-muted p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setMatrixViewMode('cards')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          matrixViewMode === 'cards'
                            ? 'bg-white text-ink shadow-xs'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        <FiLayers size={13} className={matrixViewMode === 'cards' ? 'text-gold-deep' : ''} />
                        Frame Cards ({enabledFrames.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatrixViewMode('flat')}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          matrixViewMode === 'flat'
                            ? 'bg-white text-ink shadow-xs'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        <FiList size={13} className={matrixViewMode === 'flat' ? 'text-gold-deep' : ''} />
                        All Sizes Table ({form.variants.length})
                      </button>
                    </div>
                  </div>

                  {/* Multi-Select Framing Options Checkboxes */}
                  <div className="mt-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                        Select Frames Available for this Product (Check Multiple):
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {enabledFrames.length} selected · {form.variants.length} total size variants
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {allAvailableFrames.map((fr) => {
                        const isChecked = enabledFrames.includes(fr);
                        const isPreset = PRESET_FRAMES.includes(fr);
                        const count = form.variants.filter(
                          (v) => (v.frame || '').toLowerCase() === fr.toLowerCase()
                        ).length;

                        return (
                          <label
                            key={fr}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition select-none ${
                              isChecked
                                ? 'border-gold bg-gold/15 text-ink font-semibold shadow-xs ring-1 ring-gold/40'
                                : 'border-hairline bg-white/90 text-ink-muted hover:border-gold/50 hover:bg-gold/5 hover:text-ink'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFrameOption(fr)}
                              className="h-4 w-4 rounded border-hairline accent-gold cursor-pointer"
                            />
                            <span>{fr}</span>
                            {isChecked && (
                              <span className="rounded-full bg-gold/30 px-2 py-0.2 text-[10px] font-bold text-gold-deep">
                                {count} {count === 1 ? 'size' : 'sizes'}
                              </span>
                            )}
                            {!isPreset && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeFrameWithConfirmation(fr);
                                }}
                                className="rounded p-0.5 text-ink-muted hover:text-sale"
                                title={`Delete custom frame ${fr}`}
                              >
                                <FiX size={12} />
                              </button>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {/* Add Custom Frame Option Input */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="flex flex-1 items-center gap-1.5 min-w-[260px]">
                        <input
                          value={newFrameName}
                          onChange={(e) => setNewFrameName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addFrameOption(newFrameName);
                            }
                          }}
                          placeholder="Add custom frame finish (e.g. Floater Frame, Champagne Gold)..."
                          className="min-w-0 flex-1 rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-gold"
                        />
                        <button
                          type="button"
                          onClick={() => addFrameOption(newFrameName)}
                          className="shrink-0 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold-deep transition hover:bg-gold/25 active:scale-95"
                        >
                          + Add Frame
                        </button>
                      </div>

                      {/* Expand / Collapse All */}
                      {enabledFrames.length > 1 && matrixViewMode === 'cards' && (
                        <button
                          type="button"
                          onClick={() => {
                            const allAreCollapsed = enabledFrames.every((fr) => collapsedFrames[fr]);
                            const next = {};
                            if (!allAreCollapsed) {
                              enabledFrames.forEach((fr) => { next[fr] = true; });
                            }
                            setCollapsedFrames(next);
                          }}
                          className="text-[11px] font-medium text-ink-muted hover:text-gold-deep transition underline"
                        >
                          {enabledFrames.every((fr) => collapsedFrames[fr]) ? 'Expand All Cards' : 'Collapse All Cards'}
                        </button>
                      )}
                    </div>

                    {/* Quick-fill helper banner if some frames have 0 sizes */}
                    {emptyFrames.length > 0 && firstFrameWithSizes && matrixViewMode === 'cards' && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/40 bg-gold/10 p-2.5 sm:p-3 text-xs">
                        <div className="flex items-center gap-2 text-ink">
                          <span className="text-sm font-bold">⚡ Quick Fill:</span>
                          <span className="text-[11px] sm:text-xs">
                            You have <strong>{emptyFrames.length}</strong> empty frame(s). Clone all sizes from <strong>{firstFrameWithSizes}</strong>?
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copySizesToAllEmptyFrames(500)}
                            className="rounded-lg border border-gold bg-gold px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-gold-light active:scale-95 shadow-2xs"
                          >
                            Copy All (+₹500 markup)
                          </button>
                          <button
                            type="button"
                            onClick={() => copySizesToAllEmptyFrames(0)}
                            className="rounded-lg border border-hairline bg-white px-2 py-1 text-[11px] font-semibold text-ink hover:border-gold active:scale-95"
                          >
                            Copy Exact (+₹0)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Mode 1: STACKED MULTI-FRAME CARDS ──── */}
                  {matrixViewMode === 'cards' && (
                    <div className="mt-4 space-y-3.5">
                      {enabledFrames.map((fr) => {
                        const isCollapsed = !!collapsedFrames[fr];
                        const frameVariants = (form.variants || [])
                          .map((v, originalIndex) => ({ ...v, originalIndex }))
                          .filter((v) => (v.frame || '').toLowerCase() === fr.toLowerCase());

                        const hasSizes = frameVariants.length > 0;
                        const otherFramesWithSizes = framesWithSizes.filter(
                          (other) => other.toLowerCase() !== fr.toLowerCase()
                        );

                        return (
                          <div
                            key={fr}
                            className={`rounded-xl border transition shadow-2xs ${
                              hasSizes
                                ? 'border-gold/35 bg-white'
                                : 'border-hairline/90 bg-bone-soft/80'
                            }`}
                          >
                            {/* Card Header Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 border-b border-hairline/50">
                              <div
                                onClick={() => toggleCollapseFrame(fr)}
                                className="flex items-center gap-2.5 cursor-pointer select-none"
                              >
                                <button
                                  type="button"
                                  className="text-ink-muted hover:text-ink transition"
                                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                                >
                                  {isCollapsed ? <FiChevronDown size={16} /> : <FiChevronUp size={16} />}
                                </button>
                                <span className="font-display text-sm font-semibold text-ink">
                                  🖼️ {fr}
                                </span>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                    hasSizes
                                      ? 'bg-gold/20 text-gold-deep'
                                      : 'bg-bone-muted text-ink-muted'
                                  }`}
                                >
                                  {frameVariants.length} {frameVariants.length === 1 ? 'Size' : 'Sizes'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {otherFramesWithSizes.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => openCopyModalForFrame(fr)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold-deep hover:bg-gold hover:text-ink transition active:scale-95"
                                    title="Copy sizes and prices from another frame into this frame"
                                  >
                                    <FiCopy size={12} />
                                    <span>Copy sizes</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isCollapsed) toggleCollapseFrame(fr);
                                    addSizeToFrame(fr);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-bone-soft px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-gold hover:text-gold-deep transition active:scale-95"
                                >
                                  <FiPlus size={12} /> Add Size
                                </button>
                              </div>
                            </div>

                            {/* Card Content (Sizes Table) */}
                            {!isCollapsed && (
                              <div className="p-3 sm:p-4">
                                {/* Quick Add Size Chips for this frame */}
                                <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                                  <span className="font-medium text-ink-muted">Quick add size:</span>
                                  {SUGGESTED_SIZES.map((sz) => {
                                    const alreadyExists = frameVariants.some(
                                      (v) => (v.size || '').toLowerCase().trim() === sz.toLowerCase().trim()
                                    );
                                    return (
                                      <button
                                        key={sz}
                                        type="button"
                                        onClick={() => addSizeToFrame(fr, sz)}
                                        disabled={alreadyExists}
                                        className={`rounded-lg border px-2 py-0.5 text-xs transition ${
                                          alreadyExists
                                            ? 'border-hairline bg-bone-muted text-ink-muted opacity-50 cursor-not-allowed'
                                            : 'border-hairline bg-bone-soft text-ink-soft hover:border-gold hover:text-gold-deep'
                                        }`}
                                        title={alreadyExists ? `Size ${sz}" already added to ${fr}` : `Add ${sz}" to ${fr}`}
                                      >
                                        {alreadyExists ? `✓ ${sz}"` : `+ ${sz}"`}
                                      </button>
                                    );
                                  })}
                                </div>

                                {hasSizes ? (
                                  <div className="space-y-2">
                                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-muted px-2.5 py-1">
                                      <span className="col-span-1">#</span>
                                      <span className="col-span-3">Size (Inches)</span>
                                      <span className="col-span-3">Selling Price (₹)</span>
                                      <span className="col-span-2">MRP (₹)</span>
                                      <span className="col-span-2 text-center">Stock</span>
                                      <span className="col-span-1 text-right">Delete</span>
                                    </div>

                                    {frameVariants.map((v, i) => (
                                      <div
                                        key={v.originalIndex}
                                        className={`flex flex-wrap items-center gap-2 rounded-xl border p-2.5 transition sm:grid sm:grid-cols-12 ${
                                          v.originalIndex === 0
                                            ? 'border-gold/50 bg-gold/[0.04]'
                                            : 'border-hairline/80 bg-bone-soft/60'
                                        }`}
                                      >
                                        {/* Order & Default Pill */}
                                        <div className="col-span-1 flex items-center gap-1">
                                          <span className="font-mono text-[11px] font-bold text-ink-muted">
                                            #{i + 1}
                                          </span>
                                          {v.originalIndex === 0 && (
                                            <span className="rounded bg-gold/20 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-gold-deep">
                                              Main
                                            </span>
                                          )}
                                        </div>

                                        {/* Size Input */}
                                        <div className="col-span-3 min-w-[95px] flex-1 sm:flex-initial">
                                          <span className="block sm:hidden text-[9px] uppercase font-bold text-ink-muted mb-0.5">Size</span>
                                          <input
                                            value={v.size}
                                            onChange={(e) => updateVariantRow(v.originalIndex, 'size', e.target.value)}
                                            placeholder="e.g. 18x36"
                                            className="w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs font-semibold text-ink placeholder:text-ink-muted outline-none focus:border-gold"
                                          />
                                        </div>

                                        {/* Selling Price (₹) */}
                                        <div className="col-span-3 min-w-[90px] flex-1 sm:flex-initial">
                                          <span className="block sm:hidden text-[9px] uppercase font-bold text-ink-muted mb-0.5">Price (₹)</span>
                                          <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gold-deep">₹</span>
                                            <input
                                              type="number"
                                              value={v.price}
                                              onChange={(e) => updateVariantRow(v.originalIndex, 'price', e.target.value)}
                                              placeholder="1600"
                                              className="w-full rounded-lg border border-hairline bg-white pl-6 pr-2 py-1.5 text-xs font-bold text-ink placeholder:text-ink-muted outline-none focus:border-gold"
                                            />
                                          </div>
                                        </div>

                                        {/* MRP (₹) */}
                                        <div className="col-span-2 min-w-[80px] flex-1 sm:flex-initial">
                                          <span className="block sm:hidden text-[9px] uppercase font-bold text-ink-muted mb-0.5">MRP (₹)</span>
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-muted">₹</span>
                                            <input
                                              type="number"
                                              value={v.mrp || ''}
                                              onChange={(e) => updateVariantRow(v.originalIndex, 'mrp', e.target.value)}
                                              placeholder="MRP"
                                              className="w-full rounded-lg border border-hairline bg-white pl-5 pr-2 py-1.5 text-xs text-ink-soft placeholder:text-ink-muted outline-none focus:border-gold"
                                            />
                                          </div>
                                        </div>

                                        {/* Stock */}
                                        <div className="col-span-2 min-w-[70px] w-20 sm:w-auto">
                                          <span className="block sm:hidden text-[9px] uppercase font-bold text-ink-muted mb-0.5">Stock</span>
                                          <input
                                            type="number"
                                            min="0"
                                            value={v.stock != null ? v.stock : 10}
                                            onChange={(e) => updateVariantRow(v.originalIndex, 'stock', e.target.value)}
                                            placeholder="10"
                                            className="w-full rounded-lg border border-hairline bg-white px-2 py-1.5 text-xs text-center font-bold text-ink placeholder:text-ink-muted outline-none transition focus:border-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                        </div>

                                        {/* Delete button */}
                                        <div className="col-span-1 flex justify-end">
                                          <button
                                            type="button"
                                            onClick={() => removeVariantRow(v.originalIndex)}
                                            disabled={form.variants.length <= 1}
                                            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-sale/10 hover:text-sale disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-muted"
                                            title="Remove this size"
                                            aria-label="Remove this size"
                                          >
                                            <FiTrash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  /* Empty State for this specific frame */
                                  <div className="rounded-xl border border-dashed border-hairline/90 bg-white/70 p-4 text-center">
                                    <p className="text-xs font-semibold text-ink">
                                      No sizes configured for “{fr}” yet.
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-ink-muted">
                                      Add sizes directly or copy in 1 click from another frame.
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => addSizeToFrame(fr, '')}
                                        className="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold-deep hover:bg-gold hover:text-ink transition"
                                      >
                                        <FiPlus size={12} /> Add Size Manually
                                      </button>
                                      {otherFramesWithSizes.length > 0 && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => copySizesFromFrame(otherFramesWithSizes[0], fr, 500)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold-deep hover:bg-gold hover:text-ink transition"
                                          >
                                            <FiCopy size={12} /> Copy from {otherFramesWithSizes[0]} (+₹500)
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => copySizesFromFrame(otherFramesWithSizes[0], fr, 0)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs font-medium text-ink hover:border-gold transition"
                                          >
                                            Exact Price (+₹0)
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Mode 2: ALL VARIANTS FLAT MASTER TABLE ──── */}
                  {matrixViewMode === 'flat' && (
                    <div className="mt-4 rounded-xl border border-hairline bg-white p-3.5 sm:p-4 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline/60 pb-2.5 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-ink">
                          Master Variants Table ({form.variants.length} rows)
                        </span>
                        <button
                          type="button"
                          onClick={() => addVariantRow('', enabledFrames[0] || 'Without Frame')}
                          className="inline-flex items-center gap-1 rounded-lg border border-gold/50 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold-deep hover:bg-gold/25"
                        >
                          <FiPlus size={13} /> Add Row
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Table Header */}
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                          <span className="w-6">#</span>
                          <span className="w-24 sm:w-28">Size (Inches)</span>
                          <span className="flex-1 min-w-[130px]">Frame Finish</span>
                          <span className="w-24">Price (₹)</span>
                          <span className="w-20">MRP (₹)</span>
                          <span className="w-20 text-center">Stock</span>
                          <span className="w-7 text-right">Del</span>
                        </div>

                        {form.variants.map((v, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-wrap items-center gap-2 rounded-xl border p-2 sm:flex-nowrap ${
                              idx === 0 ? 'border-gold/40 bg-gold/[0.04]' : 'border-hairline/80 bg-bone-soft/60'
                            }`}
                          >
                            <span className="w-6 font-mono text-[11px] font-bold text-ink-muted">
                              #{idx + 1}
                            </span>

                            {/* Size */}
                            <div className="w-24 sm:w-28">
                              <input
                                value={v.size}
                                onChange={(e) => updateVariantRow(idx, 'size', e.target.value)}
                                placeholder="18x36"
                                className="w-full rounded-lg border border-hairline bg-white px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-gold"
                              />
                            </div>

                            {/* Frame Finish Selector */}
                            <div className="flex-1 min-w-[130px]">
                              <select
                                value={v.frame || ''}
                                onChange={(e) => updateVariantRow(idx, 'frame', e.target.value)}
                                className="w-full rounded-lg border border-hairline bg-white px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-gold"
                              >
                                <option value="">No Frame / Default</option>
                                {enabledFrames.map((fr) => (
                                  <option key={fr} value={fr}>{fr}</option>
                                ))}
                                {v.frame && !enabledFrames.includes(v.frame) && (
                                  <option value={v.frame}>{v.frame}</option>
                                )}
                              </select>
                            </div>

                            {/* Price */}
                            <div className="w-24">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gold-deep">₹</span>
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={(e) => updateVariantRow(idx, 'price', e.target.value)}
                                  placeholder="Price"
                                  className="w-full rounded-lg border border-hairline bg-white pl-5 pr-1.5 py-1.5 text-xs font-bold text-ink outline-none focus:border-gold"
                                />
                              </div>
                            </div>

                            {/* MRP */}
                            <div className="w-20">
                              <div className="relative">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">₹</span>
                                <input
                                  type="number"
                                  value={v.mrp || ''}
                                  onChange={(e) => updateVariantRow(idx, 'mrp', e.target.value)}
                                  placeholder="MRP"
                                  className="w-full rounded-lg border border-hairline bg-white pl-4 pr-1 py-1.5 text-xs text-ink-soft outline-none focus:border-gold"
                                />
                              </div>
                            </div>

                            {/* Stock */}
                            <div className="w-20">
                              <input
                                type="number"
                                min="0"
                                value={v.stock != null ? v.stock : 10}
                                onChange={(e) => updateVariantRow(idx, 'stock', e.target.value)}
                                placeholder="10"
                                className="w-full rounded-lg border border-hairline bg-white px-2 py-1.5 text-xs text-center font-bold text-ink outline-none transition focus:border-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => removeVariantRow(idx)}
                              disabled={form.variants.length <= 1}
                              className="rounded-lg p-1.5 text-ink-muted transition hover:bg-sale/10 hover:text-sale disabled:opacity-30"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── 1-CLICK COPY / CLONE MODAL POPUP ──── */}
                  {copyModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
                      <div
                        className="relative w-full max-w-md rounded-2xl border border-hairline bg-bone-soft p-5 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/20 text-gold-deep">
                              <FiCopy size={15} />
                            </span>
                            <h3 className="font-display text-base font-semibold text-ink">
                              Copy Sizes to “{activeTargetForModal}”
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCopyModalOpen(false)}
                            className="rounded-lg p-1 text-ink-muted hover:text-ink"
                            aria-label="Close"
                          >
                            <FiX size={16} />
                          </button>
                        </div>

                        <div className="mt-4 space-y-3.5 text-xs">
                          <div>
                            <label className="block font-semibold uppercase tracking-wider text-ink-muted mb-1 text-[10px]">
                              Copy sizes from:
                            </label>
                            <select
                              value={selectedSourceForModal}
                              onChange={(e) => setCopySourceFrame(e.target.value)}
                              className="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-xs font-medium text-ink outline-none focus:border-gold"
                            >
                              {possibleSourcesForModal.map((fr) => {
                                const cnt = form.variants.filter(
                                  (v) => (v.frame || '').toLowerCase() === fr.toLowerCase()
                                ).length;
                                return (
                                  <option key={fr} value={fr}>
                                    {fr} ({cnt} sizes)
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold uppercase tracking-wider text-ink-muted mb-1 text-[10px]">
                              Optional Price Markup (₹):
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">+₹</span>
                              <input
                                type="number"
                                value={copyPriceMarkup}
                                onChange={(e) => setCopyPriceMarkup(e.target.value)}
                                placeholder="0 (e.g. 500 to add ₹500 to each size)"
                                className="w-full rounded-xl border border-hairline bg-white pl-8 pr-3 py-2 text-xs font-medium text-ink outline-none focus:border-gold"
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-ink-muted">
                              Leave empty or 0 to copy exact prices. Entering 500 will make a ₹1,600 size become ₹2,100.
                            </p>
                          </div>

                          {selectedSourceForModal && (
                            <div className="rounded-xl border border-hairline/80 bg-white/80 p-2.5 text-[11px] text-ink-soft">
                              <span className="font-semibold text-ink">Preview:</span> Will copy{' '}
                              <strong>{sourceVariantsForModal.length} size(s)</strong> ({sourceVariantsForModal.map((v) => `${v.size}"`).join(', ')}) from “{selectedSourceForModal}” to “{activeTargetForModal}”.
                            </div>
                          )}
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline/60 pt-3">
                          <button
                            type="button"
                            onClick={() => setCopyModalOpen(false)}
                            className="rounded-xl border border-hairline bg-bone px-3.5 py-2 text-xs font-medium text-ink-soft hover:text-ink"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => copySizesFromFrame(selectedSourceForModal, activeTargetForModal, copyPriceMarkup)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold px-4 py-2 text-xs font-bold text-ink shadow-xs transition hover:bg-gold-light active:scale-95"
                          >
                            <FiCheck size={14} /> Copy Sizes Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Images */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Product Images</span>
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-deep transition hover:text-ink hover:underline"
                >
                  <FiHelpCircle size={13} /> Dimension Guide
                </button>
              </div>

              <div className="mb-2.5 rounded-lg border border-hairline/80 bg-bone/60 p-2.5 text-[11px] text-ink-soft flex items-start gap-2">
                <span className="font-semibold text-gold-deep whitespace-nowrap">📐 Standards:</span>
                <span><strong>4:5 Vertical (2400×3000px)</strong> for single canvases · <strong>4:3 or 16:9</strong> for Gallery Sets · Min 1600×2000px · Max 10MB per image</span>
              </div>

              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <ProductImageChip key={i} img={img} onRemove={() => removeImage(i)} isPrimary={i === 0} />
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="group flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-hairline/90 bg-bone-soft text-ink-muted transition hover:border-gold/60 hover:bg-gold/5 hover:text-gold-deep disabled:opacity-60"
                >
                  <FiUploadCloud size={20} className={uploading ? 'animate-pulse text-gold' : 'group-hover:scale-110'} />
                  <span className="text-[10px] font-semibold">{uploading ? 'Uploading…' : 'Add Images'}</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />
              </div>

              {/* Or add by direct link */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  value={imgLink}
                  onChange={(e) => setImgLink(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageLink(); } }}
                  placeholder="or paste image URL (https://…)"
                  className="min-w-0 flex-1 rounded-lg border border-hairline bg-bone-soft px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none transition focus:border-gold"
                />
                <button type="button" onClick={addImageLink} className="shrink-0 rounded-lg border border-hairline bg-bone px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft transition hover:border-gold/50 hover:text-gold-deep">
                  Add Link
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
              <ViewStat label="Starting Price" value={formatINR(viewing.price)} />
              <ViewStat label="MRP" value={viewing.mrp ? formatINR(viewing.mrp) : '—'} />
              <ViewStat label="Stock" value={viewing.stock ?? 0} />
              <ViewStat label="Category" value={viewing.category?.title || '—'} />
            </div>

            {/* Available Frame Finishes in View Modal */}
            {((viewing.frameOptions && viewing.frameOptions.length > 0) || (viewing.variants && viewing.variants.some((v) => v.frame))) && (
              <div>
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                  Available Frame Finishes
                </span>
                <div className="flex flex-wrap gap-2">
                  {[...new Set([
                    ...(viewing.frameOptions || []),
                    ...(viewing.variants || []).map((v) => v.frame).filter(Boolean),
                  ])].map((fr) => (
                    <span
                      key={fr}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-deep shadow-2xs"
                    >
                      <span>🖼️</span> {fr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Size & Framing Matrix in View Modal */}
            {viewing.variants?.length > 0 && (
              <div>
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
                  Size &amp; Framing Pricing Matrix
                </span>
                <div className="overflow-x-auto rounded-xl border border-hairline/80 bg-bone">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-hairline/60 bg-bone-muted text-[10px] uppercase tracking-wider text-ink-muted">
                      <tr>
                        <th className="px-3.5 py-2 font-medium">Size (Inches)</th>
                        <th className="px-3.5 py-2 font-medium">Frame Finish</th>
                        <th className="px-3.5 py-2 font-medium">Price</th>
                        <th className="px-3.5 py-2 font-medium">MRP</th>
                        <th className="px-3.5 py-2 font-medium">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/40">
                      {viewing.variants.map((v, i) => (
                        <tr key={i} className={i === 0 ? 'bg-gold/[0.06] font-semibold' : ''}>
                          <td className="px-3.5 py-2 text-ink">
                            {v.size ? `${v.size}"` : 'Standard'}
                            {i === 0 && <span className="ml-1.5 rounded bg-gold/20 px-1.5 py-0.2 text-[9px] font-bold uppercase text-gold-deep">Default</span>}
                          </td>
                          <td className="px-3.5 py-2 text-ink">
                            {v.frame ? (
                              <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold-deep">
                                {v.frame}
                              </span>
                            ) : (
                              <span className="text-ink-muted">—</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2 text-ink font-bold">{formatINR(v.price)}</td>
                          <td className="px-3.5 py-2 text-ink-muted">{v.mrp ? formatINR(v.mrp) : '—'}</td>
                          <td className="px-3.5 py-2 text-ink-soft">{v.stock ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

      {/* Dimension Guide Modal */}
      <DimensionGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function ProductImageChip({ img, onRemove, isPrimary }) {
  const [dims, setDims] = useState(null);

  useEffect(() => {
    if (!img?.url) return;
    const i = new Image();
    i.onload = () => {
      const w = i.naturalWidth;
      const h = i.naturalHeight;
      const r = w / h;
      let ratio = `${w}:${h}`;
      if (Math.abs(r - 0.8) < 0.06) ratio = '4:5';
      else if (Math.abs(r - 1.0) < 0.05) ratio = '1:1';
      else if (Math.abs(r - 1.333) < 0.06) ratio = '4:3';
      else if (Math.abs(r - 1.777) < 0.08) ratio = '16:9';
      setDims({ w, h, ratio });
    };
    i.src = img.url;
  }, [img?.url]);

  return (
    <div className="group/chip relative flex flex-col items-center">
      <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-hairline/80 bg-[#FBF9F5] shadow-sm">
        <img src={img.url} alt="" className="h-full w-full object-contain" />

        {/* Primary Badge */}
        {isPrimary && (
          <span className="absolute bottom-1 left-1 rounded bg-gold px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-ink shadow">
            Main
          </span>
        )}

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/75 text-bone shadow transition hover:bg-ink hover:scale-110"
        >
          <FiX size={11} />
        </button>
      </div>

      {/* Live Dimension Pill */}
      {dims && (
        <span className="mt-1 font-mono text-[9px] text-ink-muted">
          {dims.w}×{dims.h} <strong className="text-gold-deep">({dims.ratio})</strong>
        </span>
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
