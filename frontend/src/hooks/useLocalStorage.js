import { useCallback, useState } from 'react';
import { loadLS, saveLS } from '../utils/storage';

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => loadLS(key, initial));
  const set = useCallback((v) => setValue((prev) => {
    const next = typeof v === 'function' ? v(prev) : v;
    saveLS(key, next);
    return next;
  }), [key]);
  return [value, set];
}
