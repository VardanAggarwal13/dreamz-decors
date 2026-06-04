import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function PromoBanner({
  eyebrow = 'Bundle & Save',
  title = 'Build your own gallery wall — save 25%',
  blurb = 'Pick any 3 canvases from our bestsellers and we apply the bundle discount automatically at checkout.',
  cta = { label: 'Build a Bundle', href: '/shop?filter=bundles' },
  image = 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1600&auto=format&fit=crop&q=70',
}) {
  return (
    <section className="relative overflow-hidden rounded-lg shadow-soft">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-bone via-bone/75 to-transparent" />
      <div className="relative grid min-h-[280px] items-center p-8 sm:p-12">
        <div className="max-w-lg">
          <span className="text-xs uppercase tracking-[0.3em] text-accent-deep">{eyebrow}</span>
          <h3 className="mt-3 font-display text-2xl text-balance text-ink sm:text-4xl">{title}</h3>
          <p className="mt-3 text-sm text-ink/75">{blurb}</p>
          <Button asChild variant="neon" size="md" className="mt-6">
            <Link to={cta.href}>{cta.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
