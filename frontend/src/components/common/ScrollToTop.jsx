import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Automatically resets the scroll position to the very top (0, 0) of the window
 * on any route or parameter change. If a hash fragment (#) is present, it will
 * scroll to that target element after the DOM renders.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If an anchor hash is provided, allow jumping/scrolling to that element
    if (hash) {
      const targetId = hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // Immediately reset scroll to the top of the page
    // Using instant behavior prevents the smooth-scroll animation from slowly
    // scrolling up and showing lower sections during page transition.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search, hash]);

  return null;
}
