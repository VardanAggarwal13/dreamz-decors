import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

// Read a cached payload synchronously so the first paint shows the last-known
// value instead of a placeholder (kills the "old value → new value" flicker on
// hard refresh). Opt-in per call via the `cache` key; only use it for data that
// is safe to show slightly stale (e.g. editable CMS content).
const readCache = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Tiny GET helper. For more, swap in TanStack Query later — same shape.
export default function useFetch(url, { deps = [], skip = false, cache } = {}) {
  const [data, setData] = useState(() => readCache(cache));
  const [error, setError] = useState(null);
  // When we have a cached value, don't block the UI with a loading state — we
  // already have something correct to show while the refetch runs in place.
  const [loading, setLoading] = useState(!skip && !readCache(cache));
  const cancelled = useRef(false);

  useEffect(() => {
    if (skip || !url) return undefined;
    cancelled.current = false;
    if (!readCache(cache)) setLoading(true);
    setError(null);
    api
      .get(url)
      .then((res) => {
        if (cancelled.current) return;
        setData(res);
        setLoading(false);
        if (cache) {
          try {
            localStorage.setItem(cache, JSON.stringify(res));
          } catch {
            /* quota / private mode — ignore */
          }
        }
      })
      .catch((err) => {
        if (cancelled.current) return;
        setError(err);
        setLoading(false);
      });
    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, ...deps]);

  return { data, error, loading };
}
