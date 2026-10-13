import { useRef, useState, useEffect, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useReducedMotion } from './DishaMascot'

type BubbleSide = 'top' | 'bottom' | 'left' | 'right'

interface DishaSpeechBubbleProps {
  children: React.ReactNode
  open: boolean
  side?: BubbleSide
  className?: string
  position?: { x: number; y: number }
  gap?: number
  mascotX?: number
  mascotY?: number
  mascotSize?: number
}

interface BubbleLayout {
  side: BubbleSide
  position: CSSProperties
  transform: string
  centered: boolean
}

export default function DishaSpeechBubble({ children, open, side = 'right', className, gap = 3, mascotX, mascotY, mascotSize = 150 }: DishaSpeechBubbleProps) {
  const reducedMotion = useReducedMotion()
  const bubbleRef = useRef<HTMLDivElement>(null)

  const gapPx = `${gap}px`

  const [layout, setLayout] = useState<BubbleLayout>({
    side,
    position: { left: '100%', bottom: 0, marginLeft: gapPx },
    transform: 'translateY(0)',
    centered: false,
  })

  // Compute a layout that keeps the bubble fully on-screen.
  // mascotX/mascotY are the mascot's true on-screen center (measured via
  // getBoundingClientRect), not the context position — in default mode the
  // mascot is CSS-pinned bottom-left and motionPos does not describe it.
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLayout({ side, position: { left: '100%', bottom: 0, marginLeft: gapPx }, transform: 'translateY(0)', centered: false })
      return
    }

    const vw = window.innerWidth
    const vh = window.innerHeight
    const preferredWidth = Math.min(28 * 16, vw - 32)
    const half = mascotSize / 2
    const margin = 16
    const cx = mascotX ?? vw / 2
    const cy = mascotY ?? vh / 2
    const spaceLeft = cx - half - margin
    const spaceRight = vw - cx - half - margin
    const spaceTop = cy - half - margin
    const spaceBottom = vh - cy - half - margin

    const fitsBeside = (s: BubbleSide) =>
      s === 'left' ? spaceLeft >= preferredWidth : spaceRight >= preferredWidth

    let chosen: BubbleSide = side
    let centered = false

    if ((chosen === 'left' || chosen === 'right') && !fitsBeside(chosen)) {
      const other: BubbleSide = chosen === 'left' ? 'right' : 'left'
      if (fitsBeside(other)) {
        chosen = other
      } else {
        // Neither side fits beside the mascot (narrow viewport) — place the
        // bubble above/below, centered on the viewport so it always fits.
        chosen = spaceTop >= spaceBottom ? 'top' : 'bottom'
        centered = true
      }
    }

    // Horizontal shift that re-centers a -50%-centered bubble from the
    // mascot's center to the viewport's center (only for the fallback).
    const shiftX = Math.round(vw / 2 - cx)

    let position: CSSProperties
    let transform: string
    switch (chosen) {
      case 'left':
        position = { right: '100%', bottom: 0, marginRight: gapPx }
        transform = 'translateY(0)'
        break
      case 'right':
        position = { left: '100%', bottom: 0, marginLeft: gapPx }
        transform = 'translateY(0)'
        break
      case 'top':
        position = { bottom: '100%', left: '50%', marginBottom: gapPx }
        transform = centered
          ? `translate(calc(-50% + ${shiftX}px), 0)`
          : 'translate(-50%, -100%)'
        break
      case 'bottom':
        position = { top: '100%', left: '50%', marginTop: gapPx }
        transform = centered
          ? `translate(calc(-50% + ${shiftX}px), 0)`
          : 'translate(-50%, 0)'
        break
    }

    setLayout({ side: chosen, position, transform, centered })
  }, [side, mascotX, mascotY, mascotSize, gap])

  const getArrowClasses = () => {
    switch (layout.side) {
      case 'top':
        return layout.centered
          ? 'absolute left-1/2 bottom-4 -translate-x-1/2 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-l border-t border-orange-200 dark:border-orange-800 rotate-45'
          : 'absolute -left-1.5 bottom-4 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-l border-t border-orange-200 dark:border-orange-800 rotate-45'
      case 'bottom':
        return layout.centered
          ? 'absolute left-1/2 top-4 -translate-x-1/2 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-l border-t border-orange-200 dark:border-orange-800 rotate-45'
          : 'absolute -left-1.5 top-4 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-l border-t border-orange-200 dark:border-orange-800 rotate-45'
      case 'left':
        return 'absolute right-4 -top-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-l border-t border-orange-200 dark:border-orange-800 rotate-45'
      case 'right':
        return 'absolute left-4 -top-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-900 border-l border-t border-orange-200 dark:border-orange-800 rotate-45'
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="absolute"
          style={{ ...layout.position, transformOrigin: 'center' }}
        >
          <motion.div
            ref={bubbleRef}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, transform: layout.transform }}
            exit={reducedMotion ? {} : { opacity: 0, scale: 0.9, transform: layout.transform }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
            className={cn(
              'relative z-50 max-w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-900 px-3 py-2 md:px-4 md:py-3 shadow-xl shadow-orange-500/8 text-sm text-gray-700 dark:text-gray-200 leading-snug',
              className,
            )}
          >
            <div className={cn(getArrowClasses(), 'aria-hidden')} />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
