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
import { organizationSchema, websiteSchema } from '@/lib/seo';
import { useSettingsStore } from '@/store/settingsStore';

export default function Home() {
  const settings = useSettingsStore((s) => s.settings);
  const bestsellers = useFetch('/products?sort=bestselling&limit=8');
  const newArrivals  = useFetch('/products?sort=new&limit=4');
  const reviewsRes   = useFetch('/reviews');

  // Admin override (key 'home') merged over the built-in defaults — every band is editable.
  const contentRes = useFetch('/content/home', { deps: [] });
  const content = { ...homeContent, ...(contentRes.data?.data || {}) };
  const sections = { ...homeContent.sections, ...(content.sections || {}) };

  const bestList     = (bestsellers.data?.data || []).map(normalizeProduct);
  const newList      = (newArrivals.data?.data  || []).map(normalizeProduct);
  const testimonials = reviewsRes.data?.data?.length
    ? reviewsRes.data.data
    : content.testimonials;

  // Build SectionShell props from an editable header config.
  const headerProps = (s = {}) => ({
    eyebrow: s.eyebrow,
    title: s.title,
    ...(s.description ? { description: s.description } : {}),
    ...(s.linkLabel ? { link: { label: s.linkLabel, href: s.linkHref || '/shop' } } : {}),
  });

  return (
    <>
      <Seo
        title="DreamzDecors — Premium Wall Art, Gallery Sets & Bundles"
        description="Shop premium wall art, gallery sets, and bundles designed for modern Indian homes. Gold foil finishing, secure packaging, pan-India delivery."
        canonical="/"
        schema={[organizationSchema(settings), websiteSchema()]}
      />

      {/* ① Hero ─────────────────────────────────────────────── */}
      <Hero />

      {/* ② Shop by Collection ───────────────────────────────── */}
      <SectionShell className="bg-bone-soft" {...headerProps(sections.collections)}>
        <EditorialGrid items={content.collections} />
      </SectionShell>

      {/* ③ Bestsellers ──────────────────────────────────────── */}
      <SectionShell className="bg-bone" {...headerProps(sections.bestsellers)}>
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
        eyebrow={content.featureEyebrow}
        title={content.featureTitle}
        description={content.featureDescription}
        points={content.featurePoints}
        image={content.featureImage}
        imageAlt="Dreamz Decor styled interior"
        cta={content.featureCta}
      />

      {/* ⑤ New Arrivals ─────────────────────────────────────── */}
      <SectionShell className="bg-bone-soft" {...headerProps(sections.newArrivals)}>
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
      <SectionShell className="bg-bone" {...headerProps(sections.testimonials)}>
        <TestimonialGrid items={testimonials} />
      </SectionShell>

      {/* ⑦ Newsletter ───────────────────────────────────────── */}
      <NewsletterBand />
    </>
  );
}
