import { useEffect, useReducer } from 'react';
import { read, subscribe } from '../services/db';

/**
 * Read a localStorage-backed collection and re-render whenever the data layer changes.
 */
export function useCollection(name, fallback = []) {
  const [, forceUpdate] = useReducer((value) => value + 1, 0);

  useEffect(() => subscribe(() => forceUpdate()), []);

  return read(name, fallback);
}
