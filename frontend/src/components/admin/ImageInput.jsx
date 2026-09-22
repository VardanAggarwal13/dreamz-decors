import { useEffect, useRef, useState } from 'react';
import { FiUploadCloud, FiX, FiLink, FiHelpCircle, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import api from '@/lib/api';
import DimensionGuideModal from '@/components/admin/DimensionGuideModal';

function detectRatio(w, h) {
  if (!w || !h) return '';
  const r = w / h;
  if (Math.abs(r - 0.8) < 0.06) return '4:5 (Portrait)';
  if (Math.abs(r - 1.0) < 0.05) return '1:1 (Square)';
  if (Math.abs(r - 1.333) < 0.06) return '4:3 (Landscape)';
  if (Math.abs(r - 1.5) < 0.06) return '3:2 (Landscape)';
  if (Math.abs(r - 1.777) < 0.08) return '16:9 (Widescreen)';
  if (Math.abs(r - 2.333) < 0.1) return '21:9 (Ultra-wide)';
  if (r < 0.75) return 'Tall Portrait';
  if (r > 1.85) return 'Panoramic';
  return `${w}:${h}`;
}

export default function ImageInput({
  value,
  onChange,
  label,
  hint,
  recommendedDimensions = '4:5 (2400 × 3000 px) · Min 1600 × 2000 px',
  previewClass = 'h-48',
}) {
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [info, setInfo] = useState(null); // { width, height, ratio, isOptimal, isLowRes }
  const fileRef = useRef(null);

  // Measure natural dimensions of the image whenever value changes
  useEffect(() => {
    if (!value) {
      setInfo(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = detectRatio(w, h);
      const isOptimal = w >= 2000 || h >= 2000;
      const isLowRes = w < 1200 && h < 1200;
      setInfo({ width: w, height: h, ratio, isOptimal, isLowRes });
    };
    img.onerror = () => setInfo(null);
    img.src = value;
  }, [value]);

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
      {/* Header Row: Label + Dimension Guide Button */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {label && (
          <span className="block text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
            {label}
          </span>
        )}
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-deep transition hover:text-ink hover:underline"
        >
          <FiHelpCircle size={13} /> Dimension Guide
        </button>
      </div>

      {value ? (
        <div className="space-y-2">
          {/* Image Preview with overlay badge */}
          <div className={`relative overflow-hidden rounded-xl border border-hairline/70 bg-[#FBF9F5] ${previewClass}`}>
            <img
              src={value}
              alt="Selected artwork"
              className="h-full w-full object-contain"
              onError={(e) => { e.currentTarget.style.opacity = '0.35'; }}
            />

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-ink/75 text-bone shadow-md backdrop-blur-sm transition hover:bg-ink hover:scale-105 active:scale-95"
              aria-label="Remove image"
            >
              <FiX size={14} />
            </button>

            {/* Detected Dimensions Floating Pill */}
            {info && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between rounded-lg bg-ink/80 px-2.5 py-1 text-[11px] font-medium text-bone backdrop-blur-md">
                <span className="flex items-center gap-1.5 font-mono">
                  {info.width} × {info.height} px
                  <span className="text-gold font-sans font-semibold">({info.ratio})</span>
                </span>
                <span className="flex items-center gap-1 text-[10px]">
                  {info.isOptimal ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <FiCheckCircle size={12} /> Optimal
                    </span>
                  ) : info.isLowRes ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <FiAlertCircle size={12} /> Low Res
                    </span>
                  ) : (
                    <span className="text-sky-300">Standard</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Dimension Details Info Banner */}
          {info && info.isLowRes && (
            <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
              <FiAlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>Image resolution is below the recommended minimum ({recommendedDimensions}). Sharpness on larger displays may be reduced.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Upload Drop Area */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-hairline/90 bg-bone-soft py-6 text-ink-muted transition hover:border-gold/60 hover:bg-gold/5 hover:text-gold-deep disabled:opacity-60"
          >
            <FiUploadCloud size={22} className={`transition-transform group-hover:scale-110 ${uploading ? 'animate-pulse text-gold' : ''}`} />
            <span className="text-xs font-semibold text-ink-soft group-hover:text-gold-deep">
              {uploading ? 'Uploading to Cloudinary…' : 'Click to browse & upload image'}
            </span>
            <span className="text-[11px] text-ink-muted">
              Recommended: {recommendedDimensions}
            </span>
          </button>

          {/* Direct Link Input */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <FiLink size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
                placeholder="or paste direct image URL (https://…)"
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
      {hint && <span className="mt-1.5 block text-[11px] text-ink-muted">{hint}</span>}

      {/* Guide Modal */}
      <DimensionGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
