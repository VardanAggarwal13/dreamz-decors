import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebookF, FaPinterestP, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Logo from './Logo';

const columns = [
  {
    title: 'Shop',
    links: [
      ['Wall Art', '/shop/wall-art'],
      ['Neon Signs', '/shop/neon-signs'],
      ['Skateboards', '/shop/skateboards'],
      ['Custom Orders', '/shop/custom'],
      ['Bundles', '/shop?filter=bundles'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Track Order', '/track'],
      ['Shipping & Delivery', '/shipping'],
      ['Returns & Refunds', '/returns'],
      ['Contact Us', '/contact'],
      ['FAQ', '/faq'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['Blog', '/blog'],
      ['Reviews', '/reviews'],
      ['Press', '/press'],
      ['Careers', '/careers'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/8 bg-bone-muted">
      <div className="container-page grid grid-cols-1 gap-10 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo variant="horizontal" className="mb-6 h-18 w-auto sm:h-20" />
          <h3 className="font-display text-2xl">Stay in the loop</h3>
          <p className="mt-2 max-w-sm text-sm text-ink/70">
            Drops, designer collabs and member-only sales. No spam, ever.
          </p>
          <form className="mt-4 flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input type="email" placeholder="you@email.com" required />
            <Button variant="primary" size="md" type="submit">Join</Button>
          </form>
          <div className="mt-6 flex gap-3 text-ink/70">
            {[FaInstagram, FaFacebookF, FaPinterestP, FaYoutube, FaWhatsapp].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social"
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/20 hover:border-accent hover:text-accent"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((c) => (
          <div key={c.title}>
            <div className="text-xs uppercase tracking-[0.22em] text-ink/50">{c.title}</div>
            <ul className="mt-4 space-y-2 text-sm text-ink/75">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="hover:text-accent">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ink/8">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-ink/60 md:flex-row">
          <div>© {new Date().getFullYear()} DreamzDecors Studio · Made in India</div>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-ink">Privacy</Link>
            <Link to="/terms" className="hover:text-ink">Terms</Link>
            <Link to="/sitemap" className="hover:text-ink">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
