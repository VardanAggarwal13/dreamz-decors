import { FiSearch, FiX } from 'react-icons/fi';

/**
 * Shared admin search box. Controlled — the parent owns the query string and
 * filters its already-loaded list (client-side, instant). Shows a clear button
 * once there's a value.
 */
export default function AdminSearch({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <FiSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-hairline bg-bone py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-gold"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink"
          aria-label="Clear search"
        >
          <FiX size={15} />
        </button>
      )}
    </div>
  );
}
