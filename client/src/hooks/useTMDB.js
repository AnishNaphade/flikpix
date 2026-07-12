import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for fetching TMDB data with caching, loading, and error states.
 * @param {Function} fetchFn - The API function to call
 * @param {Array} deps - Dependencies array (re-fetches when these change)
 * @param {boolean} immediate - Whether to fetch immediately (default true)
 */
export function useTMDB(fetchFn, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!immediate) return;

    let cancelled = false;
    const cacheKey = JSON.stringify(deps);

    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      setData(cacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchFn()
      .then(result => {
        if (!cancelled) {
          setData(result);
          cacheRef.current.set(cacheKey, result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, deps);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

/**
 * Hook for paginated TMDB data
 */
export function useTMDBPaginated(fetchFn) {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPage = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn(pageNum);
      if (pageNum === 1) {
        setResults(data.results || []);
      } else {
        setResults(prev => [...prev, ...(data.results || [])]);
      }
      setPage(pageNum);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
  }, []);

  const loadMore = () => {
    if (page < totalPages && !loading) {
      loadPage(page + 1);
    }
  };

  return { results, loading, error, page, totalPages, loadMore, hasMore: page < totalPages };
}

export default useTMDB;
