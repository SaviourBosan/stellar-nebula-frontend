import { useState, useEffect } from 'react'

/**
 * Debounce a value — only updates after `delay` ms of inactivity.
 *
 * @param value - value to debounce
 * @param delay - debounce delay in milliseconds (default 300)
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 400)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
