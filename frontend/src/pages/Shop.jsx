import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import Seo from '@/components/common/Seo';
import useFetch from '@/hooks/useFetch';
import { normalizeCategory, normalizeProduct } from '@/lib/utils';
import { collectionSchema, breadcrumbSchema } from '@/lib/seo';

const PAGE_SIZE = 12;

const sortOptions = [
  { value: 'new',        label: 'Newest' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Top Rated' },
];

export default function Shop() {
  const { category } = useParams();
  const navigate     = useNavigate();
  const [params, setParams] = useSearchParams();

  const sort = params.get('sort') || 'new';
  const search = (params.get('search') || '').trim();
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);

  const categoriesQuery = useFetch('/categories');
  const categories  = (categoriesQuery.data?.data || []).map(normalizeCategory);
  const currentCat  = categories.find((c) => c.slug === category);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set('sort', sort);
    sp.set('page', String(page));
    sp.set('limit', String(PAGE_SIZE));
    if (currentCat?.id) sp.set('category', currentCat.id);
    if (search) sp.set('q', search); // backend expects `q` for text search
    return sp.toString();
  }, [currentCat?.id, page, sort, search]);

  const { data, loading, error } = useFetch(`/products?${query}`, {
    deps: [query],
    skip: Boolean(category) && !currentCat,
  });

  const products   = (data?.data || []).map(normalizeProduct);
  const totalPages = Math.max(1, data?.pages || 1);
  const currentPage = Math.min(page, totalPages);

  const seoTitle = currentCat
    ? `${currentCat.title} — DreamzDecors`
    : 'Our Collections — DreamzDecors';

  const shopPath = currentCat ? `/shop/${currentCat.slug}` : '/shop';
  const shopSchema = [
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
      ...(currentCat ? [{ name: currentCat.title, path: shopPath }] : []),
    ]),
    collectionSchema({ name: seoTitle, path: shopPath, products }),
  ];

  useEffect(() => {
    if (page === currentPage) return;
    const np = new URLSearchParams(params);
    if (currentPage <= 1) np.delete('page');
    else np.set('page', String(currentPage));
    setParams(np, { replace: true });
  }, [currentPage, page, params, setParams]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    return Array.from(
      new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
    ).filter((p) => p >= 1 && p <= totalPages);
  }, [currentPage, totalPages]);

  const goToPage = (next) => {
    const bounded = Math.min(Math.max(1, next), totalPages);
    const np = new URLSearchParams(params);
    if (bounded <= 1) np.delete('page');
    else np.set('page', String(bounded));
    setParams(np);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setCategory = (slug) => {
    const basePath = slug ? `/shop/${slug}` : '/shop';
    const np = new URLSearchParams();
    if (sort !== 'new') np.set('sort', sort);
    const qs = np.toString();
    navigate(qs ? `${basePath}?${qs}` : basePath, { replace: true });
  };

  const setSort = (value) => {
    const np = new URLSearchParams(params);
    if (value === 'new') np.delete('sort');
    else np.set('sort', value);
    np.delete('page');
    setParams(np);
  };

  return (
    <div className="bg-bone">
      <Seo
        title={search ? `Results for “${search}” — DreamzDecors` : seoTitle}
        description="Browse premium wall art, gallery sets, and luxury decor for modern Indian homes."
        canonical={shopPath}
        noIndex={Boolean(search)}
        schema={search ? undefined : shopSchema}
      />

      {/* ── 1. Hero ───────────────────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone py-10 text-center sm:py-12">
        <div className="container-page">
          <p className="eyebrow-gold">{search ? 'Search' : 'Handcrafted in India'}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {search ? `Results for “${search}”` : currentCat ? currentCat.title : 'Our Collections'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-soft">
            {search
              ? 'Showing matches across the collection.'
              : currentCat?.blurb ||
                'Explore our handcrafted luxury art pieces — made in India with careful finishing and secure packaging.'}
          </p>
        </div>
      </div>

      {/* ── 2. Filter bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-hairline/60 bg-bone/95 backdrop-blur-sm">
        <div className="container-page flex flex-col gap-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                !category
                  ? 'bg-gold text-ink'
                  : 'border border-hairline text-ink-soft hover:border-gold/60 hover:text-ink'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategory(cat.slug)}
                className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  category === cat.slug
                    ? 'bg-gold text-ink'
                    : 'border border-hairline text-ink-soft hover:border-gold/60 hover:text-ink'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Sort dropdown — full-width on mobile so it never crowds the pills */}
          <div className="relative w-full shrink-0 sm:w-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full appearance-none cursor-pointer rounded-full border border-hairline bg-bone py-2 pl-4 pr-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft transition focus:border-gold focus:outline-none sm:w-auto sm:py-1.5"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Grid ───────────────────────────────────────────── */}
      <div className="container-page py-10 sm:py-12">
        {loading ? (
          <ProductGridSkeleton columns={3} count={PAGE_SIZE} />
        ) : error ? (
          <div className="py-24 text-center text-sm text-ink-muted">
            Could not load products — please try again.
          </div>
        ) : products.length > 0 ? (
          <>
            <ProductGrid products={products} columns={3} />

            {/* ── Pagination ──────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-sm text-ink-soft transition hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30"
                >
                  ←
                </button>

                {visiblePages.map((pageNum, idx) => {
                  const prev = visiblePages[idx - 1];
                  return (
                    <span key={pageNum} className="flex items-center gap-2">
                      {prev && pageNum - prev > 1 && (
                        <span className="text-sm text-ink-muted">…</span>
                      )}
                      <button
                        onClick={() => goToPage(pageNum)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                          pageNum === currentPage
                            ? 'bg-gold text-ink'
                            : 'border border-hairline text-ink-soft hover:border-gold hover:text-gold'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </span>
                  );
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-sm text-ink-soft transition hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center text-sm text-ink-muted">
            No products in this collection yet — check back soon.
          </div>
        )}
      </div>
    </div>
  );
}
