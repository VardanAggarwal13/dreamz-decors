import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

// Drives a server-paginated admin list. `makePath({ page, limit })` returns the
// request URL (the caller folds in search/filter params via closure); `deps`
// are the filter values that, when changed, reset back to page 1 (debounced so
// typing in a search box doesn't fire a request per keystroke).
export default function useAdminList(makePath, deps = [], { limit = 10, debounce = 250 } = {}) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Always call the latest closure without making fetch identity churn.
  const makePathRef = useRef(makePath);
  makePathRef.current = makePath;

  const fetchPage = useCallback(
    (p) => {
      setLoading(true);
      return api
        .get(makePathRef.current({ page: p, limit }))
        .then((res) => {
          setItems(res.data || []);
          setMeta({
            page: res.page || p,
            pages: res.pages || 1,
            total: res.total ?? (res.data?.length || 0),
            limit: res.limit || limit,
          });
          return res;
        })
        .finally(() => setLoading(false));
    },
    [limit]
  );

  // Filter/search change → debounce, then reset to page 1 and reload.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchPage(1);
    }, debounce);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const goTo = useCallback(
    (p) => {
      setPage(p);
      fetchPage(p);
    },
    [fetchPage]
  );

  // Reload the current page after a create/delete; if a delete emptied the last
  // page, step back one so the admin isn't left staring at a blank list.
  const reload = useCallback(async () => {
    const res = await fetchPage(page);
    if ((res?.data?.length ?? 0) === 0 && page > 1) goTo(page - 1);
  }, [fetchPage, page, goTo]);

  return { items, setItems, meta, page, loading, goTo, reload };
}
