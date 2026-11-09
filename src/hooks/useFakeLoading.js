import { useEffect, useState } from 'react';

/**
 * Brief loading state so pages can render skeleton screens while data hydrates.
 */
export function useFakeLoading(delay = 350) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return loading;
}
