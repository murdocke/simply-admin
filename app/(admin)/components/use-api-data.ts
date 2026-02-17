'use client';

import { useEffect, useState } from 'react';

type ApiState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export function useApiData<T>(url: string, fallback: T): ApiState<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(url, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }
        return (await response.json()) as T;
      })
      .then(payload => {
        if (!active) return;
        setData(payload);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [url]);

  return { data, loading, error };
}
