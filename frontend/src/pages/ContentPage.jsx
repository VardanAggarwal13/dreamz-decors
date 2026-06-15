import { useState } from 'react';
import { toast } from 'sonner';
import useFetch from '@/hooks/useFetch';
import api from '@/lib/api';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, MapPin, Mail, Clock, Phone, Search, MessageCircle, Palette, Sparkles, Award, ShieldCheck } from 'lucide-react';
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
  const allFaqs = (page.sections || []).flatMap((s) => s.faqs || []);

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
      <Seo
        title="FAQ — DreamzDecors"
        description={page.intro}
        canonical="/faq"
        schema={allFaqs.length ? faqSchema(allFaqs) : undefined}
      />

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

// Value-card icons are stored as names in content (admin-editable); map them
// back to components here. Unknown/missing names fall back to ShieldCheck.
const ABOUT_ICONS = {
  palette: Palette,
  sparkles: Sparkles,
  award: Award,
  shield: ShieldCheck,
};

function AboutPage({ page }) {
  const about = (page.sections && page.sections[0]) || { body: [] };
  const body = Array.isArray(about.body) ? about.body : [];
  const values = Array.isArray(page.values) ? page.values : [];
  const stats = Array.isArray(page.stats) ? page.stats : [];

  return (
    <div className="bg-bone">
      <Seo title="About Us — DreamzDecors" description={page.intro} canonical="/about" />

      {/* ── 1. Centered Hero ──────────────────────────────────── */}
      <div className="border-b border-hairline/60 bg-bone py-14 text-center sm:py-16">
        <div className="container-page">
          <p className="eyebrow-gold">{page.eyebrow}</p>
          <h1 className="mx-auto mt-3 max-w-2xl whitespace-pre-line font-display text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
            {page.title}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-ink-soft">
            {page.intro}
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
                src={page.storyImage}
                alt="DreamzDecors craftsmanship"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 -right-3 h-14 w-14 rounded-br-xl border-b-2 border-r-2 border-gold/60" />
          </div>

          {/* Text */}
          <div>
            <p className="eyebrow-gold">{page.storyEyebrow}</p>
            <h2 className="mt-3 whitespace-pre-line font-display text-3xl leading-tight text-ink sm:text-4xl">
              {page.storyTitle}
            </h2>
            <div className="mt-5 space-y-4">
              {body.map((para, i) => (
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
            <p className="eyebrow-gold">{page.valuesEyebrow}</p>
            <h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{page.valuesTitle}</h2>
            <span className="gold-rule-center" />
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon, title, text }) => {
              const Icon = ABOUT_ICONS[icon] || ShieldCheck;
              return (
                <div key={title} className="rounded-2xl border border-hairline/60 bg-bone p-6 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-hairline/60">
                    <Icon size={18} strokeWidth={1.5} className="text-gold" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-soft">{text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 4. Dark craft section ─────────────────────────────── */}
      <div className="bg-ink py-16 text-center sm:py-20">
        <div className="container-page">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60">{page.craftEyebrow}</p>
          <h2 className="mx-auto mt-4 max-w-2xl whitespace-pre-line font-display text-4xl leading-snug text-bone-soft sm:text-5xl">
            {page.craftTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-bone/55">
            {page.craftText}
          </p>
          <Button
            asChild
            variant="outline"
            size="md"
            className="mt-8 border-bone/35 text-bone hover:border-bone/60 hover:bg-bone/10"
          >
            <Link to="/shop">{page.craftCtaLabel} <FiArrowRight /></Link>
          </Button>
        </div>
      </div>

      {/* ── 5. Stats — 4 bordered cards ───────────────────────── */}
      <div className="py-14 sm:py-16">
        <div className="container-page">
          <div className="text-center">
            <h2 className="font-display text-3xl text-ink sm:text-4xl">{page.statsTitle}</h2>
            <span className="gold-rule-center" />
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ value, label }) => (
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

// Build the contact detail cards from admin-editable Settings (with safe
// fallbacks). Phone/hours cards are omitted when those fields are blank.
function contactCards(contact = {}) {
  const tel = (contact.phone || '').replace(/[^+\d]/g, '');
  return [
    { Icon: MapPin, label: 'Our Studio', value: contact.address || 'Made in India, delivering pan India' },
    ...(contact.phone
      ? [{ Icon: Phone, label: 'Phone', value: contact.phone, href: tel ? `tel:${tel}` : undefined }]
      : []),
    ...(contact.email
      ? [{ Icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` }]
      : []),
    ...(contact.hours ? [{ Icon: Clock, label: 'Business Hours', value: contact.hours }] : []),
  ];
}

const EMPTY_CONTACT_FORM = { name: '', email: '', subject: '', message: '' };

function ContactPage({ page }) {
  const contact = useSettingsStore((s) => s.settings.contact) || {};
  const cards = contactCards(contact);
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(contact.address || 'India')}&output=embed`;

  const [form, setForm] = useState(EMPTY_CONTACT_FORM);
  const [sending, setSending] = useState(false);
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
      toast.success(res?.message || "Thanks for reaching out — we'll get back to you soon.");
      setForm(EMPTY_CONTACT_FORM);
    } catch (err) {
      toast.error(err?.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

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
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-name">
                  Full Name
                </label>
                <Input id="c-name" placeholder="Your full name" className="mt-1.5" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-email">
                  Email Address
                </label>
                <Input id="c-email" type="email" placeholder="your@email.com" className="mt-1.5" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-subject">
                  Subject
                </label>
                <Input id="c-subject" placeholder="How can we help you?" className="mt-1.5" value={form.subject} onChange={set('subject')} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.22em] text-ink-muted" htmlFor="c-msg">
                  Message
                </label>
                <textarea
                  id="c-msg"
                  rows={5}
                  required
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Tell us about your order, custom request, or query..."
                  className="mt-1.5 w-full rounded-xl border border-hairline bg-bone-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-accent/60"
                />
              </div>
              <Button variant="primary" size="md" type="submit" disabled={sending} className="w-full justify-center uppercase tracking-[0.14em]">
                {sending ? 'Sending…' : <>Send Message <FiArrowRight /></>}
              </Button>
            </form>
          </div>

          {/* Details — right */}
          <div>
            <h2 className="font-display text-xl text-ink">Our Details</h2>
            <div className="mt-5 space-y-2.5">
              {cards.map(({ Icon, label, value, href }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl border border-hairline/60 bg-bone-soft p-4 transition hover:border-gold/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline/60">
                    <Icon size={15} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{label}</p>
                    {href ? (
                      <a href={href} className="mt-0.5 block break-words text-sm text-ink-soft transition hover:text-accent">
                        {value}
                      </a>
                    ) : (
                      <p className="mt-0.5 whitespace-pre-line break-words text-sm text-ink-soft">{value}</p>
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
              src={mapSrc}
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

function ShippingPage({ page }) {
  const [info, deliveryTimes, charges, tracking] = page.sections;
  const steps = Array.isArray(page.steps) ? page.steps : [];

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
            {steps.map(({ title, text }, i) => (
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
