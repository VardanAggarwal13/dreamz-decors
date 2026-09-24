import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { cn } from '@/lib/utils';

export default function SectionShell({
  eyebrow,
  title,
  description,
  link,
  className = '',
  innerClassName = '',
  children,
}) {
  return (
    <section className={cn('py-10 sm:py-12 lg:py-14', className)}>
      <div className={cn('container-page', innerClassName)}>
        {(eyebrow || title || description || link) && (
          <div className="flex flex-col items-start gap-3 pb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6 sm:pb-8">
            <div className="max-w-3xl">
              {eyebrow && (
                <div>
                  <span className="eyebrow-gold">{eyebrow}</span>
                  <span className="gold-rule" />
                </div>
              )}
              {title && (
                <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl text-balance text-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed sm:leading-7 text-ink-soft">{description}</p>
              )}
            </div>
            {link && (
              <Link to={link.href} className="editorial-link hidden sm:inline-flex sm:self-auto">
                {link.label}
                <FiArrowRight size={13} />
              </Link>
            )}
          </div>
        )}

        {children}

        {/* Mobile-only "View all" below the cards */}
        {link && (
          <div className="mt-6 flex justify-center sm:hidden">
            <Link to={link.href} className="editorial-link inline-flex">
              {link.label}
              <FiArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
