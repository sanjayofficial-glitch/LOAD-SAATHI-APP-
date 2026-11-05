import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { useReducedMotion, useDishaKeyboard } from './DishaMascot'
import { useDisha } from './DishaContext'
import { Freddy, moodToFreddyAnimation } from './FreddyAvatar'
import DishaSpeechBubble from './DishaSpeechBubble'
import { GlowRing } from './DishaSpotlight'
import { useEffect, useState, useCallback, useRef, useLayoutEffect } from 'react'
import { useDishaPageTip, pageContextMessages } from './DishaOnboardingTips'
import { useIdleDetection } from '@/hooks/useIdleDetection'
import { MASCOT_BADGE_EVENT } from '@/hooks/useMascotInteractionTracker'
import { useAuth } from '@/contexts/AuthContext'
import { isDishaUiEnabled } from '@/lib/dishaRequest'
import DishaAskPanel from './DishaAskPanel'
import type { DishaMood } from './DishaMascot'

export { DishaProvider } from './DishaContext'
export { DishaCharacter } from './DishaCharacter'
import type { DishaSize } from './DishaCharacter'

export interface DishaProps {
  className?: string
  size?: DishaSize
  accent?: 'orange' | 'blue'
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })
  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])
  return matches
}

function DishaInner({ className, size = 'lg', accent = 'orange' }: DishaProps) {
  const reducedMotion = useReducedMotion()
  const {
    mood,
    setMood,
    minimized,
    dismissed,
    tip,
    showBubble,
    setShowBubble,
    position,
    pageContext,
    move,
    guideState,
    guideStep,
    guideTargetPosition,
    setGuideMood,
    setTip,
    reaction,
    playReaction,
    nextStep,
  } = useDisha()

  const isMobile = useMediaQuery('(max-width: 767px)')
  const isSmallMobile = useMediaQuery('(max-width: 359px)')

  const [freeAnchored, setFreeAnchored] = useState(false)
  const effectiveAnchor = freeAnchored || minimized ? 'free' : 'bottom-right'
  const setAnchorSafe = useCallback((_: 'free') => setFreeAnchored(true), [])

  const [bubbleSide, setBubbleSide] = useState<'top' | 'bottom' | 'left' | 'right'>('right')
  const [isDragging, setIsDragging] = useState(false)
  const dragHandleRef = useRef<HTMLDivElement | null>(null)
  const [motionPos, setMotionPos] = useState<{ x: number; y: number }>(position)
  const mascotRef = useRef<HTMLDivElement | null>(null)
  const [renderedMascot, setRenderedMascot] = useState<{ x: number; y: number } | null>(null)
  const [reactionBadge, setReactionBadge] = useState<{ label: string; emoji: string; nonce: number } | null>(null)
  const reactionBadgeTimer = useRef<number | null>(null)


  const isGuideActive = guideState?.isActive && guideTargetPosition && !isDragging && !minimized
  const isFreeOrGuide = isGuideActive || effectiveAnchor === 'free'
  const isProfilePage = pageContext === 'profile'

  const autoSize: DishaSize = isSmallMobile ? 'sm' : isMobile ? 'md' : size
  const sizeMap: Record<string, number> = { sm: 88, md: 112, lg: 150, xl: 200 }
  const mascotSize = sizeMap[autoSize] ?? 150
  const avatarSize = mascotSize
  const mascotHalf = mascotSize / 2

  // Safety clamp: keep mascot fully on-screen at all times
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  const clampedX = Math.max(16, Math.min(viewportWidth - mascotSize - 16, motionPos.x))
  const clampedY = Math.max(16, Math.min(viewportHeight - mascotSize - 16, motionPos.y))

  const freddyStyle: React.CSSProperties = isFreeOrGuide && motionPos ? {
    position: 'fixed',
    top: clampedY - mascotHalf,
    left: clampedX - mascotHalf,
    bottom: 'auto',
  } : {}

  useDishaPageTip()
  const { idle } = useIdleDetection(30000)

  // "Ask Disha" is doubly gated: the default-off VITE_DISHA_UI flag AND a
  // signed-in user (Disha searches the marketplace with the caller's own
  // access). Signed-out visitors see Freddy exactly as before.
  const { user } = useAuth()
  const [askOpen, setAskOpen] = useState(false)
  const dishaAvailable = isDishaUiEnabled() && Boolean(user)

  useEffect(() => {
    if (isGuideActive && !isDragging && guideTargetPosition) {
      setMotionPos({ x: guideTargetPosition.x, y: guideTargetPosition.y })
      setBubbleSide(guideTargetPosition.side as 'top' | 'bottom' | 'left' | 'right')
    }
  }, [guideTargetPosition, guideState?.isActive, isDragging, isGuideActive])

  // Sync motionPos from position whenever guide is not active
  useEffect(() => {
    if (!isGuideActive) {
      setMotionPos(position)
    }
  }, [position, isGuideActive])

  // Force position recalculation on mount and resize to fix off-screen bubble on first load
  useEffect(() => {
    const recalc = () => {
      if (!isGuideActive && position) {
        setMotionPos(position)
      }
    }
    recalc()
    window.addEventListener('resize', recalc, { passive: true })
    return () => window.removeEventListener('resize', recalc)
  }, [isGuideActive, position])

  // Dynamic bubble side: mascot on left → bubble right, mascot on right → bubble left
  useEffect(() => {
    // Default mode: mascot is pinned to the bottom-left via CSS classes,
    // so the bubble must open to the right to stay on-screen.
    if (!isFreeOrGuide) {
      setBubbleSide('right')
      return
    }
    if (!motionPos) return
    const screenMidpoint = viewportWidth / 2
    setBubbleSide(motionPos.x < screenMidpoint ? 'right' : 'left')
  }, [motionPos, viewportWidth, isFreeOrGuide])

  // Measure the mascot's true on-screen center. In default mode the mascot
  // is CSS-pinned to the bottom-left and motionPos does not describe the
  // rendered position, so the bubble's overflow guard needs the real value.
  useLayoutEffect(() => {
    if (minimized || dismissed) return
    const measure = () => {
      const el = mascotRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setRenderedMascot({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isFreeOrGuide, motionPos, isMobile, minimized, dismissed, showBubble, guideState?.isActive])

  useEffect(() => {
    if (guideStep && guideState?.isActive) {
      setGuideMood(guideStep.mood)
      setShowBubble(true)
    }
  }, [guideStep, guideState?.isActive, setGuideMood, setShowBubble])

  useEffect(() => {
    if (dismissed) {
      setShowBubble(false)
    }
  }, [dismissed, setShowBubble])

  useEffect(() => {
    if (minimized || dismissed) return
    const timer = setTimeout(() => {
      if (guideState?.isActive) {
        setGuideMood(guideStep?.mood || 'idle')
      } else {
        setMood('idle')
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [minimized, dismissed, mood, guideState, guideStep, setGuideMood])

  useEffect(() => {
    if (dismissed || minimized || guideState?.isActive) return

    const idleMessages: Array<{ message: string; mood: DishaMood }> =
      pageContextMessages[pageContext] ??
      [
        { message: "Need help finding the right load?", mood: 'idle' },
        { message: "Tip: Use filters to narrow down routes by city!", mood: 'thinking' },
        { message: "Your credit score unlocks better rates — check it in profile!", mood: 'playful' },
      ]

    const interval = setInterval(() => {
      if (idle) {
        const randomMsg = idleMessages[Math.floor(Math.random() * idleMessages.length)]!
        setTip(randomMsg)
        setShowBubble(true)
        setTimeout(() => {
          setMood('idle')
          setShowBubble(false)
        }, 8000)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [dismissed, minimized, guideState?.isActive, idle, setTip, setShowBubble, setMood])

  useEffect(() => {
    if (reaction && reaction.name) {
      playReaction(reaction.name)
      const timeoutId = setTimeout(() => {
        setMood('listening')
        setShowBubble(true)
        setTimeout(() => {
          setShowBubble(false)
        }, 2600)
      }, 2600)
      return () => clearTimeout(timeoutId)
    }
  }, [reaction, playReaction, setMood, setShowBubble])

  // Bubble position is now derived from mascot position via CSS — no polling needed

  useEffect(() => {
    if (dismissed || minimized || guideState?.isActive) return

    const checkOverlap = () => {
      if (!mascotRef.current) return
      const mascotRect = mascotRef.current.getBoundingClientRect()
      const criticalEls = document.querySelectorAll<HTMLElement>('[data-avoid-disha]')
      if (criticalEls.length === 0) return

      let overlaps = false
      criticalEls.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (
          mascotRect.left < rect.right &&
          mascotRect.right > rect.left &&
          mascotRect.top < rect.bottom &&
          mascotRect.bottom > rect.top
        ) {
          overlaps = true
        }
      })

      if (overlaps) {
        const spaceAbove = mascotRect.top
        const spaceBelow = window.innerHeight - mascotRect.bottom
        const spaceLeft = mascotRect.left
        const spaceRight = window.innerWidth - mascotRect.right

        if (spaceBelow >= mascotSize + 80) {
          move(0, mascotSize + 60)
        } else if (spaceAbove >= mascotSize + 80) {
          move(0, -(mascotSize + 60))
        } else if (spaceRight >= mascotSize + 80) {
          move(mascotSize + 60, 0)
        } else if (spaceLeft >= mascotSize + 80) {
          move(-(mascotSize + 60), 0)
        } else {
          setMood('idle')
        }
      }
    }

    const timeout = setTimeout(checkOverlap, 100)
    window.addEventListener('scroll', checkOverlap, { passive: true })
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('scroll', checkOverlap)
    }
  }, [dismissed, minimized, guideState?.isActive, move, mascotSize])

  // Transient reaction badge emitted by the global interaction tracker
  // (and by any page via emitMascotReaction). Rendered next to the mascot.
  useEffect(() => {
    const onBadge = (e: Event) => {
      const detail = (e as CustomEvent<{ label?: string; emoji?: string }>).detail
      if (!detail?.label) return
      setReactionBadge({ label: detail.label, emoji: detail.emoji ?? '✨', nonce: Date.now() })
      if (reactionBadgeTimer.current) window.clearTimeout(reactionBadgeTimer.current)
      reactionBadgeTimer.current = window.setTimeout(() => setReactionBadge(null), 2200)
    }
    window.addEventListener(MASCOT_BADGE_EVENT, onBadge as EventListener)
    return () => {
      window.removeEventListener(MASCOT_BADGE_EVENT, onBadge as EventListener)
      if (reactionBadgeTimer.current) window.clearTimeout(reactionBadgeTimer.current)
    }
  }, [])

  useDishaKeyboard({
    disabled: dismissed || minimized,
    onEscape: () => setShowBubble(false),
  })

  const handlePointerDown = useCallback((
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (dismissed || minimized) return
    if (event.button !== 0) return
    event.preventDefault()

    const timer = setTimeout(() => {
      setIsDragging(true)
      setAnchorSafe('free')
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }
    }, 180)

    const start = { x: event.clientX, y: event.clientY }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      start.x = e.clientX
      start.y = e.clientY
      move(dx, dy)
    }
    const onUp = () => {
      clearTimeout(timer)
      setIsDragging(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dismissed, minimized, isDragging, move])

  const handleClick = useCallback(() => {
    if (dismissed) return;
    if (guideState?.isActive) {
      if (showBubble) {
        setShowBubble(false);
      } else {
        setMood(guideStep?.mood || 'listening');
        setTip({
          message: guideStep?.message || 'Tap a highlighted field to get started.',
          mood: guideStep?.mood || 'listening',
          when: 'help-open',
        });
        setShowBubble(true);
      }
      return;
    }
    if (!showBubble) {
      setMood('listening');
      setTip({
        message: "How may I help you? I can guide you through posting a load, finding trucks, or answer questions about the platform.",
        mood: 'listening',
        when: 'help-open',
      });
      setShowBubble(true);
    } else {
      setShowBubble(false);
    }
  }, [dismissed, showBubble, setMood, setTip, setShowBubble, guideState?.isActive, guideStep])

  const handleCloseBubble = useCallback(() => {
    setShowBubble(false)
  }, [setShowBubble])

  const closeAskPanel = useCallback(() => {
    setAskOpen(false)
  }, [])

  const handleNextStep = useCallback(() => {
    if (guideState?.isActive) {
      nextStep()
    }
  }, [guideState?.isActive, nextStep])

  if (dismissed || isProfilePage) return null

  // Bubble is now rendered inside the mascot container so it moves together with 10px gap

  return (
    <div
      aria-roledescription="Freddy mascot"
      data-disha-root
      data-disha-anchor={effectiveAnchor}
      data-disha-minimized={minimized}
      data-disha-dismissed={dismissed}
      className={cn('fixed', isFreeOrGuide ? '' : isMobile ? 'bottom-20 left-4' : 'bottom-24 left-6', className)}
      style={{ zIndex: guideState?.isActive ? 10000 : 100 }}
    >
      {guideState?.isActive && guideTargetPosition?.targetRect && guideState.userPreferences.showSpotlight && (
        <GlowRing
          targetRect={guideTargetPosition.targetRect}
          isVisible={true}
          accent={accent}
        />
      )}

      <motion.div
        ref={(el) => {
          dragHandleRef.current = el
          mascotRef.current = el
        }}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        data-disha-mascot
        aria-label={`Freddy the LoadSaathi assistant, mood ${mood}${minimized ? ', minimized' : ''}${dismissed ? ', dismissed' : ''}`}
        initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
        animate={
          reducedMotion
            ? {}
            : isFreeOrGuide && motionPos
              ? { opacity: 1, scale: 1, top: clampedY - mascotHalf, left: clampedX - mascotHalf }
              : { opacity: 1, scale: 1 }
        }
        whileHover={!reducedMotion && !dismissed && !guideState?.isActive ? { scale: isDragging ? 1 : 1.08 } : undefined}
        whileTap={!reducedMotion && !dismissed ? { scale: 0.96 } : undefined}
        transition={
          isFreeOrGuide && motionPos && !reducedMotion
            ? { type: 'spring', stiffness: 300, damping: 25 }
            : { duration: 0.3, ease: 'easeOut' }
        }
        className={cn(
          'relative flex items-center justify-center cursor-pointer select-none transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
          isDragging && 'cursor-grabbing',
          guideState?.isActive && 'animate-bounce-gentle',
        )}
        style={{
          ...freddyStyle,
          zIndex: guideState?.isActive ? 10000 : 100,
          userSelect: isDragging ? 'none' : 'inherit',
        }}>
        <div className="pointer-events-none absolute bottom-full left-1/2 z-[10002] mb-3 -translate-x-1/2">
          <AnimatePresence>
            {!minimized && !dismissed && reactionBadge && (
              <motion.div
                key={`${reactionBadge.label}-${reactionBadge.nonce}`}
                initial={{ opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.92 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                aria-hidden="true"
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-orange-200/70 bg-white/95 px-3 py-1 text-xs font-medium text-gray-700 shadow-md backdrop-blur dark:border-orange-900/40 dark:bg-gray-900/95 dark:text-gray-100"
              >
                <span aria-hidden>{reactionBadge.emoji}</span>
                <span>{reactionBadge.label}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!minimized && !dismissed && showBubble && (tip || guideStep) && (
            <motion.div
              className="pointer-events-none absolute z-[10001]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <DishaSpeechBubble open={!minimized && !dismissed && showBubble} side={bubbleSide} gap={3} mascotX={renderedMascot?.x} mascotY={renderedMascot?.y} mascotSize={mascotSize}>
                <div className="flex flex-row items-start gap-2 w-[280px] max-w-[calc(100vw-4rem)]">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[11px] font-bold mt-0.5">
                    F
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">Freddy</p>
                      {guideStep?.example && (
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-mono">
                          {guideStep.example}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug break-normal">
                      {guideStep?.message || tip?.message}
                    </p>
                    <div className="flex gap-3 items-center mt-1">
                      <button
                        type="button"
                        className="text-xs font-medium text-muted-foreground hover:text-foreground pointer-events-auto transition-colors"
                        onClick={handleCloseBubble}
                      >
                        Dismiss
                      </button>
                      {guideState?.isActive && guideStep && (
                        <button
                          type="button"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground pointer-events-auto transition-colors"
                          onClick={handleNextStep}
                        >
                          Next
                        </button>
                      )}
                      {dishaAvailable && (
                        <button
                          type="button"
                          className="text-xs font-medium text-orange-600 hover:text-orange-700 pointer-events-auto transition-colors dark:text-orange-400 dark:hover:text-orange-300"
                          onClick={() => setAskOpen(true)}
                        >
                          Ask Disha
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </DishaSpeechBubble>
            </motion.div>
          )}
        </AnimatePresence>

        <Freddy
          animation={moodToFreddyAnimation[mood]}
          playing={!minimized && !dismissed}
          loop
          size={avatarSize}
          className="select-none drop-shadow-lg"
        />
      </motion.div>

      {dishaAvailable && <DishaAskPanel open={askOpen} onClose={closeAskPanel} />}
    </div>
  )
}

export { DishaInner as Disha }
export default DishaInner
