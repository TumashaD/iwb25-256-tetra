import { useCallback, useRef } from 'react'

/**
 * Hook to debounce function calls to prevent rapid successive calls
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => func(...args), delay)
    }) as T,
    [func, delay]
  )
}

/**
 * Hook to throttle function calls to prevent rapid successive calls
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now
        return func(...args)
      }
    }) as T,
    [func, delay]
  )
}

/**
 * Hook to prevent multiple calls of an async function until it completes
 */
export const useSingleCall = <T extends (...args: any[]) => Promise<any>>(
  func: T
): [T, boolean] => {
  const isExecutingRef = useRef(false)

  const wrappedFunc = useCallback(
    (async (...args: Parameters<T>) => {
      if (isExecutingRef.current) {
        console.warn('Function call ignored - already executing')
        return
      }

      try {
        isExecutingRef.current = true
        return await func(...args)
      } finally {
        isExecutingRef.current = false
      }
    }) as T,
    [func]
  )

  return [wrappedFunc, isExecutingRef.current]
}
