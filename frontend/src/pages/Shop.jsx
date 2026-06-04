import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import useFetch from '@/hooks/useFetch';
import { normalizeCategory, normalizeProduct } from '@/lib/utils';

const PAGE_SIZE = 12;

const sortOptions = [
  { value: 'new', label: 'Newest' },
  { value: 'bestselling', label: 'Bestselling' },
  { value: 'price-asc', label: 'Price - Low to High' },
  { value: 'price-desc', label: 'Price - High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function Shop() {
  const { category } = useParams();
  const [params, setParams] = useSearchParams();
  const [cols, setCols] = useState(4);

  const tag = params.get('tag');
  const sort = params.get('sort') || 'new';
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);

  const categoriesQuery = useFetch('/categories');
  const categories = (categoriesQuery.data?.data || []).map(normalizeCategory);
  const currentCat = categories.find((item) => item.slug === category);

  const query = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('sort', sort);
    searchParams.set('page', String(page));
    searchParams.set('limit', String(PAGE_SIZE));

    if (currentCat?.id) searchParams.set('category', currentCat.id);
    if (tag) searchParams.set('tag', tag);

    return searchParams.toString();
  }, [currentCat?.id, page, sort, tag]);

  const { data, loading, error } = useFetch(`/products?${query}`, {
    deps: [query],
    skip: Boolean(category) && !currentCat,
  });

  const products = (data?.data || []).map(normalizeProduct);
  const total = data?.total ?? products.length;
  const totalPages = Math.max(1, data?.pages || 1);
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page === currentPage) return;

    const nextParams = new URLSearchParams(params);
    if (currentPage <= 1) nextParams.delete('page');
    else nextParams.set('page', String(currentPage));
    setParams(nextParams, { replace: true });
  }, [currentPage, page, params, setParams]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    return Array.from(
      new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
    ).filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages);
  }, [currentPage, totalPages]);

  const updateFilters = (updates) => {
    const nextParams = new URLSearchParams(params);

    Object.entries(updates).forEach(([key, value]) => {
      if (value == null || value === '') nextParams.delete(key);
      else nextParams.set(key, value);
    });

    nextParams.delete('page');
    setParams(nextParams);
  };

  const goToPage = (nextPage) => {
    const boundedPage = Math.min(Math.max(1, nextPage), totalPages);
    const nextParams = new URLSearchParams(params);

    if (boundedPage <= 1) nextParams.delete('page');
    else nextParams.set('page', String(boundedPage));

    setParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container-page py-12">
      <div className="mb-10">
        <span className="text-xs uppercase tracking-[0.3em] text-accent">
          {currentCat ? 'Collection' : 'Shop'}
        </span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          {currentCat ? currentCat.title : 'All Products'}
        </h1>
        {currentCat?.blurb && <p className="mt-3 max-w-2xl text-ink/70">{currentCat.blurb}</p>}
        {tag && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline">Tag: {tag}</Badge>
          </div>
        )}
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-ink/8 py-4">
        <div className="text-xs uppercase tracking-[0.22em] text-ink/60">
          {loading ? 'Loading...' : `${total} products`}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-[0.22em] text-ink/60">Sort</label>
          <select
            value={sort}
            onChange={(event) => updateFilters({ sort: event.target.value })}
            className="rounded-md border border-ink/15 bg-bone-soft px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="hidden gap-1 sm:flex">
            {[2, 3, 4].map((count) => (
              <Button
                key={count}
                variant={cols === count ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCols(count)}
                className="!h-9 !px-3"
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <ProductGridSkeleton columns={cols} count={PAGE_SIZE} />
      ) : error ? (
        <div className="py-24 text-center text-ink/60">Could not load products: {error.message}</div>
      ) : products.length > 0 ? (
        <>
          <ProductGrid products={products} columns={cols} />

          <div className="mt-10 flex flex-col items-center gap-4 border-t border-ink/8 pt-6 sm:flex-row sm:justify-between">
            <div className="text-xs uppercase tracking-[0.18em] text-ink/55">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>

              {visiblePages.map((pageNumber, index) => {
                const previousPage = visiblePages[index - 1];
                const showGap = previousPage && pageNumber - previousPage > 1;

                return (
                  <div key={pageNumber} className="flex items-center gap-2">
                    {showGap && <span className="px-1 text-ink/40">...</span>}
                    <Button
                      variant={pageNumber === currentPage ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(pageNumber)}
                      className="min-w-10 !px-0"
                    >
                      {pageNumber}
                    </Button>
                  </div>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="py-24 text-center text-ink/60">
          No products in this collection yet - check back soon.
        </div>
      )}
    </div>
  );
}
