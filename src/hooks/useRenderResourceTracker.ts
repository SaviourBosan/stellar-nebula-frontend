import { useEffect, useRef } from 'react'
import { createResourceTracker } from '@/utils/performance/memoryLeakTracker'

export function useRenderResourceTracker() {
  const trackerRef = useRef(createResourceTracker())

  useEffect(() => {
    return () => {
      trackerRef.current.dispose()
    }
  }, [])

  return trackerRef.current
}
