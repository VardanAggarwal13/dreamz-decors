import { Link } from 'react-router-dom';
import useFetch from '@/hooks/useFetch';
import { normalizeCategory } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CategoryGrid() {
  const { data, loading, error } = useFetch('/categories');
  const categories = (data?.data || []).map(normalizeCategory);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full" />
        ))}
      </div>
    );
  }

  if (error || categories.length === 0) {
    return (
      <div className="rounded-md border border-ink/8 bg-bone-soft p-8 text-center text-sm text-ink/60">
        {error ? `Could not load categories: ${error.message}` : 'No categories yet.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c.slug}
          to={`/shop/${c.slug}`}
          className="group relative overflow-hidden rounded-md bg-bone-muted"
        >
          <div className="aspect-[4/5]">
            {c.image && (
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bone via-bone/40 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="font-display text-2xl text-ink">{c.title}</h3>
            {c.blurb && <p className="mt-1 line-clamp-2 text-xs text-ink/70">{c.blurb}</p>}
            <span className="mt-3 inline-block text-xs uppercase tracking-[0.22em] text-accent group-hover:text-accent-deep">
              Shop now →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
