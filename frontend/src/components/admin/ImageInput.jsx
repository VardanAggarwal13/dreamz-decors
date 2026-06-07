import { useRef, useState } from 'react';
import { FiUploadCloud, FiX, FiLink } from 'react-icons/fi';
import { toast } from 'sonner';
import api from '@/lib/api';

/**
 * Reusable single-image picker for the admin.
 * Two ways to set an image — upload a file (→ Cloudinary) OR paste an image
 * link. Both resolve to a URL string passed up via `onChange(url)`.
 *
 * Props:
 *   value        current image URL ('' when none)
 *   onChange     (url: string) => void
 *   label, hint  optional labels
 *   previewClass tailwind height/aspect for the preview (default 'h-40')
 */
export default function ImageInput({ value, onChange, label, hint, previewClass = 'h-40' }) {
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState('');
  const fileRef = useRef(null);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await api.post('/uploads/single', fd);
        if (res.data?.url) onChange(res.data.url);
      } catch (err) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const addLink = () => {
    const v = link.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) {
      toast.error('Enter a valid link starting with http:// or https://');
      return;
    }
    onChange(v);
    setLink('');
  };

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">{label}</span>
      )}

      {value ? (
        <div className={`relative overflow-hidden rounded-xl border border-hairline/60 ${previewClass}`}>
          <img
            src={value}
            alt="Selected"
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.opacity = '0.35'; }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-ink/70 text-bone transition hover:bg-ink"
            aria-label="Remove image"
          >
            <FiX size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-hairline bg-bone-soft py-6 text-ink-muted transition hover:border-gold/50 hover:text-gold-deep disabled:opacity-60"
          >
            <FiUploadCloud size={20} className={uploading ? 'animate-pulse' : ''} />
            <span className="text-xs font-medium">{uploading ? 'Uploading…' : 'Click to upload an image'}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <FiLink size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                placeholder="or paste an image link…"
                className="w-full rounded-lg border border-hairline bg-bone-soft py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted outline-none transition focus:border-gold"
              />
            </div>
            <button
              type="button"
              onClick={addLink}
              className="shrink-0 rounded-lg border border-hairline bg-bone px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft transition hover:border-gold/50 hover:text-gold-deep"
            >
              Use
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
      {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
