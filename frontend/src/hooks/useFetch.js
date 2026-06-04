import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

// Tiny GET helper. For more, swap in TanStack Query later — same shape.
export default function useFetch(url, { deps = [], skip = false } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const cancelled = useRef(false);

  useEffect(() => {
    if (skip || !url) return undefined;
    cancelled.current = false;
    setLoading(true);
    setError(null);
    api
      .get(url)
      .then((res) => {
        if (cancelled.current) return;
        setData(res);
        setLoading(false);
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
