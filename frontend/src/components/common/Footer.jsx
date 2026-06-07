import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaPinterestP, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { Mail, MapPin } from 'lucide-react';
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
  ['Wall Art', '/shop/wall-art'],
  ['Gallery Sets', '/shop/gallery-sets'],
  ['Skateboards', '/shop/skateboards'],
  ['Bundles', '/shop/bundles'],
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
  const catRes = useFetch('/categories');
  const categories = catRes.data?.data || [];
  const shopLinks = categories.length
    ? categories.slice(0, 6).map((c) => [c.title, `/shop/${c.slug}`])
    : FALLBACK_SHOP_LINKS;
  const navColumns = [{ title: 'Shop', links: shopLinks }, ...STATIC_COLUMNS];

  return (
    <footer className="border-t border-ink/8 bg-bone/85 text-ink">
      <div className="container-page py-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1.6fr_1fr] lg:gap-12">
          <div className="text-center sm:text-left lg:-mt-2">
            <Link to="/" aria-label="Dreamz Decor home" className="inline-block">
              <Logo variant="horizontal" className="mx-auto h-12 w-auto sm:mx-0" />
            </Link>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-ink-soft sm:mx-0">
              {brand?.description}
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
              {contact?.email && (
                <li className="flex justify-center gap-3 sm:justify-start">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <a href={`mailto:${contact.email}`} className="hover:text-accent">{contact.email}</a>
                </li>
              )}
              {contact?.phone && (
                <li className="flex justify-center gap-3 sm:justify-start">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent opacity-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-accent">{contact.phone}</a>
                </li>
              )}
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

        <div className="mt-8 border-t border-hairline pt-5 text-center text-xs text-ink-muted">
          &copy; {new Date().getFullYear()} {brand?.name || 'Dreamz Decor'}. Proudly made in India.
        </div>
      </div>
    </footer>
  );
}
