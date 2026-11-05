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
import { Mic, BadgeCheck, Bell } from 'lucide-react'
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

// Cache key for search results — keyed by normalized message + sessionId
const SEARCH_CACHE_KEY = 'loadsaathi-freddy-search-cache'
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

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
    setDismissed,
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
    acceptGuide,
    declineGuide,
    stopGuide,
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
  const chatPanelRef = useRef<HTMLDivElement | null>(null)
  const chatListRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // ── Freddy chat state (additive — does not touch existing tip/guide flows) ──
  const { getToken } = useClerkAuth()
  const [chatMode, setChatMode] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<FreddyMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [voiceListening, setVoiceListening] = useState(false)
  const [newAlerts, setNewAlerts] = useState(0)
  const [showHelpPanel, setShowHelpPanel] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const chatMessagesRef = useRef(chatMessages)
  const speechRef = useRef<SpeechRecognition | null>(null)

  // Keep ref in sync with state for stable access inside callbacks
  useEffect(() => { chatMessagesRef.current = chatMessages }, [chatMessages])

  // Read cached search results (if any) for a given message
  const getCachedResult = useCallback((message: string, sessionId: string) => {
    try {
      const raw = localStorage.getItem(SEARCH_CACHE_KEY)
      if (!raw) return null
      const cache = JSON.parse(raw) as Record<string, { timestamp: number; result: unknown }>
      const key = `${sessionId}:${message.trim().toLowerCase()}`
      const entry = cache[key]
      if (entry && Date.now() - entry.timestamp < SEARCH_CACHE_TTL_MS) {
        return entry.result
      }
    } catch {
      // ignore corrupt cache
    }
    return null
  }, [])

  // Store search result in cache
  const setCachedResult = useCallback((message: string, sessionId: string, result: unknown) => {
    try {
      const raw = localStorage.getItem(SEARCH_CACHE_KEY)
      const cache = raw ? (JSON.parse(raw) as Record<string, { timestamp: number; result: unknown }>) : {}
      const key = `${sessionId}:${message.trim().toLowerCase()}`
      cache[key] = { timestamp: Date.now(), result }
      // Cap cache size to 50 entries
      const keys = Object.keys(cache)
      if (keys.length > 50) {
        const oldest = keys.sort((a, b) => (cache[a]?.timestamp ?? 0) - (cache[b]?.timestamp ?? 0))
        const oldestKey = oldest[0]
        if (oldestKey) delete cache[oldestKey]
      }
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache))
    } catch {
      // ignore
    }
  }, [])

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
        if (typeof parsed.newAlerts === 'number' && parsed.newAlerts > 0) {
          setNewAlerts(parsed.newAlerts)
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
          JSON.stringify({ sessionId, messages: chatMessages.slice(-20), newAlerts }),
        )
      } catch {
        // ignore
      }
    }
  }, [sessionId, chatMessages, newAlerts])

  // ── Chat dialog: autofocus + focus trap while open ──
  useEffect(() => {
    if (!chatMode || !showBubble) return
    const panel = chatPanelRef.current
    if (!panel) return

    const getFocusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))

    getFocusables()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const els = getFocusables()
      if (els.length === 0) return
      const firstEl = els[0]!
      const lastEl = els[els.length - 1]!
      const active = document.activeElement
      if (!panel.contains(active)) {
        e.preventDefault()
        firstEl.focus()
        return
      }
      if (e.shiftKey && active === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [chatMode, showBubble])

  // Re-focus the composer after a response lands (input is disabled while loading).
  useEffect(() => {
    if (chatMode && showBubble && !chatLoading) {
      chatPanelRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    }
  }, [chatMode, showBubble, chatLoading])

  // Auto-scroll the transcript to the newest message.
  useEffect(() => {
    const el = chatListRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [chatMessages, chatLoading])

  // Invalidate cache when a new message is added (context changed)
  useEffect(() => {
    if (chatMessages.length > 0) {
      try {
        const raw = localStorage.getItem(SEARCH_CACHE_KEY)
        if (raw) localStorage.removeItem(SEARCH_CACHE_KEY)
      } catch {
        // ignore
      }
    }
  }, [chatMessages])

  // Quick reply suggestions shown when chat is empty
  const quickReplies = [
    { label: 'Find trucks', message: 'Find trucks from Rourkela to Ranchi for 5 tonnes under 4000 per tonne' },
    { label: 'My credit score', message: 'What is my credit score' },
    { label: 'Get help', message: 'Get help' },
  ]

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const sendFreddyMessageRef = useRef<((text: string, retryCount?: number) => Promise<void>) | null>(null)

  const sendFreddyMessage = useCallback(async (text: string, retryCount: number = 0) => {
    if (!text.trim() || chatLoading) return
    const userMsg: FreddyMessage = { id: Date.now(), role: 'user', content: text }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    setMood('thinking')
    setTip({ message: "Thinking…", mood: 'thinking' })
    setShowBubble(true)
    setChatError(null)

    try {
      if (!isOnline) {
        throw new Error('You appear to be offline. Check your connection and try again.')
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) throw new Error('Service unavailable')

      // Check cache for previous result
      const cached = getCachedResult(text, sessionId || '')
      if (cached && typeof cached === 'object' && 'ok' in cached) {
        setChatMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: 'freddy',
          content: (cached as any).summary || (cached as any).detail || 'Here are the results.',
          ...(cached as any).loads,
          ...(cached as any).tool && { tool: (cached as any).tool },
          ...(cached as any).strengths && { strengths: (cached as any).strengths },
          ...(cached as any).improvements && { improvements: (cached as any).improvements },
          ...(cached as any).tips && { tips: (cached as any).tips },
          ...(cached as any).projection && { projection: (cached as any).projection },
        }])
        setMood('celebrate')
        setTip({ message: (cached as any).summary || 'Here you go!', mood: 'celebrate' })
        setChatLoading(false)
        if ((cached as any).loads && (cached as any).loads.length > 0) {
          setNewAlerts((prev) => prev + 1)
        }
        return
      }

      const token = await getToken({ template: 'supabase' })
      if (!token) throw new Error('Authentication required')

      // Build history from recent messages. Note: when server-side memory is
      // enabled the backend ignores client-sent history and uses the server store.
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

        // Show help panel for help queries
        if (text.toLowerCase().includes('get help') || text.toLowerCase().includes('i need help') ||
            text.toLowerCase().includes('help me') || text.toLowerCase().includes('how does this work')) {
          setShowHelpPanel(true)
          setMood('helpful')
          setTip({ message: 'Here to help!', mood: 'helpful' })
        } else {
          setMood('idle')
          setTip({ message: data.detail, mood: 'idle' })
        }
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

      // Cache the result for future identical queries (search only, not credit-insights)
      if (data.tool !== 'credit-insights' && sessionId) {
        setCachedResult(text, sessionId, data)
      }

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
      setChatError(errMsg)
      setMood('confused')
      setTip({ message: `Sorry, ${errMsg}.`, mood: 'confused' })

      // Retry once on network errors (not on auth/service errors)
      if (retryCount < 1 && (errMsg.includes('fetch') || errMsg.includes('network') ||
          errMsg.includes('timeout') || errMsg.includes('offline'))) {
        await sendFreddyMessageRef.current?.(text, retryCount + 1)
      } else {
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: 'freddy', content: `Sorry, ${errMsg}. Try again or use the filters on the browse page.` },
        ])
      }
    } finally {
      setChatLoading(false)
    }
  }, [chatLoading, getToken, sessionId, setChatError, setMood, setTip, setShowBubble, isOnline, sendFreddyMessageRef])

  sendFreddyMessageRef.current = sendFreddyMessage

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

  // Surface the "Can I guide you?" offer bubble when a flow is waiting for opt-in.
  useEffect(() => {
    if (guideState?.offerPending) {
      setGuideMood('playful')
      setShowBubble(true)
    }
  }, [guideState?.offerPending, setGuideMood, setShowBubble])

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
    if (dismissed || minimized || guideState?.isActive || guideState?.offerPending || chatMode) return

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
  }, [dismissed, minimized, guideState?.isActive, guideState?.offerPending, chatMode, idle, setTip, setShowBubble, setMood])

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
    onEscape: () => {
      if (chatMode && showBubble) {
        handleCloseChat()
      } else {
        setShowBubble(false)
      }
    },
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
    // While an offer is pending, tapping the mascot toggles the offer bubble
    // (it never opens the chat or starts guiding on its own).
    if (guideState?.offerPending) {
      setShowBubble(!showBubble);
      return;
    }
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
    if (!chatMode && document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement
    }
    setChatMode(true)
    if (!showBubble) {
      setMood('listening')
      setShowBubble(true)
    } else {
      setShowBubble(false)
    }
  }, [dismissed, showBubble, chatMode, setMood, setTip, setShowBubble, guideState?.isActive, guideState?.offerPending, guideStep])

  const handleCloseBubble = useCallback(() => {
    setShowBubble(false)
  }, [setShowBubble])

  const handleCloseChat = useCallback(() => {
    setChatMode(false)
    setShowBubble(false)
    const prev = previousFocusRef.current
    if (prev && document.contains(prev)) {
      prev.focus()
    }
    previousFocusRef.current = null
  }, [setChatMode, setShowBubble])

  const handleNextStep = useCallback(() => {
    if (guideState?.isActive) {
      nextStep()
    }
  }, [guideState?.isActive, nextStep])

  if (isProfilePage) return null

  // If Freddy was previously dismissed, keep a small restore chip visible so the
  // mascot can always be brought back (the persisted dismissal must never be a
  // permanent soft-lock with no recovery path).
  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="fixed bottom-24 left-6 z-[100] inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/95 px-4 py-2 text-xs font-semibold text-orange-700 shadow-lg backdrop-blur transition-colors hover:bg-orange-50 dark:border-orange-900/40 dark:bg-gray-900/95 dark:text-orange-300 dark:hover:bg-gray-800"
        aria-label="Show Freddy the LoadSaathi assistant"
        data-disha-restore
      >
        <span aria-hidden>🐻</span> Show Freddy
      </button>
    )
  }

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
        aria-label={`Freddy the LoadSaathi assistant, mood ${mood}${minimized ? ', minimized' : ''}${dismissed ? ', dismissed' : ''}`}                        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
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
                <DishaSpeechBubble open={!minimized && !dismissed && showBubble} side={bubbleSide} gap={3} mascotX={renderedMascot?.x} mascotY={renderedMascot?.y} mascotSize={mascotSize} asDialog={chatMode}>
                  <div ref={chatPanelRef} className="flex flex-col gap-2 w-[300px] max-w-[calc(100vw-4rem)] pointer-events-auto">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[11px] font-bold mt-0.5">
                        F
                      </span>
                      <div className="flex flex-col gap-0">
                        <p id="freddy-chat-title" className="text-xs font-semibold text-gray-900 dark:text-white">Freddy</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Chat</p>
                      </div>
                      {showHelpPanel && (
                        <button
                          type="button"
                          onClick={() => setShowHelpPanel(false)}
                          className="text-[10px] font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Close help"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Get Help panel */}
                    {showHelpPanel && (
                      <div className="mb-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-900/30 text-xs space-y-1.5">
                        <p className="font-semibold text-orange-800 dark:text-orange-200">How Freddy can help:</p>
                        <ul className="text-gray-700 dark:text-gray-200 space-y-0.5 text-[10px]">
                          <li>• Type a route like "Find trucks from Rourkela to Ranchi"</li>
                          <li>• Add capacity & price: "for 5 tonnes under 4000 per tonne"</li>
                          <li>• Ask "What is my credit score" for insights</li>
                          <li>• Say "Get help" anytime for this guide</li>
                        </ul>
                        <button
                          type="button"
                          onClick={() => setShowHelpPanel(false)}
                          className="text-[9px] text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 font-medium mt-1"
                        >
                          Got it
                        </button>
                      </div>
                    )}

                    {/* Message list */}
                    <div ref={chatListRef} aria-label="Chat history" className="flex-1 min-h-[120px] max-h-[200px] overflow-y-auto pr-2 space-y-2 scroll-smooth">
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
                                    <BadgeCheck className="ml-1 h-3.5 w-3.5 text-orange-500 inline" />
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
                      {chatError && !chatLoading && (
                        <div className="mr-auto bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-tl-none rounded-lg p-2 text-xs border border-red-200 dark:border-red-900/30">
                          <div>⚠️ {chatError}</div>
                          {chatMessages.length > 0 && chatMessages[chatMessages.length - 1]?.role === 'freddy' && chatMessages[chatMessages.length - 1]?.content.includes(chatError) ? (
                            <button
                              type="button"
                              onClick={() => {
                                const lastMsg = chatMessages[chatMessages.length - 1]
                                if (lastMsg) {
                                  setChatMessages((prev) => prev.filter((m) => m.id !== lastMsg.id))
                                  setChatError(null)
                                  sendFreddyMessage(lastMsg.content)
                                }
                              }}
                              className="text-[9px] text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 mt-0.5"
                            >
                              Tap to retry
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Alert badge */}
                    {newAlerts > 0 && (
                      <div className="mb-1 flex items-center justify-between px-2">
                        <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                          <Bell className="h-3 w-3 inline mr-1 -mt-0.5" />
                          {newAlerts} new match alert{newAlerts > 1 ? 's' : ''}
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

                    {/* Quick replies when chat is empty */}
                    {chatMessages.length === 0 && !chatLoading && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {quickReplies.map((q) => (
                          <button
                            key={q.label}
                            type="button"
                            onClick={() => sendFreddyMessage(q.message)}
                            className="text-[10px] px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                          >
                            {q.label}
                          </button>
                        ))}
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
                        aria-label="Message Freddy"
                        maxLength={2000}
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
                        onClick={handleCloseChat}
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
                  {!minimized && !dismissed && (tip || guideStep || guideState?.offerPending) && (
                    <div className="flex flex-row items-start gap-2 w-[300px] max-w-[calc(100vw-4rem)]">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[11px] font-bold mt-0.5">
                        F
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {guideState?.offerPending ? (
                          <>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Freddy</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug break-normal">
                              {pageContext === 'trucker-post'
                                ? 'Want me to guide you through posting your trip? I\'ll point out each field.'
                                : 'Want me to guide you through posting your load? I\'ll point out each field.'}
                            </p>
                            <div className="flex gap-2 items-center mt-1.5">
                              <button
                                type="button"
                                className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-700 pointer-events-auto"
                                onClick={() => {
                                  acceptGuide()
                                }}
                              >
                                Yes, guide me
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 pointer-events-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                onClick={() => {
                                  declineGuide()
                                  setShowBubble(false)
                                }}
                              >
                                No thanks
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
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
                                <>
                                  <button
                                    type="button"
                                    className="text-xs font-medium text-muted-foreground hover:text-foreground pointer-events-auto transition-colors"
                                    onClick={handleNextStep}
                                  >
                                    Next
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs font-medium text-muted-foreground hover:text-red-600 pointer-events-auto transition-colors"
                                    onClick={() => {
                                      stopGuide()
                                      setShowBubble(false)
                                    }}
                                  >
                                    Stop
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
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
