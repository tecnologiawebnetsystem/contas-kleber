"use client"

import { useCallback, useRef } from "react"

interface UseLongPressOptions {
  onLongPress: () => void
  delay?: number
}

export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions) {
  const timeout = useRef<NodeJS.Timeout>()

  const start = useCallback(() => {
    timeout.current = setTimeout(() => {
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const stop = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
  }, [])

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  }
}
