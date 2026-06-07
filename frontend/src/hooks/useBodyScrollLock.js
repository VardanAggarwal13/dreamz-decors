import { useEffect } from 'react';

/**
 * Locks <body> scroll while `active` is true (e.g. a modal is open) so the
 * page behind the overlay can't scroll. Compensates for the scrollbar width
 * to avoid a horizontal layout shift when the bar disappears.
 */
export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [active]);
}
