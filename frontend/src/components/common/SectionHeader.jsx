import { Link } from 'react-router-dom';

export default function SectionHeader({ eyebrow, title, link }) {
  return (
    <div className="flex items-end justify-between gap-6 pb-8">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="mt-3 font-display text-3xl text-balance text-ink sm:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link to={link.href} className="editorial-link hidden sm:inline">
          {link.label}
        </Link>
      )}
    </div>
  );
}