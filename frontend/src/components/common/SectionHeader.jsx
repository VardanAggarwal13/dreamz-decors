import { Link } from 'react-router-dom';

export default function SectionHeader({ eyebrow, title, link }) {
  return (
    <div className="flex items-end justify-between gap-6 pb-8">
      <div>
        {eyebrow && (
          <span className="text-xs uppercase tracking-[0.3em] text-accent">{eyebrow}</span>
        )}
        <h2 className="mt-2 font-display text-3xl text-balance sm:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link
          to={link.href}
          className="hidden text-xs uppercase tracking-[0.22em] text-ink/65 hover:text-accent sm:inline"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
