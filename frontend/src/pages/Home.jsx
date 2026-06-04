import Hero from '@/components/common/Hero';
import SectionHeader from '@/components/common/SectionHeader';
import CategoryGrid from '@/components/common/CategoryGrid';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import PromoBanner from '@/components/common/PromoBanner';
import useFetch from '@/hooks/useFetch';
import { normalizeProduct } from '@/lib/utils';

export default function Home() {
  const bestsellers = useFetch('/products?sort=bestselling&limit=8');
  const newArrivals = useFetch('/products?sort=new&limit=4');

  const bestList = (bestsellers.data?.data || []).map(normalizeProduct);
  const newList = (newArrivals.data?.data || []).map(normalizeProduct);

  return (
    <>
      <Hero />

      <section className="container-page py-20">
        <SectionHeader
          eyebrow="Shop by category"
          title="Find your aesthetic."
          link={{ label: 'View all', href: '/shop' }}
        />
        <CategoryGrid />
      </section>

      <section className="container-page py-12">
        <SectionHeader
          eyebrow="Most loved"
          title="Bestsellers right now."
          link={{ label: 'See all bestsellers', href: '/shop?sort=bestselling' }}
        />
        {bestsellers.loading ? (
          <ProductGridSkeleton columns={4} count={8} />
        ) : bestsellers.error ? (
          <div className="py-10 text-center text-sm text-ink/60">
            Could not load products: {bestsellers.error.message}
          </div>
        ) : (
          <ProductGrid products={bestList} columns={4} />
        )}
      </section>

      <section className="container-page py-20">
        <PromoBanner />
      </section>

      <section className="container-page pb-24">
        <SectionHeader
          eyebrow="Fresh in"
          title="New this week."
          link={{ label: 'Browse new arrivals', href: '/shop?sort=new' }}
        />
        {newArrivals.loading ? (
          <ProductGridSkeleton columns={4} count={4} />
        ) : newArrivals.error ? (
          <div className="py-10 text-center text-sm text-ink/60">
            Could not load products: {newArrivals.error.message}
          </div>
        ) : (
          <ProductGrid products={newList} columns={4} />
        )}
      </section>
    </>
  );
}
