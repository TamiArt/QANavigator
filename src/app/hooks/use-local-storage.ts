import { useCallback, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const persistValue = useCallback((nextValue: T) => {
    setValue(nextValue);
    try {
      localStorage.setItem(key, JSON.stringify(nextValue));
    } catch {
      // React state remains usable when browser storage is unavailable or full.
    }
  }, [key]);

  return [value, persistValue];
}
