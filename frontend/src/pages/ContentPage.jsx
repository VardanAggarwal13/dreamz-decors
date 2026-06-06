import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, MapPin, Mail, Clock, Phone, Search, MessageCircle, Palette, Sparkles, Award, ShieldCheck } from 'lucide-react';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import Seo from '@/components/common/Seo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contentPages } from '@/lib/siteContent';

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
      <div className="container-page py-8 sm:py-10 lg:py-12">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl leading-[1.0] text-ink sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-hairline/50 pt-5">
          {tagline && (
            <p className="max-w-lg text-sm leading-7 text-ink-soft">{tagline}</p>
          )}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-6 sm:gap-10">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div className="font-display text-xl text-gold">{value}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-ink-muted">{label}</div>
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

function FaqItem({ faq, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-hairline/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[14px] font-medium text-ink">{faq.question}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-all duration-200 ${open ? 'rotate-180 text-gold' : 'text-ink-muted'}`}
        />
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0">
          <p className="px-5 pb-4 text-sm leading-7 text-ink-soft">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

function FaqPage({ page }) {
  const [query, setQuery] = useState('');

  const visibleSections = query.trim()
    ? page.sections
        .map(s => ({
          ...s,
          faqs: s.faqs.filter(
            f =>
              f.question.toLowerCase().includes(query.toLowerCase()) ||
              f.answer.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter(s => s.faqs.length > 0)
    : page.sections;

  return (
    <div className="bg-bone">
      <Seo title="FAQ — DreamzDecors" description={page.intro} canonical="/faq" />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone py-10 text-center sm:py-12">
        <div className="container-page">
          <p className="eyebrow-gold">Help Center</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <span className="gold-rule-center" />
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-soft">{page.intro}</p>
          <div className="mx-auto mt-6 max-w-lg">
            <div className="flex items-center gap-3 rounded-xl border border-hairline bg-bone-soft px-4 py-2.5">
              <Search size={14} className="shrink-0 text-ink-muted" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search your question..."
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Grouped sections ─────────────────────────────────── */}
      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {visibleSections.map((section, si) => (
            <div key={section.title}>
              {/* Category label + rule */}
              <div className="mb-4 flex items-center gap-3">
                <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
                  {section.title}
                </p>
                <div className="h-px flex-1 bg-gold/25" />
              </div>
              {/* Accordion card */}
              <div className="overflow-hidden rounded-xl border border-hairline/60 bg-bone-soft">
                {section.faqs.map((faq, i) => (
                  <FaqItem key={faq.question} faq={faq} defaultOpen={si === 0 && i === 0} />
                ))}
              </div>
            </div>
          ))}

          {visibleSections.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-muted">
              No questions matched your search.
            </p>
          )}
        </div>
      </div>

      {/* ── Still have questions CTA ──────────────────────────── */}
      <div className="border-t border-hairline/60 py-12 text-center">
        <div className="container-page">
          <MessageCircle size={30} strokeWidth={1.5} className="mx-auto text-gold/50" />
          <h2 className="mt-4 font-display text-2xl text-ink sm:text-3xl">Still have questions?</h2>
          <p className="mt-2 text-sm text-ink-soft">Our team is happy to help you personally.</p>
          <Button asChild variant="primary" size="md" className="mt-6 uppercase tracking-[0.14em]">
            <Link to="/contact">Contact Us <FiArrowRight /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

const ABOUT_VALUES = [
  {
    Icon: Palette,
    title: 'Premium Quality',
    text: 'High-grade canvas, premium wooden frames, and durable inks crafted for long-lasting beauty.',
  },
  {
    Icon: Sparkles,
    title: 'Gold Foil Finishing',
    text: 'Signature gold detailing adds richness and sophistication to every artwork.',
  },
  {
    Icon: Award,
    title: 'Made in India',
    text: 'Every product is proudly crafted in India with superior attention to detail.',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure Packaging',
    text: 'Multi-layer protective packaging ensures safe and damage-free delivery.',
  },
];

const ABOUT_STATS = [
  { value: '1,200+', label: 'Happy Customers' },
  { value: '4+',     label: 'Years of Craft' },
  { value: '50+',    label: 'Unique Designs' },
  { value: '100%',   label: 'Made in India' },
];

function AboutPage({ page }) {
  const [about] = page.sections;

  return (
    <div className="bg-bone">
      <Seo title="About Us — DreamzDecors" description={page.intro} canonical="/about" />

      {/* ── 1. Centered Hero ──────────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone py-14 text-center sm:py-16">
        <div className="container-page">
          <p className="eyebrow-gold">Our Story</p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
            Luxury Wall Art,<br />Born in India.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-ink-soft">
            Dreamz Decor was founded with a singular vision — to bring premium artistic beauty into every modern Indian home, crafted with care and precision.
          </p>
        </div>
      </div>

      {/* ── 2. Story — image left, text right ─────────────────── */}
      <div className="container-page py-14 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Image with gold corner accent */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '4/5' }}>
              <img
                src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80"
                alt="DreamzDecors craftsmanship"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-br-xl border-b-2 border-r-2 border-gold/60" />
          </div>

          {/* Text */}
          <div>
            <p className="eyebrow-gold">Who We Are</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
              Premium Decor,<br />Crafted with Passion.
            </h2>
            <div className="mt-5 space-y-4">
              {about.body.map((para, i) => (
                <p key={i} className="text-sm leading-7 text-ink-soft">{para}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Values — 4 icon cards ──────────────────────────── */}
      <div className="border-y border-hairline/60 bg-bone-soft/60 py-14 sm:py-16">
        <div className="container-page">
          <div className="text-center">
            <p className="eyebrow-gold">Our Values</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">What We Stand For</h2>
            <span className="gold-rule-center" />
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_VALUES.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-hairline/60 bg-bone p-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-hairline/60">
                  <Icon size={18} strokeWidth={1.5} className="text-gold" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Dark craft section ─────────────────────────────── */}
      <div className="bg-ink py-16 text-center sm:py-20">
        <div className="container-page">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60">Our Craft</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-snug text-bone-soft sm:text-5xl">
            Every artwork carries<br />a story worth telling.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-bone/55">
            From our in-house studios to doorsteps across India, every piece is built with precision, premium materials, and a deep passion for artistic excellence.
          </p>
          <Button
            asChild
            variant="outline"
            size="md"
            className="mt-8 border-bone/35 text-bone hover:border-bone/60 hover:bg-bone/10"
          >
            <Link to="/shop">Shop the Collection <FiArrowRight /></Link>
          </Button>
        </div>
      </div>

      {/* ── 5. Stats — 4 bordered cards ───────────────────────── */}
      <div className="py-14 sm:py-16">
        <div className="container-page">
          <div className="text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">Our Journey in Numbers</h2>
            <span className="gold-rule-center" />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {ABOUT_STATS.map(({ value, label }) => (
              <div key={label} className="rounded-2xl border border-hairline/60 p-6 text-center">
                <p className="font-display text-3xl text-gold sm:text-4xl">{value}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

const CONTACT_DETAIL_CARDS = [
  {
    Icon: MapPin,
    label: 'Our Studio',
    value: 'Grand Trunk Road, Baba Phoola Singh,\nAmritsar, Punjab',
  },
  {
    Icon: Phone,
    label: 'Phone',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
  },
  {
    Icon: Mail,
    label: 'Email',
    value: 'support@dreamzdecors.com',
    href: 'mailto:support@dreamzdecors.com',
  },
  {
    Icon: Clock,
    label: 'Business Hours',
    value: 'Mon–Sat: 10:00 AM – 7:00 PM\nSunday: Closed',
  },
];

function ContactPage({ page }) {
  return (
    <div className="bg-bone">
      <Seo title="Contact Us — DreamzDecors" description={page.intro} canonical="/contact" />

      {/* ── Centered hero ─────────────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone py-10 text-center sm:py-12">
        <div className="container-page">
          <p className="eyebrow-gold">Get in touch</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Contact Us
          </h1>
          <span className="gold-rule-center" />
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-soft">{page.intro}</p>
        </div>
      </div>

      {/* ── Form + Details ─────────────────────────────────────── */}
      <div className="container-page py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:gap-10">

          {/* Form — left */}
          <div>
            <h2 className="font-display text-xl text-ink">Send Us a Message</h2>
            <form onSubmit={e => e.preventDefault()} className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-name">
                  Full Name
                </label>
                <Input id="c-name" placeholder="Your full name" className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-email">
                  Email Address
                </label>
                <Input id="c-email" type="email" placeholder="your@email.com" className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-subject">
                  Subject
                </label>
                <Input id="c-subject" placeholder="How can we help you?" className="mt-1.5" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-msg">
                  Message
                </label>
                <textarea
                  id="c-msg"
                  rows={5}
                  placeholder="Tell us about your order, custom request, or query..."
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-bone-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-accent/60"
                />
              </div>
              <Button variant="primary" size="md" type="submit" className="w-full justify-center uppercase tracking-[0.14em]">
                Send Message <FiArrowRight />
              </Button>
            </form>
          </div>

          {/* Details — right */}
          <div>
            <h2 className="font-display text-xl text-ink">Our Details</h2>
            <div className="mt-5 space-y-2.5">
              {CONTACT_DETAIL_CARDS.map(({ Icon, label, value, href }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl border border-hairline/60 bg-bone-soft p-4 transition hover:border-gold/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline/60">
                    <Icon size={15} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{label}</p>
                    {href ? (
                      <a href={href} className="mt-0.5 block text-sm text-ink-soft transition hover:text-accent">
                        {value}
                      </a>
                    ) : (
                      <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{value}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Response nudge */}
              <div className="rounded-xl border border-hairline/60 bg-bone p-4">
                <p className="text-[13px] font-semibold text-ink">Response Time</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  We reply within 1 business day. For urgent issues, include your order number.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Find Us / Map ─────────────────────────────────────── */}
      <div className="border-t border-hairline/60 py-10 sm:py-12">
        <div className="container-page">
          <div className="text-center">
            <p className="eyebrow-gold">Location</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Find Us</h2>
            <span className="gold-rule-center" />
          </div>
          <div className="mt-7 overflow-hidden rounded-2xl border border-hairline/60 shadow-sm">
            <iframe
              title="DreamzDecors Studio Location"
              src="https://maps.google.com/maps?q=Grand+Trunk+Road,+Baba+Phoola+Singh,+Amritsar,+Punjab&output=embed"
              width="100%"
              height="360"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shipping ─────────────────────────────────────────────────────────────────

const SHIP_STEPS = [
  { title: 'Confirmed',  text: 'Your order is logged and queued for fulfilment.' },
  { title: 'Processing', text: 'Quality-checked and carefully packed within 1–3 days.' },
  { title: 'Dispatched', text: 'A tracking ID is sent to you by email or message.' },
  { title: 'Delivered',  text: 'Your artwork arrives at the doorstep, ready to hang.' },
];

function ShippingPage({ page }) {
  const [info, deliveryTimes, charges, tracking] = page.sections;

  return (
    <div className="bg-bone">
      <Seo title="Shipping & Delivery — DreamzDecors" description={page.intro} canonical="/shipping" />

      {/* ── 1. Centered Hero ──────────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone py-10 text-center sm:py-12">
        <div className="container-page">
          <p className="eyebrow-gold">{page.eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {page.title}
          </h1>
          <span className="gold-rule-center" />
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-soft">{page.intro}</p>
          <div className="mx-auto mt-7 flex flex-wrap justify-center gap-8 border-t border-hairline/60 pt-6">
            {page.heroStats.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-lg text-gold">{stat.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-ink-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Order Journey — 4 steps ────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone-soft/50 py-12 sm:py-14">
        <div className="container-page">
          <div className="text-center">
            <p className="eyebrow-gold">How It Works</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Your Order's Journey</h2>
            <span className="gold-rule-center" />
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SHIP_STEPS.map(({ title, text }, i) => (
              <div key={title} className="rounded-xl border border-hairline/60 bg-bone p-5">
                <span className="font-display text-2xl text-gold/40">0{i + 1}</span>
                <h3 className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. Delivery Timelines ─────────────────────────────── */}
      <div className="border-b border-hairline/60 py-12 sm:py-14">
        <div className="container-page">
          <div className="text-center">
            <p className="eyebrow-gold">Timelines</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Estimated Delivery</h2>
            <span className="gold-rule-center" />
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {deliveryTimes.cards.map(card => (
              <div key={card.title} className="rounded-xl border border-hairline/60 bg-bone-soft p-6">
                <p className="text-[13px] font-semibold text-ink">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Policy + Charges + Tracking ───────────────────── */}
      <div className="container-page py-12 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-8">

          <div className="flex gap-5">
            <div className="mt-1 w-0.5 shrink-0 self-stretch rounded-full bg-gold/50" />
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-ink">Shipping Policy</h2>
              <ul className="mt-4 space-y-2.5">
                {info.bullets.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-7 text-ink-soft">
                    <ChevronRight size={14} className="mt-[5px] shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="mt-1 w-0.5 shrink-0 self-stretch rounded-full bg-gold/50" />
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-ink">Delivery Charges</h2>
              <div className="mt-4 space-y-3">
                {charges.body?.map((para, i) => (
                  <p key={i} className="text-sm leading-7 text-ink-soft">{para}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-5">
            <div className="mt-1 w-0.5 shrink-0 self-stretch rounded-full bg-gold/50" />
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-ink">Order Tracking</h2>
              <div className="mt-4 space-y-3">
                {tracking.body?.map((para, i) => (
                  <p key={i} className="text-sm leading-7 text-ink-soft">{para}</p>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 5. Help CTA ───────────────────────────────────────── */}
      <div className="border-t border-hairline/60 py-10 text-center">
        <div className="container-page">
          <p className="text-sm font-medium text-ink">Have a question about your delivery?</p>
          <p className="mt-1 text-sm text-ink-soft">Our team replies within 1 business day.</p>
          <Button asChild variant="primary" size="md" className="mt-5 uppercase tracking-[0.14em]">
            <Link to="/contact">Contact Us <FiArrowRight /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Terms ────────────────────────────────────────────────────────────────────

function TermsPage({ page }) {
  return (
    <div className="bg-bone">
      <Seo title="Terms & Conditions — DreamzDecors" description={page.intro} canonical="/terms" />

      {/* ── Hero — left-aligned ───────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone py-10 sm:py-12">
        <div className="container-page">
          <p className="eyebrow-gold">Legal</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-sm text-ink-muted">{page.intro}</p>
        </div>
      </div>

      {/* ── Sections ─────────────────────────────────────────── */}
      <div className="container-page py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          {page.sections.map((section, i) => (
            <section key={section.title} className="flex gap-5">
              {/* Gold left accent bar */}
              <div className="mt-1 w-0.5 shrink-0 self-stretch rounded-full bg-gold/50" />

              <div className="flex-1">
                <h2 className="font-display text-[17px] font-semibold text-ink sm:text-lg">
                  {i + 1}. {section.title}
                </h2>

                {section.body && (
                  <div className="mt-3 space-y-3">
                    {section.body.map((para, pi) => (
                      <p key={pi} className="text-sm leading-7 text-ink-soft">{para}</p>
                    ))}
                  </div>
                )}

                {section.bullets && (
                  <ul className="mt-3 space-y-2">
                    {section.bullets.map((item, bi) => (
                      <li key={bi} className="flex items-start gap-2 text-sm leading-7 text-ink-soft">
                        <ChevronRight size={14} className="mt-[5px] shrink-0 text-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ContentPage({ pageKey }) {
  const page = contentPages[pageKey];
  if (!page) return <Navigate to="/404" replace />;

  if (pageKey === 'about')    return <AboutPage page={page} />;
  if (pageKey === 'faq')      return <FaqPage page={page} />;
  if (pageKey === 'contact')  return <ContactPage page={page} />;
  if (pageKey === 'shipping') return <ShippingPage page={page} />;
  if (pageKey === 'terms')    return <TermsPage page={page} />;

  return <Navigate to="/404" replace />;
}
