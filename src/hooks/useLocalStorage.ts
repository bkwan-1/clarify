import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setState = useCallback(
    (valOrFn: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next = typeof valOrFn === 'function' ? (valOrFn as (p: T) => T)(prev) : valOrFn;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // storage full or unavailable — continue without persisting
        }
        return next;
      });
    },
    [key],
  );

  return [state, setState];
}
