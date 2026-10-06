import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import useFetch from '@/hooks/useFetch';
import api from '@/lib/api';
import { Link, Navigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Mail,
  Clock,
  Phone,
  Search,
  MessageCircle,
  Palette,
  Sparkles,
  Award,
  ShieldCheck,
  Truck,
  Package,
  Layers,
  CheckCircle2,
  Shield,
  RefreshCw,
  Box,
  Check,
  X,
  Lock,
  FileText,
  HelpCircle,
  Headphones,
  ExternalLink,
  AlertCircle,
  Quote,
  Send,
  ArrowRight,
} from 'lucide-react';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contentPages } from '@/lib/siteContent';
import { faqSchema } from '@/lib/seo';
import { useSettingsStore } from '@/store/settingsStore';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Eyebrow({ children }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold-deep">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="my-10 h-px w-full bg-hairline/60" />;
}

// ─── Full-width page hero ─────────────────────────────────────────────────────
// Title spans the full container — no wasted right space

function PageHero({ eyebrow, title, tagline, stats = [] }) {
  return (
    <div className="border-b border-hairline/60 bg-bone">
      <div className="container-page py-6 sm:py-8 lg:py-10">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 font-display text-3xl leading-[1.05] text-ink sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline/50 pt-4">
          {tagline && (
            <p className="max-w-lg text-xs sm:text-sm leading-relaxed text-ink-soft">{tagline}</p>
          )}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-5 sm:gap-8">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div className="font-display text-lg text-gold sm:text-xl">{value}</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-ink-muted sm:text-[10px]">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqItem({ faq, defaultOpen = false, searchActive = false }) {
  const [open, setOpen] = useState(defaultOpen || searchActive);

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 ${
        open
          ? 'border-gold/50 bg-bone-soft/80 shadow-xs'
          : 'border-hairline/70 bg-bone-soft/40 hover:border-gold/30 hover:bg-bone-soft'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left sm:px-5 sm:py-3"
      >
        <span className={`text-xs sm:text-sm font-semibold tracking-tight transition ${open ? 'text-gold-deep' : 'text-ink'}`}>
          {faq.question}
        </span>
        <span
          className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            open ? 'rotate-180 bg-gold/15 text-gold-deep' : 'bg-bone text-ink-muted group-hover:text-gold'
          }`}
        >
          <ChevronDown size={14} />
        </span>
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 border-t border-hairline/50 px-4 pt-2.5 pb-3.5 sm:px-5 sm:pt-3 sm:pb-4">
          <p className="text-xs sm:text-[13px] leading-relaxed text-ink-soft">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function FaqPage({ page }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const allSections = page.sections || [];
  const allFaqs = useMemo(() => allSections.flatMap((s) => s.faqs || []), [allSections]);

  // Filter sections by search and category
  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSections
      .filter((section) => activeCategory === 'all' || section.title === activeCategory)
      .map((section) => {
        if (!q) return section;
        const matchingFaqs = (section.faqs || []).filter(
          (f) =>
            f.question.toLowerCase().includes(q) ||
            f.answer.toLowerCase().includes(q)
        );
        return { ...section, faqs: matchingFaqs };
      })
      .filter((section) => section.faqs && section.faqs.length > 0);
  }, [allSections, query, activeCategory]);

  const totalResults = useMemo(
    () => filteredSections.reduce((sum, s) => sum + s.faqs.length, 0),
    [filteredSections]
  );

  return (
    <div className="bg-bone min-h-screen">
      <Seo
        title="FAQ — Frequently Asked Questions | DreamzDecors"
        description={page.intro}
        canonical="/faq"
        schema={allFaqs.length ? faqSchema(allFaqs) : undefined}
      />

      {/* ── 1. Luxury Concierge Hero ─────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-gradient-to-b from-bone-soft/60 to-bone py-10 sm:py-14">
        <div className="container-page text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-deep">
            <HelpCircle size={13} />
            <span>Concierge Support &amp; Knowledge Base</span>
          </div>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-ink">
            How Can We Assist You Today?
          </h1>
          <span className="gold-rule-center" />
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-ink-soft">
            Explore instant answers regarding our handcrafted archival canvas, custom dimension scaling, insured pan-India transit, and replacement policies.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-7 max-w-xl">
            <div className="relative flex items-center rounded-2xl border border-hairline bg-bone-soft px-4 py-3 shadow-xs transition focus-within:border-gold/70 focus-within:ring-2 focus-within:ring-gold/20">
              <Search size={18} className="shrink-0 text-gold-deep" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search queries (e.g. framing, delivery time, custom size, damaged parcel)..."
                className="w-full bg-transparent pl-3 pr-8 text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 text-ink-muted hover:text-ink transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveCategory('all'); setQuery(''); }}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                activeCategory === 'all' && !query
                  ? 'border border-gold/60 bg-gold text-bone shadow-xs'
                  : 'border border-hairline/80 bg-bone-soft text-ink-soft hover:border-gold/40 hover:text-ink'
              }`}
            >
              All Topics ({allFaqs.length})
            </button>
            {allSections.map((sec) => (
              <button
                key={sec.title}
                type="button"
                onClick={() => { setActiveCategory(sec.title); setQuery(''); }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
                  activeCategory === sec.title && !query
                    ? 'border border-gold/60 bg-gold text-bone shadow-xs'
                    : 'border border-hairline/80 bg-bone-soft text-ink-soft hover:border-gold/40 hover:text-ink'
                }`}
              >
                {sec.title} ({sec.faqs.length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Interactive Asymmetric 2-Column Content ───────────── */}
      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">

          {/* Left Column (Sticky Sidebar, 4 cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
            
            {/* Category Navigation Card */}
            <div className="rounded-2xl border border-hairline/70 bg-bone-soft/60 p-5 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                Inquiry Categories
              </h3>
              <div className="mt-3.5 space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setActiveCategory('all'); setQuery(''); }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                    activeCategory === 'all'
                      ? 'bg-gold/15 text-gold-deep font-semibold'
                      : 'text-ink-soft hover:bg-bone hover:text-ink'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles size={14} className={activeCategory === 'all' ? 'text-gold-deep' : 'text-gold'} />
                    Browse All Questions
                  </span>
                  <span className="rounded-full bg-bone px-2 py-0.5 text-[10px] text-ink-muted">
                    {allFaqs.length}
                  </span>
                </button>

                {allSections.map((sec) => (
                  <button
                    key={sec.title}
                    type="button"
                    onClick={() => { setActiveCategory(sec.title); setQuery(''); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                      activeCategory === sec.title
                        ? 'bg-gold/15 text-gold-deep font-semibold'
                        : 'text-ink-soft hover:bg-bone hover:text-ink'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <ChevronRight size={14} className={activeCategory === sec.title ? 'text-gold-deep' : 'text-hairline'} />
                      {sec.title}
                    </span>
                    <span className="rounded-full bg-bone px-2 py-0.5 text-[10px] text-ink-muted">
                      {sec.faqs.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Studio Concierge Help Card */}
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-bone-soft to-bone p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold-deep">
                <Headphones size={20} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">
                Need Personal Assistance?
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                Our master framing specialists are ready to help with custom wall sizing, color-matching, or order updates.
              </p>

              <div className="mt-5 space-y-2.5">
                <a
                  href="https://wa.me/918284865051"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition hover:bg-emerald-700"
                >
                  <MessageCircle size={15} />
                  WhatsApp Live (+91 82848 65051)
                </a>

                <a
                  href="tel:+918284865051"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-bone px-4 py-2.5 text-xs font-medium text-ink transition hover:border-gold hover:text-gold-deep"
                >
                  <Phone size={14} className="text-gold" />
                  Call +91 82848 65051
                </a>

                <a
                  href="mailto:dreamzdecor30@gmail.com"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-bone px-4 py-2.5 text-xs font-medium text-ink transition hover:border-gold hover:text-gold-deep"
                >
                  <Mail size={14} className="text-gold" />
                  dreamzdecor30@gmail.com
                </a>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-hairline/60 pt-3 text-[11px] text-ink-muted">
                <Clock size={12} className="text-gold" />
                <span>Mon–Sat: 10:00 AM – 7:00 PM</span>
              </div>
            </div>

            {/* Reassurance Badges */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-hairline/60 bg-bone-soft/40 p-3.5">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <div className="text-xs">
                  <p className="font-semibold text-ink">100% Free Doorstep Replacement</p>
                  <p className="mt-0.5 text-ink-muted leading-relaxed">
                    Transit damage reported within 48h with an uncut unboxing video is replaced immediately at zero extra charge.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-hairline/60 bg-bone-soft/40 p-3.5">
                <Package size={18} className="mt-0.5 shrink-0 text-gold-deep" />
                <div className="text-xs">
                  <p className="font-semibold text-ink">Ready to Hang Out of the Box</p>
                  <p className="mt-0.5 text-ink-muted leading-relaxed">
                    Heavy-duty brackets, screws, and hanging instructions included in every box.
                  </p>
                </div>
              </div>
            </div>

          </aside>

          {/* Right Column (FAQ Accordions, 8 cols) */}
          <main className="lg:col-span-8">
            {query && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-hairline bg-bone-soft/70 px-4 py-3">
                <p className="text-xs text-ink-soft">
                  Found <strong className="text-ink">{totalResults}</strong> result{totalResults === 1 ? '' : 's'} for &ldquo;<span className="text-gold-deep font-semibold">{query}</span>&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs font-semibold text-gold-deep hover:underline"
                >
                  Clear Search
                </button>
              </div>
            )}

            {filteredSections.length > 0 ? (
              <div className="space-y-10">
                {filteredSections.map((section) => (
                  <div key={section.title} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-gold-deep">
                        <Sparkles size={14} />
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl text-ink">
                        {section.title}
                      </h2>
                      <div className="h-px flex-1 bg-hairline/60" />
                    </div>

                    <div className="space-y-3">
                      {section.faqs.map((faq, fi) => (
                        <FaqItem
                          key={faq.question}
                          faq={faq}
                          defaultOpen={activeCategory !== 'all' && fi === 0}
                          searchActive={Boolean(query.trim())}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-10 text-center">
                <HelpCircle size={36} className="mx-auto text-ink-muted/50" />
                <h3 className="mt-3 font-display text-lg text-ink">No matching questions found</h3>
                <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-ink-soft">
                  We could not find an answer matching &ldquo;{query}&rdquo;. Our studio concierge is always happy to answer directly.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setQuery(''); setActiveCategory('all'); }}
                  >
                    Reset Search
                  </Button>
                  <Button asChild variant="primary" size="sm">
                    <Link to="/contact">Contact Our Team</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom Callout */}
            <div className="mt-12 rounded-2xl border border-hairline/70 bg-bone-soft/60 p-6 sm:p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
              <div>
                <p className="eyebrow-gold">Didn&apos;t find your answer?</p>
                <h3 className="mt-1 font-display text-xl text-ink">Have a custom or unique decor query?</h3>
                <p className="mt-1.5 text-xs text-ink-soft max-w-md leading-relaxed">
                  We specialize in custom sizing, corporate commissions, and multi-piece wall mockups. Get in touch with our master artisans.
                </p>
              </div>
              <Button asChild variant="primary" size="md" className="shrink-0 uppercase tracking-wider text-xs">
                <Link to="/contact">
                  Speak with Curators <FiArrowRight />
                </Link>
              </Button>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

function AboutPage({ page }) {
  return (
    <div className="bg-bone min-h-screen">
      <Seo
        title="About Us — Handcrafted Luxury Wall Art | DreamzDecors"
        description={page.intro || "Discover the story of Dreamz Decor. Handcrafted museum-grade textured canvas art made in Amritsar, Punjab for modern Indian homes."}
        canonical="/about"
      />

      {/* ── 1. Serene Editorial Hero (Tight, Compact Spacing) ───────────── */}
      <section className="relative pt-6 pb-6 sm:pt-8 sm:pb-8 text-center border-b border-hairline/60">
        <div className="container-page max-w-4xl">
          <p className="eyebrow-gold">
            Est. 2024 · Amritsar, Punjab
          </p>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl text-ink tracking-tight leading-snug">
            Crafting Art with Soul, Reverence, and Intention.
          </h1>
          <span className="gold-rule-center my-2" />
          <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-ink-soft">
            Dreamz Decor was founded in Punjab to bridge sacred Indian heritage with contemporary architectural interiors. We craft museum-grade textured canvas art that transforms living spaces into tranquil sanctuaries.
          </p>
        </div>
      </section>

      {/* ── 2. The Studio Story (Refined Two-Column Dialogue) ─────────────── */}
      <section className="py-6 sm:py-8 border-b border-hairline/60">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Visual Frame: Compact, Refined Gallery Scale */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="overflow-hidden rounded-xl border border-hairline/80 bg-bone-soft shadow-xs w-full max-w-[300px] sm:max-w-[340px]">
                <img
                  src={page.storyImage || 'https://res.cloudinary.com/pla77unx/image/upload/v1790006408/dreamzdecors/products/lord-ganesha-handcrafted-relief-art.jpg'}
                  alt="Dreamz Decor handcrafted relief canvas artwork"
                  className="aspect-[4/5] max-h-[380px] w-full object-cover"
                />
              </div>
              <p className="mt-2 text-center text-[11px] italic text-ink-muted">
                Lord Ganesha Handcrafted Relief Art · Archival Canvas
              </p>
            </div>

            {/* Narrative: Clean, Concise, Poetic */}
            <div className="lg:col-span-7 space-y-3">
              <div>
                <p className="eyebrow-gold">Our Philosophy</p>
                <h2 className="mt-1 font-display text-xl sm:text-2xl lg:text-3xl text-ink leading-snug">
                  Transforming Blank Walls into Quiet Sanctuaries.
                </h2>
                <span className="gold-rule" />
              </div>

              <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
                <p>
                  In a world saturated with mass-printed paper posters that fade in sunlight and buckle in humid weather, we believe modern Indian homes deserve art with soul, substance, and permanence.
                </p>
                <p>
                  Operating from our dedicated artisan studio on Grand Trunk Road in Amritsar, Punjab, our master craftspeople hand-stretch heavy 400+ GSM cotton canvas over solid, warp-resistant kiln-dried pine frames. Each piece is enhanced with hand-layered metallic foils and acrylic relief textures that interact dynamically with natural daylight and warm evening lighting.
                </p>
                <p>
                  From sacred spiritual tributes that anchor daily devotion to timeless architectural abstracts, every creation is born in India, inspected with uncompromising reverence, and delivered safely to your doorstep.
                </p>
              </div>

              {/* Quiet Studio Note */}
              <div className="border-l-2 border-gold/70 pl-3.5 py-0.5 mt-2">
                <p className="font-serif text-xs sm:text-sm italic text-ink leading-snug">
                  &ldquo;We don&apos;t create art for fleeting trends. We create art to be lived with, cherished, and passed down.&rdquo;
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-gold-deep font-semibold">
                  Dreamz Decor Studio Guild · Amritsar
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. The Four Craft Pillars (Minimalist Editorial Layout) ──────── */}
      <section className="py-6 sm:py-8 bg-bone-soft/40 border-b border-hairline/60">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow-gold">Uncompromising Standards</p>
            <h2 className="mt-1 font-display text-xl sm:text-2xl text-ink">
              The Four Pillars of Our Craft
            </h2>
            <span className="gold-rule" />
            <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
              Every detail is engineered for permanence, aesthetic depth, and enduring beauty in Indian climatic conditions.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="border-t border-hairline/80 pt-3.5">
              <span className="font-display text-[11px] font-bold text-gold-deep tracking-widest uppercase">
                01 / Canvas
              </span>
              <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-ink">
                400+ GSM Archival Canvas
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Heavyweight pure cotton canvas that maintains permanent drum-like tension, resisting seasonal humidity and sagging.
              </p>
            </div>

            <div className="border-t border-hairline/80 pt-3.5">
              <span className="font-display text-[11px] font-bold text-gold-deep tracking-widest uppercase">
                02 / Detailing
              </span>
              <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-ink">
                Hand-Laid Gold Leafing
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Tactile relief embellishments and reflective metallic foils hand-applied by artisans to create warm, light-shifting radiance.
              </p>
            </div>

            <div className="border-t border-hairline/80 pt-3.5">
              <span className="font-display text-[11px] font-bold text-gold-deep tracking-widest uppercase">
                03 / Framing
              </span>
              <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-ink">
                Precision Floating Frames
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Hand-mitered zero-gap corner joins built from dense, warp-resistant timber, pre-fitted with heavy-duty hanging hardware.
              </p>
            </div>

            <div className="border-t border-hairline/80 pt-3.5">
              <span className="font-display text-[11px] font-bold text-gold-deep tracking-widest uppercase">
                04 / Transit
              </span>
              <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-ink">
                Armoured Casing &amp; Guarantee
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Multi-layer protective armor, waterproof wrapping, and our 100% Free Doorstep Replacement Promise if transit damage ever occurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The Studio Process (Simple 3-Step Editorial Progression) ─── */}
      <section className="py-6 sm:py-8 border-b border-hairline/60">
        <div className="container-page">
          <div className="text-center max-w-xl mx-auto">
            <p className="eyebrow-gold">From Studio to Wall</p>
            <h2 className="mt-1 font-display text-xl sm:text-2xl text-ink">
              How Each Artwork is Created
            </h2>
            <span className="gold-rule-center my-2" />
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
            <div className="text-center md:text-left">
              <p className="font-serif text-2xl font-light text-gold">I.</p>
              <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-ink">
                Intentional Composition
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Each motif is conceptualized with balanced sacred geometry, serene color palettes, and deliberate scale to effortlessly elevate residential spaces.
              </p>
            </div>

            <div className="text-center md:text-left">
              <p className="font-serif text-2xl font-light text-gold">II.</p>
              <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-ink">
                Artisanal Handcrafting
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Printed using 12-color archival giclée pigments on heavy canvas, then individually enriched with hand-painted gold foils and protective finishes.
              </p>
            </div>

            <div className="text-center md:text-left">
              <p className="font-serif text-2xl font-light text-gold">III.</p>
              <h3 className="mt-1 font-display text-sm sm:text-base font-bold text-ink">
                Master Framing &amp; Inspection
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Mounted into custom floating frames, pre-fitted with hanging hardware, and reviewed across multi-point studio quality checks before dispatch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Studio Invitation (Warm, Quiet Luxury - In Bone-Soft Tones) ── */}
      <section className="py-6 sm:py-8 bg-bone-soft/70">
        <div className="container-page text-center max-w-2xl">
          <p className="eyebrow-gold">The Dreamz Decor Studio</p>
          <h2 className="mt-1.5 font-display text-xl sm:text-2xl text-ink leading-tight">
            Bring Timeless Art Into Your Living Space.
          </h2>
          <span className="gold-rule-center my-2" />
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
            Explore our curated collections or connect directly with our studio advisory for personalized size, framing, and styling assistance.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button asChild variant="primary" size="sm" className="rounded-full px-6 text-xs uppercase tracking-wider">
              <Link to="/shop">
                Explore The Collections
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full px-6 text-xs uppercase tracking-wider bg-bone">
              <Link to="/contact">
                Private Advisory
              </Link>
            </Button>
          </div>

          <div className="mt-4 pt-3 border-t border-hairline/60 flex flex-wrap items-center justify-center gap-4 text-[11px] text-ink-muted">
            <span>Amritsar, Punjab</span>
            <span>·</span>
            <span>+91 82848 65051</span>
            <span>·</span>
            <span>dreamzdecor30@gmail.com</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function ContactPage({ page }) {
  const contact = useSettingsStore((s) => s.settings.contact) || {};
  const email =
    !contact.email || contact.email.toLowerCase().includes('support@dreamzdecor.com')
      ? 'dreamzdecor30@gmail.com'
      : contact.email;
  const phone = !contact.phone || !contact.phone.trim() ? '+91 82848 65051' : contact.phone;
  const tel = phone.replace(/[^+\d]/g, '');

  const [inquiryType, setInquiryType] = useState('custom');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'Bespoke Sizing & Custom Canvas Request',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const handleInquiryType = (type, defaultSubj) => {
    setInquiryType(type);
    setForm((f) => ({ ...f, subject: defaultSubj }));
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/contact', form);
      toast.success(res?.message || "Thanks for reaching out — our concierge will contact you within 1 business day.");
      setForm({ name: '', phone: '', email: '', subject: 'Bespoke Sizing & Custom Canvas Request', message: '' });
    } catch (err) {
      toast.error(err?.message || 'Could not send your message. Please reach out via WhatsApp or email directly.');
    } finally {
      setSending(false);
    }
  };

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    'Grand Trunk Road, Baba Phoola Singh, Amritsar, Punjab'
  )}&output=embed`;

  return (
    <div className="bg-bone min-h-screen">
      <Seo
        title="Contact Us — Private Art Advisory & Studio Concierge | DreamzDecors"
        description={page.intro}
        canonical="/contact"
      />

      {/* ── 1. Luxury Concierge Hero ─────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-gradient-to-b from-bone-soft/60 to-bone py-10 sm:py-14">
        <div className="container-page text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-deep">
            <MessageCircle size={13} />
            <span>Private Art Advisory · Studio Concierge</span>
          </div>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-ink">
            Let’s Connect &amp; Elevate Your Walls
          </h1>
          <span className="gold-rule-center" />
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-ink-soft">
            Whether inquiring about custom canvas sizing, bespoke floating frame profiles, corporate projects, or tracking an active dispatch, our master studio concierge is at your service.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-soft">
            <span className="flex items-center gap-2">
              <Clock size={14} className="text-gold" />
              1 Business Day Guaranteed Reply
            </span>
            <span className="hidden sm:inline text-hairline select-none">•</span>
            <span className="flex items-center gap-2">
              <Palette size={14} className="text-gold" />
              Complimentary Wall Scaling Advice
            </span>
            <span className="hidden sm:inline text-hairline select-none">•</span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              Insured Pan-India Studio Dispatch
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Four Multi-Channel Direct Contact Cards ──────────── */}
      <div className="container-page -mt-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: WhatsApp Live */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-600/30 bg-bone-soft p-5 transition duration-200 hover:border-emerald-600 hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-600">
                  <MessageCircle size={20} />
                </div>
                <span className="rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Fastest Reply
                </span>
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink">WhatsApp Concierge</h3>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                Direct chat with our art curators for wall dimensions, frame advice, and quick inquiries.
              </p>
              <p className="mt-2.5 font-mono text-xs font-semibold text-ink">+91 82848 65051</p>
            </div>
            <a
              href="https://wa.me/918284865051"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-emerald-700"
            >
              Chat on WhatsApp <FiArrowRight />
            </a>
          </div>

          {/* Card 2: Phone Desk */}
          <div className="flex flex-col justify-between rounded-2xl border border-hairline/80 bg-bone-soft p-5 transition duration-200 hover:border-gold hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                  <Phone size={19} />
                </div>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-gold-deep">
                  Mon–Sat 10–7
                </span>
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink">Phone Advisory</h3>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                Speak directly with our studio specialists regarding framing miters and placement.
              </p>
              <p className="mt-2.5 font-mono text-xs font-semibold text-ink">+91 82848 65051</p>
            </div>
            <a
              href={`tel:${tel}`}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-hairline bg-bone px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition hover:border-gold hover:text-gold-deep"
            >
              Call Studio Desk <FiArrowRight />
            </a>
          </div>

          {/* Card 3: Email Desk */}
          <div className="flex flex-col justify-between rounded-2xl border border-hairline/80 bg-bone-soft p-5 transition duration-200 hover:border-gold hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                  <Mail size={19} />
                </div>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-gold-deep">
                  Priority Inbox
                </span>
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink">Direct Email</h3>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                For commercial projects, formal quotations, tax invoices, and damage claims.
              </p>
              <p className="mt-2.5 break-all font-mono text-xs font-semibold text-ink">{email}</p>
            </div>
            <a
              href={`mailto:${email}`}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-hairline bg-bone px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition hover:border-gold hover:text-gold-deep"
            >
              Send an Email <FiArrowRight />
            </a>
          </div>

          {/* Card 4: Amritsar Studio */}
          <div className="flex flex-col justify-between rounded-2xl border border-hairline/80 bg-bone-soft p-5 transition duration-200 hover:border-gold hover:shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/10 text-ink">
                  <MapPin size={19} />
                </div>
                <span className="rounded-full bg-bone px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted">
                  Amritsar, PB
                </span>
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink">Heritage Studio</h3>
              <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                Handcrafted in our Punjab workshop and dispatched safely to doorsteps nationwide.
              </p>
              <p className="mt-2.5 text-xs text-ink leading-relaxed">Grand Trunk Road, Baba Phoola Singh, Amritsar</p>
            </div>
            <div className="mt-4 text-center rounded-xl bg-bone border border-hairline/60 py-2 text-[11px] font-medium text-ink-muted">
              Pan-India Insured Dispatch
            </div>
          </div>

        </div>
      </div>

      {/* ── 3. Main Form & Guarantees (Balanced 12-Column Grid) ─── */}
      <div className="container-page py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">

          {/* Form Left (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-hairline/80 bg-bone-soft p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow-gold">Direct Message</p>
                <h2 className="mt-1 font-display text-xl sm:text-2xl text-ink">Send Us an Inquiry</h2>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
                <Send size={15} />
              </div>
            </div>

            {/* Inquiry Topic Selector Tabs */}
            <div className="mt-6">
              <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted block mb-2">
                What can we help you with?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'custom', label: 'Custom Sizing', subj: 'Bespoke Sizing & Custom Canvas Request' },
                  { id: 'tracking', label: 'Order Status', subj: 'Order Dispatch & Tracking Inquiry' },
                  { id: 'claim', label: 'Damage Claim', subj: 'Transit Damage / Replacement Request' },
                  { id: 'general', label: 'General Query', subj: 'Product & Interior Styling Inquiry' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleInquiryType(t.id, t.subj)}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-medium transition text-center ${
                      inquiryType === t.id
                        ? 'border-gold bg-gold/15 text-gold-deep font-semibold shadow-2xs'
                        : 'border-hairline bg-bone text-ink-soft hover:border-gold/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-name">
                    Full Name *
                  </label>
                  <Input
                    id="c-name"
                    placeholder="e.g. Ananya Sharma"
                    className="mt-1.5 bg-bone"
                    value={form.name}
                    onChange={set('name')}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-phone">
                    Phone Number (Optional)
                  </label>
                  <Input
                    id="c-phone"
                    placeholder="e.g. +91 98765 43210"
                    className="mt-1.5 bg-bone"
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-email">
                  Email Address *
                </label>
                <Input
                  id="c-email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="mt-1.5 bg-bone"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-subject">
                  Subject
                </label>
                <Input
                  id="c-subject"
                  placeholder="Subject of your message"
                  className="mt-1.5 bg-bone"
                  value={form.subject}
                  onChange={set('subject')}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-msg">
                  Message *
                </label>
                <textarea
                  id="c-msg"
                  rows={4}
                  required
                  value={form.message}
                  onChange={set('message')}
                  placeholder={
                    inquiryType === 'custom'
                      ? 'Tell us your wall dimensions (width x height) or room type (living room, bedroom), and any specific art piece in mind...'
                      : inquiryType === 'claim'
                      ? 'Include your Order ID and describe the condition of the parcel. You can also share photos via WhatsApp for faster resolution...'
                      : 'How can our studio team assist you?'
                  }
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-bone px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={sending}
                className="w-full justify-center bg-gold-deep text-white hover:bg-gold-deep/90 uppercase tracking-[0.14em]"
              >
                {sending ? 'Dispatching Message…' : <>Send Message to Studio <FiArrowRight /></>}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
                <Lock size={12} className="text-gold" />
                <span>Your contact details are strictly confidential. No marketing spam, ever.</span>
              </div>
            </form>
          </div>

          {/* Guarantees & Advisory Right (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <Palette size={20} />
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink">
                Bespoke Sizing &amp; Wall Scaling
              </h3>
              <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                Need a specific oversized aspect ratio, or a 3-panel split for a double-height stairwell? Drop us your wall dimensions or room photograph. Our design team will digitally superimpose the artwork on your wall free of charge.
              </p>
            </div>

            <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink">
                100% Free Doorstep Damage Replacement
              </h3>
              <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                We take full responsibility for shipping. If the outer carton or artwork arrives damaged, share a continuous uncut unboxing video within 48 hours to WhatsApp or email. An uncut unboxing video is strictly mandatory for damage claim approval, and we dispatch a fresh replacement immediately at zero extra charge with no return-pickup hassle.
              </p>
            </div>

            <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 sm:p-6 shadow-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <Clock size={20} />
              </div>
              <h3 className="mt-3.5 font-display text-base font-bold text-ink">
                Studio Response SLA
              </h3>
              <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                Our support team is staffed by human art advisors, not automated chat bots. We respond to all inquiries within 1 business day (Mon–Sat: 10:00 AM – 7:00 PM).
              </p>
            </div>

            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5 text-center">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                Have Quick Questions?
              </h4>
              <p className="mt-1 text-xs text-ink-soft">
                Check our Knowledge Base for immediate answers on dispatch timelines and materials.
              </p>
              <div className="mt-3 flex justify-center gap-3">
                <Button asChild variant="outline" size="sm" className="bg-bone text-xs">
                  <Link to="/faq">View FAQ</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="bg-bone text-xs">
                  <Link to="/shipping">Shipping Policy</Link>
                </Button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── 4. Studio Location Map & Dispatch Center ─────────────── */}
      <div className="border-t border-hairline/60 bg-bone-soft/40 py-12 sm:py-16">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            
            {/* Map (7 cols) */}
            <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-hairline/80 shadow-md">
              <iframe
                title="DreamzDecors Studio Location in Amritsar"
                src={mapSrc}
                width="100%"
                height="360"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Studio Info (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <p className="eyebrow-gold">Punjab Studio &amp; Dispatch</p>
                <h2 className="mt-1.5 font-display text-2xl text-ink">Our Craftsmanship Hub</h2>
                <span className="mt-2 block h-0.5 w-10 bg-gold" />
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-ink-soft">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-gold-deep" />
                  <div>
                    <p className="font-semibold text-ink">Studio Address</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      Dreamz Decor, Grand Trunk Road, Baba Phoola Singh, Amritsar, Punjab - 143001
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 shrink-0 text-gold-deep" />
                  <div>
                    <p className="font-semibold text-ink">Studio &amp; Dispatch Hours</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      Monday to Saturday: 10:00 AM – 7:00 PM<br />
                      Sunday: Studio Closed (Online orders queued for Monday assembly)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Truck size={18} className="mt-0.5 shrink-0 text-gold-deep" />
                  <div>
                    <p className="font-semibold text-ink">Pan-India Reach</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                      Doorstep insured delivery covering all 28 states &amp; union territories across 19,000+ PIN codes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shipping ─────────────────────────────────────────────────────────────────

const DEFAULT_SHIPPING_FAQS = [
  {
    question: 'How do I track my order once it has been dispatched?',
    answer:
      'Once your artwork is packed and handed over to our delivery partner, tracking details and courier information are provided with your dispatch confirmation. You can also monitor your shipment status anytime under your Account > Orders page, or contact our support team.',
  },
  {
    question: 'What happens if my package arrives damaged in transit?',
    answer:
      'We offer an unconditional 100% Free Doorstep Replacement Guarantee. If the outer carton or artwork shows any transit damage, an uncut, continuous parcel unboxing video (recorded from opening the sealed courier box to inspecting the artwork) is strictly mandatory for claim approval. Share it with us via WhatsApp (+91 82848 65051) or dreamzdecor30@gmail.com within 48 hours, and we will dispatch a brand-new replacement immediately at zero extra cost.',
  },
  {
    question: 'Are large and oversized gallery sets handled safely?',
    answer:
      'Yes. Artworks exceeding 36 inches or multi-panel gallery sets are packed with reinforced corner armor, interior timber-strut support, and shipped via specialized surface cargo to prevent flexing or vibrations.',
  },
  {
    question: 'Can I request a delayed dispatch if I am travelling or renovating?',
    answer:
      'Absolutely! If your home is under renovation or you are away, simply drop us a WhatsApp message or reply to your order confirmation email with your preferred dispatch date. We will hold your artwork safely in our studio and ship it right on your schedule.',
  },
  {
    question: 'Do you deliver to remote or hilly locations across India?',
    answer:
      'Yes, we deliver pan-India covering over 19,000+ PIN codes across all 28 states and union territories. Deliveries are routed to ensure safe doorstep reach.',
  },
  {
    question: 'Are hanging accessories and hardware included in the package?',
    answer:
      'Yes! Every canvas and framed artwork arrives 100% ready-to-hang with pre-installed heavy-duty sawtooth hangers or steel hanging wire, wall-mounting screws, and anchors included in the package.',
  },
];


function ShippingPage({ page }) {
  const steps = [
    {
      title: 'Studio Assembly & Curation',
      sub: 'Step 01',
      text: 'Order verified by master framers. Canvas dimensions, gold-foil textures, and frame miters are scheduled for precision assembly.',
      icon: Sparkles,
    },
    {
      title: 'Quality Assurance & Sealing',
      sub: 'Step 02',
      text: 'Inspected under studio lighting for canvas tension, crisp detail, and pre-fitted hanging hardware before entering multi-tier packaging.',
      icon: ShieldCheck,
    },
    {
      title: 'Insured Priority Dispatch',
      sub: 'Step 03',
      text: 'Handed over to verified logistics partners with transit insurance. Carrier tracking details are provided so you can monitor transit progress.',
      icon: Truck,
    },
    {
      title: 'Doorstep Arrival & Ready to Hang',
      sub: 'Step 04',
      text: 'Arrives in flawless museum-grade condition. Unpack and mount on your wall with the included precision hardware in under 5 minutes.',
      icon: Package,
    },
  ];

  const PACKAGING_LAYERS = [
    {
      step: '01',
      title: 'Archival Static-Free Film',
      desc: 'Each canvas is sealed in static-free archival barrier wrap, safeguarding gold-foil luster and acrylic textures against ambient humidity, dust, and transit friction.',
      badge: 'Surface Guard',
    },
    {
      step: '02',
      title: 'Reinforced Corner Armor',
      desc: 'Heavy-gauge molded hardboard corner protectors encase all 4 corners, safeguarding delicate 45° frame miters against handling drops and point impacts.',
      badge: 'Miter Protection',
    },
    {
      step: '03',
      title: 'Dual-Ply Bubble Cushion',
      desc: 'Industrial-grade multi-chamber shock absorber wrap cushions the entire frame perimeter, dampening long-distance highway vibrations and transit turbulence.',
      badge: 'Shock Absorption',
    },
    {
      step: '04',
      title: 'Timber-Strut Master Crate',
      desc: '5-ply heavy-duty corrugated outer shipping carton reinforced with solid interior timber struts and tamper-evident "Fragile — Artwork" security seals.',
      badge: 'Crush Resistant',
    },
  ];

  const REGIONAL_TIMELINES = [
    {
      zone: 'Metro Cities',
      cities: 'Delhi NCR, Mumbai, Bengaluru, Hyderabad, Pune, Kolkata, Chennai, Ahmedabad',
      days: '4–6 Business Days',
      mode: 'Express Air Priority',
      badge: 'Priority Air',
    },
    {
      zone: 'Northern & Central Hubs',
      cities: 'Chandigarh, Jaipur, Lucknow, Indore, Bhopal, Dehradun, Agra, Kanpur',
      days: '4–7 Business Days',
      mode: 'Express Surface & Air',
      badge: 'High Frequency',
    },
    {
      zone: 'Tier 2, Tier 3 & Rest of India',
      cities: 'State Capitals, Tier 2 & Tier 3 cities across all 28 States & Union Territories',
      days: '6–9 Business Days',
      mode: 'Tracked Direct Transit',
      badge: '19,000+ PIN Codes',
    },
    {
      zone: 'Oversized & Custom Collections',
      cities: 'Canvases over 36 inches & multi-piece triptych gallery sets requiring specialized timber crating',
      days: '8–12 Business Days',
      mode: 'Reinforced Timber Crate',
      badge: 'Special Handling',
    },
  ];

  return (
    <div className="bg-bone w-full">
      <Seo
        title="Shipping & Delivery — DreamzDecors"
        description="Learn about DreamzDecors insured pan-India delivery, 4-layer museum-grade packaging, and live order tracking."
        canonical="/shipping"
      />

      {/* ── 1. Hero: Balanced 2-Column Presentation ────────────────────────── */}
      <section className="border-b border-hairline/70 bg-bone-soft/40 py-12 sm:py-16">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-center">
            
            {/* Left Column (7 cols): Editorial info & Delivery Assurances */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-gold-deep">
                  <Sparkles size={13} />
                  <span>Pan-India Insured Art Logistics • 19,000+ PIN Codes</span>
                </div>

                <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.12] text-ink">
                  Secure, Insured Delivery <br />
                  <span className="italic text-gold-deep">Across India.</span>
                </h1>
                <span className="mt-4 block h-0.5 w-14 bg-gold" />
                <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-ink-soft">
                  From our studio to your living room. Every artwork is individually inspected, encased in 
                  4-layer shock-proof armor, and dispatched with complete transit insurance for effortless peace of mind.
                </p>

                {/* 3 Core Delivery Assurances */}
                <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-hairline/60 pt-6">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 text-xs">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink">Pan-India Reach</p>
                      <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Delivery across 19,000+ PIN codes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 text-xs">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink">100% Transit Insured</p>
                      <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Free replacement on damage</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 text-xs">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink">Ready To Hang</p>
                      <p className="text-[11px] text-ink-muted leading-tight mt-0.5">Mounting kit included</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Anchor Links */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href="#shipping-journey"
                    className="inline-flex items-center gap-2 rounded-xl border border-gold-deep bg-gold-deep px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-bone transition hover:bg-gold shadow-xs"
                  >
                    <span>View Delivery Process</span>
                    <FiArrowRight size={13} />
                  </a>
                  <a
                    href="#shipping-faqs"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-bone px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft transition hover:border-gold/50 hover:text-gold-deep"
                  >
                    <span>Delivery FAQs</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Highlights & Studio Status Box */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="rounded-2xl border border-hairline/80 bg-bone p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between border-b border-hairline/60 pb-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-deep">Fulfillment Operations</span>
                    <h3 className="text-lg font-serif font-bold text-ink">Delivery Highlights</h3>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Studio Active
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-deep">
                      <Clock size={19} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">1–3 Days Studio Dispatch</p>
                      <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                        Hand-checked for canvas tension, gold foil luster, and frame miter joins before sealing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-deep">
                      <Truck size={19} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">4–7 Days Pan-India Transit</p>
                      <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                        Direct priority transit connectivity across 19,000+ PIN codes in all 28 states.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                      <ShieldCheck size={19} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">100% Free Doorstep Replacement</p>
                      <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
                        Zero return hassle if your parcel sustains transit damage (uncut unboxing video required). Brand-new piece dispatched immediately.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-hairline/60 pt-4 flex items-center justify-between text-xs text-ink-soft">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                    <ShieldCheck size={14} /> Guaranteed Safe Delivery
                  </span>
                  <span className="text-[11px] text-ink-muted">Mon–Sat Dispatches</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Full-Width 4-Metric Trust Strip ─────────────────────────────── */}
      <section className="border-b border-hairline/70 bg-bone py-6 sm:py-8">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-hairline/60">
            <div className="flex items-center gap-3.5 px-2 py-2">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <MapPin size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">19,000+ PIN Codes</p>
                <p className="text-xs text-ink-muted">Pan-India doorstep reach</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-2 py-2 pt-4 sm:pt-2 sm:pl-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <ShieldCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">100% Insured Transit</p>
                <p className="text-xs text-ink-muted">Zero-cost replacement guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-2 py-2 pt-4 sm:pt-2 sm:pl-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <Layers size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">4-Tier Armor Packaging</p>
                <p className="text-xs text-ink-muted">Anti-shock corner &amp; crate system</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 px-2 py-2 pt-4 sm:pt-2 sm:pl-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                <Package size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Ready-To-Hang Kit</p>
                <p className="text-xs text-ink-muted">Wall-mounting hardware included</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Step Journey: Horizontal Connected Workflow ─────────────────── */}
      <section id="shipping-journey" className="border-b border-hairline/70 bg-bone-soft/30 py-12 sm:py-16">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="border-b border-hairline/60 pb-6">
            <p className="eyebrow-gold">From Studio To Sanctuary</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
              How Your Artwork Travels
            </h2>
            <span className="mt-3 block h-0.5 w-12 bg-gold" />
            <p className="mt-2.5 max-w-2xl text-xs sm:text-sm text-ink-soft leading-relaxed">
              Transparent, end-to-end milestone workflow from the moment your order is queued in our studio to doorstep arrival.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ title, sub, text, icon: StepIcon }, i) => (
              <div
                key={title}
                className="group relative flex flex-col justify-between rounded-2xl border border-hairline/80 bg-bone p-6 shadow-xs transition-all duration-300 hover:border-gold/50 hover:shadow-md"
                style={{ borderTop: '3px solid rgb(197 158 89 / 0.7)' }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-deep transition-transform group-hover:scale-105">
                      <StepIcon size={20} />
                    </span>
                    <span className="rounded-full bg-bone-soft border border-hairline/70 px-2.5 py-0.5 font-display text-xs font-semibold text-gold-deep">
                      {sub}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-base font-bold text-ink">
                    {title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
                    {text}
                  </p>
                </div>

                <div className="mt-5 border-t border-hairline/40 pt-3 flex items-center justify-between text-[11px] text-ink-muted">
                  <span>Milestone 0{i + 1}</span>
                  <span className="text-emerald-700 font-medium">✓ Tracked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. 4-Layer Museum-Grade Packaging: Editorial 2-Column Showcase ─── */}
      <section className="border-b border-hairline/70 bg-bone py-12 sm:py-16">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Column (5 cols): The Packaging Engineering & Track Record */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div>
                <p className="eyebrow-gold">Zero-Breakage Engineering</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
                  4-Layer Museum Packaging
                </h2>
                <span className="mt-3 block h-0.5 w-12 bg-gold" />
                <p className="mt-3 text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Every DreamzDecors canvas is an archival investment. We custom-engineered a 4-tier armor system 
                  designed to eliminate pressure points, absorb highway vibrations, and withstand accidental drops across all Indian routes.
                </p>
              </div>

              {/* Transit Track Record Callout Box */}
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-6 text-gold-deep shadow-xs">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold-deep">
                    <ShieldCheck size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Transit Track Record</p>
                    <p className="text-xs text-ink-soft mt-0.5">Over 15,000+ pieces delivered with less than 0.1% transit damage claims.</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-gold/20 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-xs font-semibold text-gold-deep">
                    100% Free Doorstep Replacement
                  </span>
                  <span className="rounded-lg bg-bone/90 border border-gold/25 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                    Zero Return Paperwork
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): The 4 Layers Stacked List */}
            <div className="lg:col-span-7 flex flex-col gap-3.5">
              {PACKAGING_LAYERS.map((layer) => (
                <div
                  key={layer.step}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-hairline/80 bg-bone-soft/70 p-5 transition hover:border-gold/50 hover:bg-bone hover:shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 font-display text-base font-bold text-gold-deep">
                      {layer.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-serif text-base font-bold text-ink">
                          {layer.title}
                        </h3>
                        <span className="rounded bg-gold/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold-deep">
                          {layer.badge}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-ink-soft leading-relaxed max-w-xl">
                        {layer.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                      ✓ QC Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. Delivery Timelines by Region ─────────────────────────────────── */}
      <section className="border-b border-hairline/70 bg-bone-soft/40 py-12 sm:py-16">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="border-b border-hairline/60 pb-6">
            <p className="eyebrow-gold">Predictable Schedules</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
              Transit Schedules by Region
            </h2>
            <span className="mt-3 block h-0.5 w-12 bg-gold" />
            <p className="mt-2.5 max-w-2xl text-xs sm:text-sm text-ink-soft leading-relaxed">
              Standard pan-India logistics schedules across all 28 states and union territories.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {REGIONAL_TIMELINES.map((item) => (
              <div
                key={item.zone}
                className="flex flex-col justify-between rounded-2xl border border-hairline/80 bg-bone p-6 shadow-xs transition hover:border-gold/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-hairline/50 pb-3">
                    <span className="rounded bg-gold/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold-deep">
                      {item.badge}
                    </span>
                    <span className="text-[11px] font-medium text-ink-muted">Insured Cargo</span>
                  </div>

                  <h3 className="mt-3 font-serif text-base font-bold text-ink">
                    {item.zone}
                  </h3>

                  <div className="mt-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-ink-muted">Expected Doorstep Days</span>
                    <p className="font-serif text-xl font-bold text-gold-deep">{item.days}</p>
                  </div>

                  <p className="mt-3 text-xs text-ink-muted leading-relaxed">
                    {item.cities}
                  </p>
                </div>

                <div className="mt-5 border-t border-hairline/50 pt-3 flex items-center justify-between text-[11px] text-ink-soft">
                  <span className="text-ink-muted">Transit Mode:</span>
                  <span className="font-medium text-ink">{item.mode}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk & Custom Orders Callout */}
          <div className="mt-8 rounded-2xl border border-hairline bg-bone p-5 sm:p-6 text-xs text-ink-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-ink text-sm">Custom Sizes &amp; Bulk Hospitality Orders:</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                For commercial interior projects, hotels, or residences requiring custom oversized framing and crating, dispatch dates are coordinated directly with our project concierge.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-hairline bg-bone-soft px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition hover:border-gold/50 hover:text-gold-deep"
            >
              Contact Concierge
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Concierge & Delivery FAQs (Unified Split Layout) ─────────────── */}
      <section id="shipping-faqs" className="bg-bone py-12 sm:py-16">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* Left Column (5 cols): Dedicated Concierge & Guarantees */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div>
                <p className="eyebrow-gold">Dedicated Support</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
                  Delivery Concierge
                </h2>
                <span className="mt-3 block h-0.5 w-12 bg-gold" />
                <p className="mt-3 text-xs sm:text-sm text-ink-soft leading-relaxed">
                  We treat every order as a one-of-a-kind art delivery. Here is our direct support promise for complete peace of mind.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 shadow-xs">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                      <ShieldCheck size={18} />
                    </span>
                    <h4 className="text-sm font-semibold text-ink">100% Free Doorstep Replacement</h4>
                  </div>
                  <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                    If your artwork sustains any transit damage, notify us within 48 hours with a continuous, uncut unboxing video. An unboxing video is strictly mandatory for claim approval, and we dispatch a brand-new replacement immediately with zero return paperwork.
                  </p>
                </div>

                <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 shadow-xs">
                  <div className="flex items-center gap-3 text-gold-deep">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold-deep">
                      <Clock size={18} />
                    </span>
                    <h4 className="text-sm font-semibold text-ink">Address Adjustments &amp; Holds</h4>
                  </div>
                  <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                    Renovating or travelling? Message our concierge with your preferred delivery date, and we will safely hold your order at the studio until you are ready.
                  </p>
                </div>
              </div>

              {/* Concierge Help Callout */}
              <div className="rounded-2xl border border-gold/30 bg-gold/10 p-6 text-center sm:text-left">
                <h4 className="font-serif text-base font-bold text-ink">
                  Have delivery questions?
                </h4>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                  Our customer concierge is available Mon–Sat (10 AM – 7 PM) to assist with address adjustments, holds, or delivery queries.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a
                    href="https://wa.me/918284865051"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-emerald-700 shadow-xs"
                  >
                    <MessageCircle size={14} />
                    WhatsApp Live
                  </a>
                  <Button asChild variant="outline" size="sm" className="rounded-xl bg-bone">
                    <Link to="/contact">Email Support</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Frequently Asked Questions Accordion */}
            <div className="lg:col-span-7 flex flex-col">
              <div>
                <p className="eyebrow-gold">Common Inquiries</p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
                  Delivery FAQs
                </h2>
                <span className="mt-3 block h-0.5 w-12 bg-gold" />
                <p className="mt-3 text-xs sm:text-sm text-ink-soft leading-relaxed">
                  Quick answers to everything you need to know about our pan-India packaging, dispatch timelines, and transit procedures.
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                {DEFAULT_SHIPPING_FAQS.map((faq) => (
                  <FaqItem key={faq.question} faq={faq} defaultOpen={false} />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}


// ─── Terms ────────────────────────────────────────────────────────────────────

function TermsPage({ page }) {
  const [activeSection, setActiveSection] = useState(0);
  const sections = page.sections || [];

  const scrollToSection = (index) => {
    setActiveSection(index);
    const el = document.getElementById(`terms-section-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-bone min-h-screen">
      <Seo
        title="Terms & Conditions — Studio Policies & Customer Governance | DreamzDecors"
        description={page.intro}
        canonical="/terms"
      />

      {/* ── 1. Executive Legal Hero ──────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-gradient-to-b from-bone-soft/60 to-bone py-10 sm:py-14">
        <div className="container-page text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-deep">
            <FileText size={13} />
            <span>Governance &amp; Plain-Language Transparency</span>
          </div>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-ink">
            Terms of Service &amp; Studio Policies
          </h1>
          <span className="gold-rule-center" />
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-ink-soft">
            Last updated: January 2026 · Plain-language guidelines governing orders, pan-India insured shipping, transit damage replacements, and intellectual property.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-soft">
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              100% Free Doorstep Transit Guarantee
            </span>
            <span className="hidden sm:inline text-hairline select-none">•</span>
            <span className="flex items-center gap-2">
              <Lock size={14} className="text-gold" />
              Razorpay 256-Bit Encrypted Payments
            </span>
            <span className="hidden sm:inline text-hairline select-none">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-gold" />
              18% GST Inclusive Pricing
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Interactive 2-Column Portal Layout ────────────────── */}
      <div className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">

          {/* Left Column (Sticky TOC & Highlights, 4 cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
            
            {/* Table of Contents */}
            <div className="rounded-2xl border border-hairline/80 bg-bone-soft/60 p-5 shadow-xs">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                Table of Contents
              </h3>
              <nav className="mt-3.5 space-y-1">
                {sections.map((sec, i) => (
                  <button
                    key={sec.title}
                    type="button"
                    onClick={() => scrollToSection(i)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition ${
                      activeSection === i
                        ? 'bg-gold/15 text-gold-deep font-semibold shadow-2xs'
                        : 'text-ink-soft hover:bg-bone hover:text-ink'
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bone text-[10px] font-mono text-ink-muted">
                      {i + 1}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Customer Protections Card */}
            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5 shadow-xs">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-deep">
                Key Customer Protections
              </h4>
              <ul className="mt-3 space-y-2.5 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span><strong>Zero Transit Risk:</strong> 100% free doorstep replacement if parcel is damaged in transit (uncut unboxing video mandatory within 48h).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span><strong>GST Inclusive:</strong> All product prices include 18% GST with formal digital invoice.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span><strong>Pan-India Insured Dispatch:</strong> Reaching 19,000+ PIN codes with tracking updates.</span>
                </li>
              </ul>
            </div>

            {/* Official Legal & Grievance Desk */}
            <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-5 text-xs text-ink-soft space-y-2.5">
              <p className="font-semibold text-ink text-xs uppercase tracking-wider">
                Studio Grievance Officer
              </p>
              <p className="leading-relaxed">
                Dreamz Decor, Grand Trunk Road, Baba Phoola Singh, Amritsar, Punjab - 143001
              </p>
              <div className="pt-1 space-y-1">
                <p>Email: <a href="mailto:dreamzdecor30@gmail.com" className="text-gold-deep font-semibold hover:underline">dreamzdecor30@gmail.com</a></p>
                <p>Phone: <a href="tel:+918284865051" className="text-gold-deep font-semibold hover:underline">+91 82848 65051</a></p>
              </div>
            </div>

          </aside>

          {/* Right Column (Structured Legal Sections, 8 cols) */}
          <main className="lg:col-span-8 space-y-8">
            {sections.map((section, i) => (
              <section
                key={section.title}
                id={`terms-section-${i}`}
                className="scroll-mt-28 rounded-2xl border border-hairline/80 bg-bone-soft/40 p-6 sm:p-8 shadow-xs transition duration-200 hover:border-gold/40"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-hairline/60">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/15 font-mono text-sm font-bold text-gold-deep">
                    0{i + 1}
                  </span>
                  <h2 className="font-display text-lg sm:text-xl text-ink font-semibold">
                    {section.title}
                  </h2>
                </div>

                {section.body && (
                  <div className="mt-4 space-y-3">
                    {section.body.map((para, pi) => (
                      <p
                        key={pi}
                        className="text-xs sm:text-sm leading-relaxed sm:leading-7 text-ink-soft"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {section.bullets && (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((item, bi) => (
                      <li
                        key={bi}
                        className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-ink-soft"
                      >
                        <ChevronRight size={15} className="mt-1 shrink-0 text-gold-deep" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Helpful Takeaway Callout for Key Sections */}
                {section.title.toLowerCase().includes('return') && (
                  <div className="mt-5 rounded-xl border border-emerald-600/30 bg-emerald-600/10 p-4 text-xs text-emerald-900 flex items-start gap-2.5">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold">Transit Damage Protection Window:</p>
                      <p className="mt-0.5 leading-relaxed">
                        A continuous, uncut parcel unboxing video (from sealed courier carton to inspecting the artwork) is strictly mandatory for any damage or replacement claim. Please share the video within 48 hours of doorstep delivery via WhatsApp (+91 82848 65051) or email dreamzdecor30@gmail.com for immediate free replacement dispatch.
                      </p>
                    </div>
                  </div>
                )}

                {section.title.toLowerCase().includes('order') && (
                  <div className="mt-5 rounded-xl border border-gold/30 bg-gold/10 p-4 text-xs text-ink-soft flex items-start gap-2.5">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold-deep" />
                    <div>
                      <p className="font-semibold text-ink">Invoicing &amp; Taxes:</p>
                      <p className="mt-0.5 leading-relaxed">
                        All transactions are processed through encrypted Razorpay gateways with digital GST invoices emailed immediately upon order placement.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            ))}

            {/* Bottom Support Desk Notice */}
            <div className="rounded-2xl border border-hairline/80 bg-bone-soft p-6 sm:p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
              <div>
                <p className="eyebrow-gold">Need Legal Clarification?</p>
                <h3 className="mt-1 font-display text-xl text-ink">Questions regarding our policies?</h3>
                <p className="mt-1.5 text-xs text-ink-soft max-w-md leading-relaxed">
                  Our studio administration is available to assist with contractual, architectural, or commercial queries.
                </p>
              </div>
              <Button asChild variant="primary" size="md" className="shrink-0 uppercase tracking-wider text-xs">
                <Link to="/contact">
                  Contact Studio Desk <FiArrowRight />
                </Link>
              </Button>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ContentPage({ pageKey }) {
  // Admin override (if any) is shallow-merged over the built-in default,
  // so the layout is unchanged and partial edits stay safe.
  const { data } = useFetch(`/content/${pageKey}`, { deps: [pageKey], cache: `dd:content:${pageKey}` });
  const base = contentPages[pageKey];
  const override = data?.data;
  const page = override && Object.keys(override).length ? { ...base, ...override } : base;
  if (!page) return <Navigate to="/404" replace />;

  if (pageKey === 'about')    return <AboutPage page={page} />;
  if (pageKey === 'faq')      return <FaqPage page={page} />;
  if (pageKey === 'contact')  return <ContactPage page={page} />;
  if (pageKey === 'shipping') return <ShippingPage page={page} />;
  if (pageKey === 'terms')    return <TermsPage page={page} />;

  return <Navigate to="/404" replace />;
}
