import { forwardRef, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DishaMood } from './DishaMascot'

export type DishaSize = 'sm' | 'md' | 'lg'

export interface DishaProps {
  className?: string
  size?: DishaSize
  accent?: 'orange' | 'blue'
}

interface DishaCharacterInternalProps {
  mood: DishaMood
  size: number
  className?: string
  style?: CSSProperties
}

const DishaCharacter = forwardRef<HTMLSpanElement, DishaCharacterInternalProps>(
  function DishaCharacter({ mood, size, className, style }, ref) {
    const reducedMotion = useReducedMotion()
    const sizePx = size + 'px'

    const eyeClosed = reducedMotion ? false : mood === 'sleeping' || mood === 'drowsy'

    const isWarm = mood === 'celebrate' || mood === 'excited' || mood === 'playful'

    return (
      <span
        ref={ref}
        data-disha-mood={mood}
        aria-label={`Disha the LoadSaathi assistant, mood ${mood}`}
        className={cn('inline-block overflow-visible select-none shrink-0', className)}
        style={{
          width: sizePx,
          height: sizePx,
          display: 'inline-block',
          ...style,
        }}
      >
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          initial={reducedMotion ? {} : { scale: 0.98, y: 4 }}
          animate={reducedMotion ? {} : { scale: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
          style={{ overflow: 'visible' }}
        >
          <ellipse
            cx="60"
            cy="108"
            rx={size * 0.28}
            ry={size * 0.05}
            fill="currentColor"
            opacity={0.18}
            className="text-orange-500"
            aria-hidden="true"
          />

          <motion.circle
            cx="60"
            cy="58"
            r={size * 0.36}
            fill={isWarm ? '#FF6B00' : '#0F2D5A'}
            initial={reducedMotion ? {} : { scale: 0.96 }}
            animate={reducedMotion ? {} : { scale: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }}
            aria-hidden="true"
          />

          <path
            d="M36 52a24 24 0 0 1 48 0"
            stroke="#FF6B00"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.85}
            aria-hidden="true"
          />

          <circle cx="74" cy="44" r={size * 0.045} fill="#FFFBF0" aria-hidden="true" />

          <g aria-hidden="true">
            <motion.circle
              cx="50"
              cy="50"
              r={size * 0.075}
              fill="#FFFFFF"
              animate={reducedMotion || eyeClosed ? undefined : { scale: [1, 0.08, 1] }}
              transition={
                reducedMotion
                  ? undefined
                  : {
                      duration: 0.12,
                      repeat: mood === 'blink' ? 1 : 0,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }
              }
              style={{
                opacity: eyeClosed ? 0.4 : undefined,
              }}
            />
            <circle cx="50" cy="50" r={Math.max(2, size * 0.028)} fill="#0F2D5A" aria-hidden="true" />

            <motion.circle
              cx="70"
              cy="50"
              r={size * 0.075}
              fill="#FFFFFF"
              animate={reducedMotion || eyeClosed ? undefined : { scale: [1, 0.08, 1] }}
              transition={
                reducedMotion
                  ? undefined
                  : {
                      duration: 0.12,
                      repeat: mood === 'blink' ? 1 : 0,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }
              }
              style={{
                opacity: eyeClosed ? 0.4 : undefined,
              }}
            />
            <circle cx="70" cy="50" r={Math.max(2, size * 0.028)} fill="#0F2D5A" aria-hidden="true" />
          </g>

          <path
            d={
              mood === 'confused'
                ? 'M54 64a6 4 0 1 1 12 0'
                : mood === 'celebrate' || mood === 'playful'
                  ? 'M52 62a8 6 0 0 1 16 0'
                  : 'M54 60a6 4 0 0 1 12 0'
            }
            stroke="#FFFBF0"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
            aria-hidden="true"
          />
        </motion.svg>
      </span>
    )
  },
)

export { DishaCharacter }
