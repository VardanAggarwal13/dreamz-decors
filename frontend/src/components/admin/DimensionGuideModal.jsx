import { FiX, FiCheck, FiInfo, FiImage } from 'react-icons/fi';

const guideData = [
  {
    type: 'Single Canvas / Portrait Wall Art',
    ratio: '4:5 (Vertical)',
    optimal: '2400 × 3000 px',
    min: '1600 × 2000 px',
    notes: 'Ideal for standard portrait canvases. Shows the full artwork edge-to-edge with zero side clipping.',
  },
  {
    type: 'Multi-Panel Gallery Sets / Triptychs',
    ratio: '4:3 or 16:9 (Horizontal)',
    optimal: '2400 × 1800 px or 3200 × 1800 px',
    min: '1600 × 1200 px',
    notes: 'Shows all 2 or 3 frames side-by-side with equal margins on left and right.',
  },
  {
    type: 'Landscape / Panoramic Art',
    ratio: '16:9 or 3:2 (Horizontal)',
    optimal: '2560 × 1440 px',
    min: '1920 × 1080 px',
    notes: 'For wide horizontal canvases, ocean vistas, and skyline landscapes.',
  },
  {
    type: 'Square Canvas Art',
    ratio: '1:1 (Square)',
    optimal: '2400 × 2400 px',
    min: '1200 × 1200 px',
    notes: 'For modern geometric, abstract, and square mandalas.',
  },
  {
    type: 'Homepage Hero Banner',
    ratio: '16:9 or 21:9 (Ultra-wide)',
    optimal: '2560 × 1440 px',
    min: '1920 × 1080 px',
    notes: 'Keep main focal subject centered so it stays visible across mobile and desktop.',
  },
  {
    type: 'Collection Cards ("Find your aesthetic")',
    ratio: '4:5 (Vertical)',
    optimal: '1600 × 2000 px',
    min: '1200 × 1500 px',
    notes: 'Clean full-bleed artwork that fills the card background.',
  },
];

export default function DimensionGuideModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-hairline/80 bg-bone-soft shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-hairline/60 bg-bone px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold-deep">
              <FiImage size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink sm:text-lg">Image Upload Dimension Guide</h2>
              <p className="text-[11px] text-ink-muted">Optimal pixel resolutions and aspect ratios for all storefront sections</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition hover:bg-ink/5 hover:text-ink"
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="overflow-x-auto rounded-xl border border-hairline/70 bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-hairline/70 bg-bone-muted/40 font-semibold text-ink">
                  <th className="p-3 sm:p-3.5">Asset Type</th>
                  <th className="p-3 sm:p-3.5">Aspect Ratio</th>
                  <th className="p-3 sm:p-3.5">Optimal Resolution</th>
                  <th className="p-3 sm:p-3.5">Minimum</th>
                  <th className="p-3 sm:p-3.5">Notes & Best Practices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/50">
                {guideData.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-bone/40">
                    <td className="p-3 font-semibold text-ink sm:p-3.5">{row.type}</td>
                    <td className="p-3 font-medium text-gold-deep sm:p-3.5 whitespace-nowrap">{row.ratio}</td>
                    <td className="p-3 font-mono font-medium text-ink sm:p-3.5 whitespace-nowrap">{row.optimal}</td>
                    <td className="p-3 font-mono text-ink-muted sm:p-3.5 whitespace-nowrap">{row.min}</td>
                    <td className="p-3 leading-relaxed text-ink-soft sm:p-3.5">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Guidelines Box */}
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-xs text-ink-soft">
            <div className="flex items-center gap-1.5 font-semibold text-gold-deep mb-1.5">
              <FiInfo size={14} /> Important Upload Rules for Clients:
            </div>
            <ul className="space-y-1 list-disc pl-4 text-ink/80 leading-relaxed">
              <li><strong>Upload Raw Artworks:</strong> Do not draw artificial clip-art frames or mockups directly onto the images. The storefront adds frame options dynamically.</li>
              <li><strong>Formats Accepted:</strong> JPG, WebP, or PNG (sRGB color profile, under 5 MB per image).</li>
              <li><strong>High Resolution:</strong> For best sharpness on Retina and 4K displays, upload at or above the <em>Optimal Resolution</em>.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-hairline/60 bg-bone px-5 py-3 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-bone transition hover:bg-ink-soft"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
