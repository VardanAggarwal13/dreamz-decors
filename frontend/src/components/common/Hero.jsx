import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';

const slides = [
  {
    eyebrow: 'New Drop',
    title: 'Walls that speak. Lights that linger.',
    blurb: 'Hand-finished canvases and made-to-order neons — built for the spaces you love most.',
    cta: { label: 'Shop the Collection', href: '/shop' },
    image:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1800&auto=format&fit=crop&q=70',
  },
];

export default function Hero() {
  const slide = slides[0];
  return (
    <section className="relative overflow-hidden bg-bone">
      <div className="absolute inset-0">
        <img src={slide.image} alt="" className="h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-bone via-bone/80 to-bone/20" />
      </div>

      <div className="container-page relative grid min-h-[78vh] grid-cols-1 items-center py-20">
        <div className="max-w-2xl animate-fade-up">
          <span className="text-xs uppercase tracking-[0.3em] text-accent">{slide.eyebrow}</span>
          <h1 className="mt-4 font-display text-4xl leading-tight text-balance text-ink sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-lg text-base text-ink/75">{slide.blurb}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg">
              <Link to={slide.cta.href}>
                {slide.cta.label}
                <FiArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/shop/custom">Design a Custom Neon</Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap gap-8 text-xs uppercase tracking-[0.2em] text-ink/60">
            <span>15K+ Homes Styled</span>
            <span>4.9 / 5 Avg Rating</span>
            <span>Ships in 7–10 Days</span>
          </div>
        </div>
      </div>
    </section>
  );
}
