import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import BaseCard from '@/components/ui/BaseCard';
import MediaImage from '@/components/ui/MediaImage';
import { cn } from '@/lib/utils';

const columnClasses = {
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
};

export default function EditorialGrid({ items = [], columns = 3, className = '' }) {
  return (
    <div className={cn('grid gap-5 sm:gap-6', columnClasses[columns] || columnClasses[3], className)}>
      {items.map((item) => (
        <BaseCard
          key={item.href || item.title}
          as={Link}
          to={item.href}
          className="group relative min-h-[420px] sm:min-h-[460px] overflow-hidden rounded-3xl border border-hairline/70 bg-bone-soft shadow-[0_12px_36px_rgba(22,22,22,0.06)] transition-all duration-500 hover:border-gold/70 hover:shadow-[0_20px_48px_rgba(22,22,22,0.14)]"
          interactive
        >
          {/* Image */}
          <div className="absolute inset-0">
            <MediaImage
              src={item.image}
              alt={item.title}
              label={item.title}
              width={1000}
              height={1200}
              gravity="auto"
              className="h-full w-full"
              imgClassName="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />

            {/* Clean bottom gradient only — keeps top 65% of artwork bright & visible */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 via-50% to-transparent" />
            <div className="absolute inset-0 bg-gold/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>

          {/* Content */}
          <div className="relative flex h-full flex-col justify-end p-5 sm:p-7">
            {/* Eyebrow chip */}
            {item.eyebrow && (
              <span className="mb-2.5 inline-block w-fit rounded-full border border-gold/40 bg-black/60 px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-gold shadow-sm backdrop-blur-md">
                {item.eyebrow}
              </span>
            )}

            {/* Title */}
            <h3 className="max-w-xs font-display text-xl font-medium leading-snug text-white sm:text-2xl">
              {item.title}
            </h3>

            {/* Blurb */}
            {item.blurb && (
              <p className="mt-1.5 line-clamp-2 max-w-xs text-xs leading-relaxed text-white/80 transition-all duration-300 group-hover:text-white sm:text-sm">
                {item.blurb}
              </p>
            )}

            {/* CTA Pill */}
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-all duration-300 group-hover:border-gold group-hover:bg-gold group-hover:text-ink group-hover:shadow-[0_4px_16px_rgba(197,158,89,0.3)]">
              {item.ctaLabel || 'Explore'}
              <FiArrowRight size={11} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </BaseCard>
      ))}
    </div>
  );
}
