import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import Logo from '@/components/common/Logo';

export default function AuthShell({ eyebrow, title, description, points = [], cta, children }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* ── Left: plain brand panel (no image) ───────────────── */}
      <div className="relative hidden flex-col bg-bone lg:flex lg:w-[46%] xl:w-[44%]">

        {/* Thin gold seam on the right edge */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />

        {/* Content */}
        <div className="flex h-full flex-col p-10 xl:p-12">

          <Logo variant="stacked" />

          <div className="my-auto">
            {eyebrow && (
              <p className="text-[10px] uppercase tracking-[0.38em] text-gold-deep">{eyebrow}</p>
            )}
            <h1 className="mt-3 font-display text-[2.4rem] leading-tight text-ink">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-[300px] text-sm leading-7 text-ink-soft">{description}</p>
            )}

            {points.length > 0 && (
              <ul className="mt-6 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm text-ink-soft">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15">
                      <FiCheck size={11} className="text-gold-deep" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cta && (
            <Link
              to={cta.href}
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-ink-muted transition-colors hover:text-gold-deep"
            >
              {cta.label}
              <FiArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* ── Right: form panel ───────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-bone-soft px-6 py-10 sm:px-14 sm:py-14">
        <div className="w-full max-w-[400px]">

          <div className="mb-8 flex justify-center sm:mb-10 lg:hidden lg:justify-start">
            <Logo variant="horizontal" />
          </div>

          {children}
        </div>
      </div>

    </div>
  );
}
