import { useCallback, useEffect, useRef, useState } from 'react'

export type DishaMood =
  | 'idle'
  | 'blink'
  | 'waking'
  | 'excited'
  | 'playful'
  | 'listening'
  | 'thinking'
  | 'working'
  | 'celebrate'
  | 'confused'
  | 'drowsy'
  | 'sleeping'
  | 'searching'
  | 'curious'
  | 'surprised'
  | 'happy'
  | 'laughing'
  | 'helpful'

const MOOD_TRANSITION_MS = 220

interface UseDishaMoodProps {
  mood: DishaMood
  reducedMotion: boolean
}

export function useDishaMood({ mood, reducedMotion }: UseDishaMoodProps) {
  const [activeMood, setActiveMood] = useState<DishaMood>(mood)
  const previousRef = useRef<DishaMood>(mood)

  const setMood = useCallback(
    (next: DishaMood) => {
      previousRef.current = activeMood
      setActiveMood(next)
    },
    [activeMood],
  )

  useEffect(() => {
    if (reducedMotion) {
      setActiveMood(mood)
      return
    }

    if (previousRef.current === mood) {
      setActiveMood(mood)
      return
    }

    const start = performance.now()
    const duration = MOOD_TRANSITION_MS
    let rafId: number | null = null

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      if (t >= 0.5) {
        setActiveMood(mood)
        if (rafId !== null) cancelAnimationFrame(rafId)
      } else {
        rafId = requestAnimationFrame(frame)
      }
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [mood, reducedMotion])

  return { mood: activeMood, setMood }
}

export type DishaPosition = {
  x: number
  y: number
}

export type DishaAnchor = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'free'

interface UseDishaPositionProps {
  anchor: DishaAnchor
  onChange?: (next: DishaPosition) => void
}

export function useDishaPosition({ anchor, onChange }: UseDishaPositionProps) {
  const [position, setPosition] = useState<DishaPosition>({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  const keepInView = useCallback(
    (next: DishaPosition, rect: DOMRect) => {
      const margin = 16
      const nx = Math.max(margin, Math.min(rect.width - margin, next.x))
      const ny = Math.max(margin, Math.min(rect.height - margin, next.y))
      return { x: nx, y: ny }
    },
    [],
  )

  const move = useCallback(
    (dx: number, dy: number) => {
      setPosition((prev) => {
        const next = { x: prev.x + dx, y: prev.y + dy }
        if (typeof window === 'undefined') return next
        const rect = document.documentElement.getBoundingClientRect()
        const clamped = keepInView(next, rect)
        onChange?.(clamped)
        return clamped
      })
    },
    [keepInView, onChange],
  )

  const setPositionSafe = useCallback(
    (next: DishaPosition) => {
      if (typeof window === 'undefined') {
        setPosition(next)
        return
      }
      const rect = document.documentElement.getBoundingClientRect()
      const clamped = keepInView(next, rect)
      setPosition(clamped)
      onChange?.(clamped)
    },
    [keepInView, onChange],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const rect = document.documentElement.getBoundingClientRect()
    const margin = 16
    const mascotSize = 150

    let initialPos: DishaPosition
    switch (anchor) {
      case 'bottom-right':
        initialPos = { x: rect.width - mascotSize - margin, y: rect.height - mascotSize - margin }
        break
      case 'bottom-left':
        initialPos = { x: margin, y: rect.height - mascotSize - margin }
        break
      case 'top-right':
        initialPos = { x: rect.width - mascotSize - margin, y: margin }
        break
      case 'top-left':
        initialPos = { x: margin, y: margin }
        break
      case 'free':
        return
    }

    setPositionSafe(initialPos)

    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const rect = document.documentElement.getBoundingClientRect()
        setPosition((prev) => keepInView(prev, rect))
      })
    }

    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [anchor, keepInView, setPositionSafe])

  return { position, move, setPosition: setPositionSafe }
}

interface UseDishaKeyboardProps {
  disabled?: boolean
  onEscape?: () => void
}

export function useDishaKeyboard({
  disabled = false,
  onEscape,
}: UseDishaKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return
      if (event.key === 'Escape') {
        onEscape?.()
      }
    },
    [disabled, onEscape],
  )

  useEffect(() => {
    if (disabled) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [disabled, handleKeyDown])

  return { handleKeyDown }
}

export function useReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
