import Hero from '@/components/common/Hero';
import SectionShell from '@/components/common/SectionShell';
import EditorialGrid from '@/components/common/EditorialGrid';
import FeatureSplit from '@/components/common/FeatureSplit';
import TestimonialGrid from '@/components/common/TestimonialGrid';
import NewsletterBand from '@/components/common/NewsletterBand';
import ProductGrid from '@/components/common/ProductGrid';
import ProductGridSkeleton from '@/components/common/ProductGridSkeleton';
import Seo from '@/components/common/Seo';
import useFetch from '@/hooks/useFetch';
import { homeContent } from '@/lib/siteContent';
import { normalizeProduct } from '@/lib/utils';

export default function Home() {
  const bestsellers = useFetch('/products?sort=bestselling&limit=8');
  const newArrivals  = useFetch('/products?sort=new&limit=4');
  const reviewsRes   = useFetch('/reviews');

  const bestList     = (bestsellers.data?.data || []).map(normalizeProduct);
  const newList      = (newArrivals.data?.data  || []).map(normalizeProduct);
  const testimonials = reviewsRes.data?.data?.length
    ? reviewsRes.data.data
    : homeContent.testimonials;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <Seo
        title="DreamzDecors — Premium Wall Art, Gallery Sets & Bundles"
        description="Shop premium wall art, gallery sets, and bundles designed for modern Indian homes. Gold foil finishing, secure packaging, pan-India delivery."
        canonical="/"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'DreamzDecors',
          url: origin,
        }}
      />

      {/* ① Hero ─────────────────────────────────────────────── */}
      <Hero />

      {/* ② Shop by Collection ───────────────────────────────── */}
      <SectionShell
        className="bg-bone-soft"
        eyebrow="Shop by collection"
        title="Find your aesthetic."
        description="Wall art, gallery sets, and bundles — the three cleanest entry points into the range."
        link={{ label: 'View all', href: '/shop' }}
      >
        <EditorialGrid items={homeContent.collections} />
      </SectionShell>

      {/* ③ Bestsellers ──────────────────────────────────────── */}
      <SectionShell
        className="bg-bone"
        eyebrow="Most loved"
        title="Bestsellers right now."
        link={{ label: 'See all bestsellers', href: '/shop?sort=bestselling' }}
      >
        {bestsellers.loading ? (
          <ProductGridSkeleton columns={4} count={8} layout="editorial" />
        ) : bestsellers.error ? (
          <p className="py-10 text-center text-sm text-ink/50">
            Could not load products — {bestsellers.error.message}
          </p>
        ) : (
          <ProductGrid products={bestList} columns={4} layout="editorial" />
        )}
      </SectionShell>

      {/* ④ Why Dreamz Decor ─────────────────────────────────── */}
      <FeatureSplit
        eyebrow={homeContent.featureEyebrow}
        title={homeContent.featureTitle}
        description={homeContent.featureDescription}
        points={homeContent.featurePoints}
        image={homeContent.featureImage}
        imageAlt="Dreamz Decor styled interior"
        cta={homeContent.featureCta}
      />

      {/* ⑤ New Arrivals ─────────────────────────────────────── */}
      <SectionShell
        className="bg-bone-soft"
        eyebrow="Fresh in"
        title="New this week."
        link={{ label: 'Browse new arrivals', href: '/shop?sort=new' }}
      >
        {newArrivals.loading ? (
          <ProductGridSkeleton columns={4} count={4} layout="editorial" />
        ) : newArrivals.error ? (
          <p className="py-10 text-center text-sm text-ink/50">
            Could not load products — {newArrivals.error.message}
          </p>
        ) : (
          <ProductGrid products={newList} columns={4} layout="editorial" />
        )}
      </SectionShell>

      {/* ⑥ Testimonials ─────────────────────────────────────── */}
      <SectionShell
        className="bg-bone"
        eyebrow="Testimonials"
        title="What customers are saying."
        description="Honest reviews from homeowners, interior designers, and hotel owners across India."
      >
        <TestimonialGrid items={testimonials} />
      </SectionShell>

      {/* ⑦ Newsletter ───────────────────────────────────────── */}
      <NewsletterBand />
    </>
  );
}
