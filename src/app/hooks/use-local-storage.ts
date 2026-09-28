import { useCallback, useState } from "react";
import { parseStoredValue, serializeStoredValue } from "../core/storage";

export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try { return parseStoredValue(localStorage.getItem(key), initial); }
    catch { return initial; }
  });

  const persistValue = useCallback((nextValue: T) => {
    setValue(nextValue);
    try { localStorage.setItem(key, serializeStoredValue(nextValue)); }
    catch { /* React state remains usable when browser storage is unavailable or full. */ }
  }, [key]);

  return [value, persistValue];
}