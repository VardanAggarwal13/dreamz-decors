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
    <section className={cn('py-16 sm:py-20', className)}>
      <div className={cn('container-page', innerClassName)}>
        {(eyebrow || title || description || link) && (
          <div className="flex flex-col items-start gap-4 pb-10 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6 sm:pb-12">
            <div className="max-w-3xl">
              {eyebrow && (
                <div>
                  <span className="eyebrow-gold">{eyebrow}</span>
                  <span className="gold-rule" />
                </div>
              )}
              {title && (
                <h2 className="mt-4 font-display text-3xl text-balance text-ink sm:text-4xl lg:text-5xl">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft">{description}</p>
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
          <div className="mt-10 flex justify-center sm:hidden">
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
