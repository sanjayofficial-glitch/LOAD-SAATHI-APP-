import { motion, AnimatePresence } from 'framer-motion'

// Web Speech API type declarations (not in standard TS DOM lib)
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
      prototype: SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
      prototype: SpeechRecognition
    }
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    abort(): void
    onresult: (this: SpeechRecognition, event: Event) => void
    onend: (this: SpeechRecognition, event: Event) => void
    onerror: (this: SpeechRecognition, event: Event) => void
  }
}

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
import type { DishaMood } from './DishaMascot'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Mic } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface FreddyLoad {
  id: string
  origin_city: string
  destination_city: string
  departure_date: string
  price_per_tonne?: number
  available_capacity_tonnes?: number
  vehicle_type?: string
  status?: string
  trucker?: { full_name?: string; rating?: number; is_verified?: boolean }
}

interface FreddyMessage {
  id: number
  role: 'user' | 'freddy'
  content: string
  loads?: FreddyLoad[]
  summary?: string
  tool?: string
  strengths?: string[]
  improvements?: string[]
  tips?: string[]
  projection?: string
}

const CHAT_STORAGE_KEY = 'loadsaathi-freddy-chat'
const MAX_CONTEXT_MESSAGES = 6

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

  // ── Freddy chat state (additive — does not touch existing tip/guide flows) ──
  const { getToken } = useClerkAuth()
  const [chatMode, setChatMode] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<FreddyMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [voiceListening, setVoiceListening] = useState(false)
  const [newAlerts, setNewAlerts] = useState(0)
  const speechRef = useRef<SpeechRecognition | null>(null)

  // Load conversation history from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.sessionId) setSessionId(parsed.sessionId)
        if (Array.isArray(parsed.messages)) {
          setChatMessages((prev) => [
            ...prev,
            ...parsed.messages.slice(-20),
          ])
        }
      }
    } catch {
      // ignore
    }
    // Generate a sessionId if none exists.
    if (!sessionId) {
      const newId = crypto.randomUUID()
      setSessionId(newId)
    }
  }, [sessionId])

  // Persist chat to localStorage whenever it changes.
  useEffect(() => {
    if (sessionId && chatMessages.length > 0) {
      try {
        localStorage.setItem(
          CHAT_STORAGE_KEY,
          JSON.stringify({ sessionId, messages: chatMessages.slice(-20) }),
        )
      } catch {
        // ignore
      }
    }
  }, [sessionId, chatMessages])

  const sendFreddyMessage = useCallback(async (text: string) => {
    if (!text.trim() || chatLoading) return
    const userMsg: FreddyMessage = { id: Date.now(), role: 'user', content: text }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    setMood('thinking')
    setTip({ message: "Thinking…", mood: 'thinking' })
    setShowBubble(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) throw new Error('Service unavailable')

      const token = await getToken({ template: 'supabase' })
      if (!token) throw new Error('Authentication required')

      // Build history from recent messages (exclude the just-added user msg).
      const history = chatMessages.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch(`${supabaseUrl}/functions/v1/agent-router`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          history,
        }),
        signal: AbortSignal.timeout(20000),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || `Freddy error (${res.status})`)
      }

      const data = await res.json()

      if (!data.ok) {
        throw new Error(data.detail || data.error || 'Freddy returned no results')
      }

      // Kill switch / disabled state: backend reports enabled:false.
      if (data.enabled === false) {
        const freddyMsg: FreddyMessage = {
          id: Date.now() + 1,
          role: 'freddy',
          content: 'Freddy is temporarily unavailable. Please try again later, or use the browse filters on the search page.',
        }
        setChatMessages((prev) => [...prev, freddyMsg])
        setMood('idle')
        setTip({ message: 'Freddy is temporarily unavailable.', mood: 'idle' })
        setChatLoading(false)
        return
      }

      // No tool executed (e.g. no usable filters extracted).
      if (!data.tool && data.detail) {
        const freddyMsg: FreddyMessage = {
          id: Date.now() + 1,
          role: 'freddy',
          content: data.detail,
        }
        setChatMessages((prev) => [...prev, freddyMsg])
        setMood('idle')
        setTip({ message: data.detail, mood: 'idle' })
        setChatLoading(false)
        return
      }

      const freddyMsg: FreddyMessage = {
        id: Date.now() + 1,
        role: 'freddy',
        content: data.summary || (data.tool === 'credit-insights' ? 'Here are your credit insights.' : 'Here are the matching trucks:'),
        loads: data.loads,
        tool: data.tool,
        strengths: data.strengths,
        improvements: data.improvements,
        tips: data.tips,
        projection: data.projection,
      }
      setChatMessages((prev) => [...prev, freddyMsg])

      if (data.tool === 'credit-insights') {
        setMood('celebrate')
        setTip({
          message: data.summary || 'Here are your credit score insights.',
          mood: 'celebrate',
        })
      } else if (data.loads && data.loads.length > 0) {
        setMood('celebrate')
        setTip({ message: data.summary || 'Here are the matching trucks:', mood: 'celebrate' })
      } else {
        setMood('idle')
        setTip({ message: data.summary || "I couldn't find any matches.", mood: 'idle' })
      }

      // Track new alerts for notification badge.
      if (data.loads && data.loads.length > 0) {
        setNewAlerts((prev) => prev + 1)
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong'
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'freddy', content: `Sorry, ${errMsg}. Try again or use the filters on the browse page.` },
      ])
      setMood('confused')
      setTip({ message: `Sorry, ${errMsg}.`, mood: 'confused' })
    } finally {
      setChatLoading(false)
    }
  }, [chatLoading, chatMessages, getToken, sessionId, setMood, setTip, setShowBubble])

  // ── Voice input (Web Speech API) ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'

    recognition.onresult = (event: Event) => {
      const transcript = (event as any).results[0][0].transcript
      setChatInput(transcript)
    }

    recognition.onend = () => {
      setVoiceListening(false)
    }

    recognition.onerror = () => {
      setVoiceListening(false)
    }

    speechRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [])

  const startVoiceInput = () => {
    if (!speechRef.current || voiceListening) return
    setVoiceListening(true)
    speechRef.current.start()
  }


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
    if (dismissed || minimized || guideState?.isActive || chatMode) return

    const idleMessages: Array<{ message: string; mood: DishaMood }> =
      pageContextMessages[pageContext] ??
      [
        { message: "Need help finding the right load?", mood: 'idle' },
        { message: "Tip: Use filters to narrow down routes by city!", mood: 'thinking' },
        { message: "Your credit score unlocks better rates — check it in profile!", mood: 'playful' },
      ]

    const interval = setInterval(() => {
      if (idle && !chatMode) {
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
  }, [dismissed, minimized, guideState?.isActive, chatMode, idle, setTip, setShowBubble, setMood])

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
    // Enter Freddy chat mode (non-guide path). Chat is additive — existing
    // tip/guide flows are untouched.
    setChatMode(true)
    if (!showBubble) {
      setMood('listening')
      setShowBubble(true)
    } else {
      setShowBubble(false)
    }
  }, [dismissed, showBubble, setMood, setTip, setShowBubble, guideState?.isActive, guideStep])

  const handleCloseBubble = useCallback(() => {
    setShowBubble(false)
  }, [setShowBubble])

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
          {!minimized && !dismissed && showBubble && (
            <motion.div
              className="pointer-events-none absolute z-[10001]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {chatMode ? (
                <DishaSpeechBubble open={!minimized && !dismissed && showBubble} side={bubbleSide} gap={3} mascotX={renderedMascot?.x} mascotY={renderedMascot?.y} mascotSize={mascotSize}>
                  <div className="flex flex-col gap-2 w-[300px] max-w-[calc(100vw-4rem)]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[11px] font-bold mt-0.5">
                        F
                      </span>
                      <div className="flex flex-col gap-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">Freddy</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Chat</p>
                      </div>
                    </div>

                    {/* Message list */}
                    <div className="flex-1 min-h-[120px] max-h-[200px] overflow-y-auto pr-2 space-y-2 scroll-smooth">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'rounded-lg p-2 text-xs leading-snug break-words max-w-[260px]',
                            msg.role === 'user'
                              ? 'ml-auto bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100 rounded-tr-none'
                              : 'mr-auto bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none',
                          )}
                        >
                          {msg.content}

                          {/* Credit score insights details */}
                          {msg.tool === 'credit-insights' && msg.strengths && (
                            <div className="mt-1 pt-1 border-t border-orange-200/50 dark:border-orange-900/30">
                              <div className="flex gap-2 mt-1">
                                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded p-1 text-[10px]">
                                  <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-0.5">Strengths</div>
                                  <ul className="text-[9px] text-green-600 dark:text-green-400 list-disc pl-2 space-y-0.5">
                                    {msg.strengths.slice(0, 3).map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded p-1 text-[10px]">
                                  <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-0.5">Improve</div>
                                  <ul className="text-[9px] text-orange-600 dark:text-orange-400 list-disc pl-2 space-y-0.5">
                                    {msg.improvements?.slice(0, 3).map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                              {msg.projection && (
                                <div className="mt-1 text-[9px] text-gray-500 dark:text-gray-400 italic">
                                  {msg.projection}
                                </div>
                              )}
                            </div>
                          )}

                          {msg.loads && msg.loads.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-orange-200/50 dark:border-orange-900/30">
                              {msg.loads.slice(0, 3).map((load) => (
                                <div key={load.id} className="flex items-start gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                                  <div className="min-w-[48px]">{load.origin_city}</div>
                                  <div className="text-[10px] text-gray-400">→</div>
                                  <div className="min-w-[48px]">{load.destination_city}</div>
                                  <div className="ml-2">
                                    {load.price_per_tonne ? `₹${load.price_per_tonne}/t` : '—'}
                                  </div>
                                  {load.available_capacity_tonnes && (
                                    <span className="ml-1">· {load.available_capacity_tonnes}t</span>
                                  )}
                                  {load.trucker?.is_verified && (
                                    <span className="ml-1 text-orange-500">✓</span>
                                  )}
                                </div>
                              ))}
                              {msg.loads.length > 3 && (
                                <div className="mt-0.5 text-[10px] text-gray-500">
                                  + {msg.loads.length - 3} more load{msg.loads.length > 4 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="mr-auto bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none rounded-lg p-2 text-xs">
                          Freddy is searching…
                        </div>
                      )}
                    </div>

                    {/* Alert badge */}
                    {newAlerts > 0 && (
                      <div className="mb-1 flex items-center justify-between px-2">
                        <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                          🔔 {newAlerts} new match alert{newAlerts > 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewAlerts(0)}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* Input */}
                    <div className="flex gap-1.5 mt-1">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            sendFreddyMessage(chatInput)
                          }
                        }}
                        placeholder="Ask me to find trucks…"
                        className="h-8 text-xs px-3 flex-1"
                        disabled={chatLoading}
                      />
                      {typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition) ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={startVoiceInput}
                          disabled={chatLoading || voiceListening}
                          className="h-8 w-8 px-0 rounded-full"
                          aria-label="Voice input"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => sendFreddyMessage(chatInput)}
                        disabled={chatLoading || !chatInput.trim()}
                        className="h-8 px-3 text-xs bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        Send
                      </Button>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <button
                        type="button"
                        className="text-[10px] font-medium text-muted-foreground hover:text-foreground pointer-events-auto transition-colors"
                        onClick={() => {
                          setChatMode(false)
                          setShowBubble(false)
                        }}
                      >
                        Close chat
                      </button>
                      {chatMode && (
                        <button
                          type="button"
                          className="text-[10px] font-medium text-muted-foreground hover:text-foreground pointer-events-auto transition-colors"
                          onClick={handleCloseBubble}
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </DishaSpeechBubble>
              ) : (
                <>
                  {!minimized && !dismissed && (tip || guideStep) && (
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
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
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
    </div>
  )
}

export { DishaInner as Disha }
export default DishaInner
