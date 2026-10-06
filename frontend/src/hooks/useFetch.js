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

// Tiny GET helper with automatic retry on transient startup/network errors.
export default function useFetch(url, { deps = [], skip = false, cache, retries = 2 } = {}) {
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

    let retryTimer = null;
    let attempt = 0;

    const execute = () => {
      api
        .get(url)
        .then((res) => {
          if (cancelled.current) return;
          setData(res);
          setError(null);
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
          attempt += 1;
          const isTransient =
            !err.response ||
            err.response?.status === 503 ||
            err.message?.includes('Network') ||
            err.message?.includes('starting up') ||
            err.code === 'ECONNABORTED';

          if (isTransient && attempt <= retries) {
            // Server may still be booting; retry after a brief delay
            retryTimer = setTimeout(execute, Math.min(attempt * 1200, 3000));
            return;
          }

          setError(err);
          setLoading(false);
        });
    };

    execute();

    return () => {
      cancelled.current = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, ...deps]);

  return { data, error, loading };
}
