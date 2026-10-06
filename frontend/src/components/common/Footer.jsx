import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaPinterestP, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import useFetch from '@/hooks/useFetch';
import { useSettingsStore } from '@/store/settingsStore';

const SOCIAL_LIST = [
  { key: 'instagram', Icon: FaInstagram },
  { key: 'facebook', Icon: FaFacebookF },
  { key: 'pinterest', Icon: FaPinterestP },
  { key: 'youtube', Icon: FaYoutube },
  { key: 'whatsapp', Icon: FaWhatsapp },
];

// Fallback Shop links if categories haven't loaded / none exist yet.
const FALLBACK_SHOP_LINKS = [
  ['Wall Art', '/wall-art'],
  ['Gallery Sets', '/gallery-sets'],
  ['Skateboards', '/skateboards'],
  ['Bundles', '/bundles'],
];

// Help / Company columns point to real pages — static navigation, not content.
const STATIC_COLUMNS = [
  {
    title: 'Help',
    links: [
      ['Shipping and Delivery', '/shipping'],
      ['Contact Us', '/contact'],
      ['FAQ', '/faq'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['Terms', '/terms'],
    ],
  },
];

export default function Footer() {
  const { brand, contact, social } = useSettingsStore((s) => s.settings);
  const configured = SOCIAL_LIST.filter((s) => social?.[s.key]);
  const socialToShow = configured.length ? configured : SOCIAL_LIST;

  // Shop column derives from the live, admin-managed categories.
  const catRes = useFetch('/categories', { cache: 'dd:categories' });
  const categories = catRes.data?.data || [];
  const shopLinks = categories.length
    ? categories.slice(0, 6).map((c) => [c.title, `/${c.slug}`])
    : FALLBACK_SHOP_LINKS;
  const navColumns = [{ title: 'Shop', links: shopLinks }, ...STATIC_COLUMNS];

  const rawDescription =
    !brand?.description || brand.description.includes('secure packaging and safe online checkout')
      ? 'Handcrafted canvas printing, gallery sets, and spiritual art designed to bring warmth, soul, and quiet luxury to modern Indian homes.'
      : brand.description;

  const displayDescription = rawDescription.replace(/canvas paintings/gi, 'canvas printing');

  const footerEmail =
    !contact?.email || contact.email.toLowerCase().includes('support@dreamzdecor.com')
      ? 'dreamzdecor30@gmail.com'
      : contact.email;
  const footerPhone = !contact?.phone || !contact.phone.trim() ? '+91 82848 65051' : contact.phone;
  const footerPhoneTel = footerPhone.replace(/[^+\d]/g, '');

  return (
    <footer className="border-t border-ink/8 bg-bone/85 text-ink">
      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.6fr_1fr] lg:gap-12">
          <div className="text-center sm:text-left lg:-mt-2">
            <Link to="/" aria-label="Dreamz Decor home" className="inline-block">
              <Logo variant="horizontal" className="mx-auto h-12 w-auto sm:mx-0" />
            </Link>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-ink-soft sm:mx-0">
              {displayDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:text-left">
            {navColumns.map((column) => (
              <div key={column.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink">{column.title}</h4>
                <span className="mx-auto mt-2 block h-px w-8 bg-gold sm:mx-0" />
                <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                  {column.links.map(([label, href]) => (
                    <li key={label}>
                      <Link to={href} className="transition hover:text-accent">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-hairline pt-8 text-center sm:text-left lg:border-t-0 lg:pt-0">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink">Support</h4>
            <span className="mx-auto mt-2 block h-px w-8 bg-gold sm:mx-0" />
            <ul className="mt-4 space-y-4 text-sm text-ink-soft">
              <li className="flex justify-center gap-3 sm:justify-start">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <a href={`mailto:${footerEmail}`} className="hover:text-accent">{footerEmail}</a>
              </li>
              <li className="flex justify-center gap-3 sm:justify-start">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <a href={`tel:${footerPhoneTel}`} className="hover:text-accent">{footerPhone}</a>
              </li>
              {contact?.address && (
                <li className="flex justify-center gap-3 sm:justify-start">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-ink-soft sm:justify-start">
              {socialToShow.map(({ key, Icon }) => (
                <a
                  key={key}
                  href={social?.[key] || '#'}
                  target={social?.[key] ? '_blank' : undefined}
                  rel="noreferrer"
                  aria-label={key}
                  className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-bone transition hover:border-accent hover:bg-accent hover:text-bone"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-5 text-center text-xs text-ink-muted lg:flex-row lg:text-left">
          <p className="shrink-0">
            &copy; {new Date().getFullYear()} {brand?.name || 'Dreamz Decor'}. Proudly made in India.
          </p>

          {/* Center: Essential trust & policies */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ink-muted">
            <Link to="/terms" className="transition hover:text-gold-deep">
              Privacy &amp; Terms
            </Link>
            <span className="text-hairline select-none">•</span>
            <Link to="/shipping" className="transition hover:text-gold-deep">
              Shipping &amp; Delivery
            </Link>
            <span className="text-hairline select-none">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft">
              <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              100% Safe &amp; Secure Checkout
            </span>
          </div>

          <a
            href="https://www.smartvings.com/"
            target="_blank"
            rel="noopener"
            className="group inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-gold-deep"
            title="Smartvings — Web Design & Development Agency"
          >
            <span>Designed &amp; Developed by</span>
            <span className="font-semibold text-ink transition-colors group-hover:text-gold-deep underline-offset-4 group-hover:underline">
              Smartvings
            </span>
            <svg
              className="h-3 w-3 opacity-60 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-gold-deep"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
