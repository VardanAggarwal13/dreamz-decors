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
    <div className={cn('grid gap-4 sm:gap-5', columnClasses[columns] || columnClasses[3], className)}>
      {items.map((item) => (
        <BaseCard
          key={item.href || item.title}
          as={Link}
          to={item.href}
          className="group min-h-[400px] sm:min-h-[440px]"
          interactive
        >
          {/* Image */}
          <div className="absolute inset-0">
            <MediaImage
              src={item.image}
              alt={item.title}
              label={item.title}
              imgClassName="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />

            {/* Permanent dark base — ensures text is always readable on bright images */}
            <div className="absolute inset-0 bg-ink/30" />

            {/* Strong bottom gradient — carries the text block */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/50 to-transparent" />

            {/* Extra depth on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>

          {/* Content */}
          <div className="relative flex h-full flex-col justify-end p-6 sm:p-7">

            {/* Eyebrow chip — solid semi-transparent pill so it's readable on any image */}
            {item.eyebrow && (
              <span className="mb-3 inline-block w-fit rounded-full border border-bone/20 bg-ink/40 px-3 py-1 text-[9px] uppercase tracking-[0.28em] text-bone/85">
                {item.eyebrow}
              </span>
            )}

            {/* Title */}
            <h3 className="max-w-xs font-display text-2xl leading-tight text-bone sm:text-3xl">
              {item.title}
            </h3>

            {/* Blurb — appears on hover */}
            {item.blurb && (
              <p className="mt-2 max-w-xs text-sm leading-6 text-bone/65 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:opacity-100">
                {item.blurb}
              </p>
            )}

            {/* CTA pill */}
            <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-bone/25 bg-bone/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.26em] text-bone/80 transition-all duration-300 group-hover:border-gold/50 group-hover:bg-gold/20 group-hover:text-gold">
              {item.ctaLabel || 'Explore'}
              <FiArrowRight size={11} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>

          </div>
        </BaseCard>
      ))}
    </div>
  );
}
