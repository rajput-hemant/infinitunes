import { useEffect, useState } from "react";

/**
 * @see https://usehooks-ts.com/react-hook/use-debounce
 */
export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (!value) {
      setDebouncedValue(value);
    } else {
      const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [value, delay]);

  return debouncedValue;
}
