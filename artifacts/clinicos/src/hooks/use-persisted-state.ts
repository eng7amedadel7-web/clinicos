import { useEffect, useState } from "react";

export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(`clinicos:${key}`);
      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(`clinicos:${key}`, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}