import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { DishaMood } from './DishaMascot'
import type { DishaPosition } from './DishaMascot'
import type { GuideState, GuideStep } from './DishaGuideEngine'
import { guideEngine } from './DishaGuideEngine'

import { DishaContext, type DishaContextValue, type DishaTip } from './DishaContext.shared'

const DISMISSED_KEY = 'loadsaathi-disha-dismissed'

function detectPageContext(location: ReturnType<typeof useLocation>, userProfile: NonNullable<ReturnType<typeof useAuth>['userProfile']> | null) {
  const { pathname } = location

  if (['/login', '/register', '/choose-role', '/onboarding', '/forgot-password'].includes(pathname)) {
    return 'auth'
  }

  if (userProfile) {
    if (userProfile.user_type === 'admin' && pathname.startsWith('/admin')) return 'admin'
    if (userProfile.user_type === 'trucker') {
      if (pathname === '/trucker/post-trip') return 'trucker-post'
      if (pathname.startsWith('/trucker')) return 'trucker'
    }
    if (userProfile.user_type === 'shipper') {
      if (pathname === '/shipper/post-shipment') return 'shipper-post'
      if (pathname.startsWith('/shipper') || pathname.startsWith('/browse-trucks')) return 'shipper'
    }
    if (pathname.startsWith('/profile') || pathname.startsWith('/credit-score')) return 'profile'
    if (pathname.startsWith('/trucker') || pathname.startsWith('/shipper') || pathname.startsWith('/admin') || pathname.startsWith('/messages') || pathname.startsWith('/favorites')) {
      return userProfile.user_type === 'trucker' ? 'trucker' : userProfile.user_type === 'shipper' ? 'shipper' : 'admin'
    }
  }

  if (pathname === '/') return 'public-landing'
  if (pathname.startsWith('/')) return 'public-public'

  return 'unknown'
}

export function DishaProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { userProfile } = useAuth()

  const [minimized, setMinimized] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [tip, setTip] = useState<DishaTip | null>(null)
  const [showBubble, setShowBubble] = useState(false)
  const [position, setPosition] = useState<DishaPosition>(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    const margin = 16
    const mascotSize = 150
    return {
      x: window.innerWidth - mascotSize - margin,
      y: window.innerHeight - mascotSize - margin,
    }
  })

  // Persist dismissal for the durable choice, but keep in-memory mood/ help state independent.
  const [mood, setMood] = useState<DishaMood>('idle')

  // Guide integration state
  const [guideState, setGuideState] = useState<GuideState | null>(null)
  const [guideStep, setGuideStep] = useState<GuideStep | null>(null)
  const [guideTargetPosition, setGuideTargetPosition] = useState<{ x: number; y: number; side: string; targetRect: DOMRect | null } | null>(null)
  const [reaction, setReaction] = useState<{ name: string; nonce: number } | null>(null)

  useLayoutEffect(() => {
    let stored = false
    try {
      stored = localStorage.getItem(DISMISSED_KEY) === '1'
    } catch {
      stored = false
    }
    setDismissed(stored)
  }, [])

  useEffect(() => {
    if (dismissed) {
      try {
        localStorage.setItem(DISMISSED_KEY, '1')
      } catch {
        /* storage may be unavailable */
      }
    } else {
      try {
        localStorage.removeItem(DISMISSED_KEY)
      } catch {
        /* storage may be unavailable */
      }
    }
  }, [dismissed])

  const pageContext = useMemo(
    () => detectPageContext(location, userProfile),
    [location, userProfile],
  )

  const move = useCallback(
    (dx: number, dy: number) => {
      setPosition((prev) => {
        const next = { x: prev.x + dx, y: prev.y + dy }
        if (typeof window === 'undefined') return next
        const rect = document.documentElement.getBoundingClientRect()
        const margin = 16
        return {
          x: Math.max(margin, Math.min(rect.width - margin, next.x)),
          y: Math.max(margin, Math.min(rect.height - margin, next.y)),
        }
      })
    },
    [],
  )

  const speak = useCallback(
    (message: string, moodOverride?: DishaMood) => {
      setTip({ message, mood: moodOverride ?? 'idle', when: 'help-open' })
      setShowBubble(true)
      if (moodOverride) setMood(moodOverride)
    },
    [setMood],
  )

  useEffect(() => {
    setTip(null)
    setShowBubble(false)
  }, [pageContext])

  const resetForNewSession = useCallback(() => {
    setTip(null)
    setShowBubble(false)
    setMood('idle')
    setMinimized(false)
  }, [])

  const setMinimizedSafe = useCallback(
    (next: boolean) => {
      setMinimized(next)
      if (next) {
        setShowBubble(false)
      }
    },
    [setShowBubble],
  )

  // Guide integration callbacks
  const setGuideMood = useCallback((newMood: DishaMood) => {
    setMood(newMood)
  }, [])

  const triggerGuideReaction = useCallback((reaction: 'error' | 'success' | 'confused' | 'thinking' | 'idle') => {
    const reactionMoods: Record<string, DishaMood> = {
      error: 'confused',
      success: 'celebrate',
      confused: 'confused',
      thinking: 'thinking',
      idle: 'idle',
    }
    const reactionMood = reactionMoods[reaction] || 'idle'
    setMood(reactionMood)
    
    const reactionMessages: Record<string, string> = {
      error: 'Oops! Something went wrong. Let me help.',
      success: 'Great job! That worked perfectly.',
      confused: 'Hmm, that doesn\'t look right. Try again?',
      thinking: 'Let me think about this...',
      idle: 'Ready when you are!',
    }
    setTip({ message: reactionMessages[reaction] || 'Ready when you are!', mood: reactionMood, when: 'help-open' })
    setShowBubble(true)
  }, [setMood])

  const triggerErrorReaction = useCallback((message: string) => {
    setMood('confused')
    setTip({ message, mood: 'confused', when: 'error' })
    setShowBubble(true)
    setTimeout(() => setMood('idle'), 5000)
  }, [setMood, setTip, setShowBubble])

  const triggerSuccessReaction = useCallback((message: string) => {
    setMood('celebrate')
    setTip({ message, mood: 'celebrate', when: 'success' })
    setShowBubble(true)
    setTimeout(() => setMood('idle'), 5000)
  }, [setMood, setTip, setShowBubble])

  const playReaction = useCallback((name: string) => {
    setReaction({ name, nonce: Date.now() })
  }, [])

  const nextStep = useCallback(() => {
    guideEngine.nextStep()
  }, [])

  const dismissStep = useCallback(() => {
    guideEngine.dismissCurrentStep()
  }, [])

  const acceptGuide = useCallback(() => {
    return guideEngine.acceptGuide()
  }, [])

  const declineGuide = useCallback(() => {
    return guideEngine.declineGuide()
  }, [])

  const stopGuide = useCallback(() => {
    guideEngine.stopGuide()
  }, [])

  // Subscribe to guide engine updates
  useEffect(() => {
    const unsubscribe = guideEngine.subscribe((s: GuideState) => {
      setGuideState(s)
      setGuideStep(guideEngine.getCurrentStep())
      setGuideTargetPosition(guideEngine.getCurrentTargetPosition())
    })
    return () => unsubscribe()
  }, [])

  const value = useMemo<DishaContextValue>(
    () => ({
      mood,
      setMood,
      minimized,
      setMinimized: setMinimizedSafe,
      dismissed,
      setDismissed,
      tip,
      setTip,
      pageContext,
      anchor: minimized ? 'free' : 'bottom-right',
      position,
      move,
      setPosition,
      showBubble,
      setShowBubble,
      speak,
      resetForNewSession,
      guideState,
      guideStep,
      guideTargetPosition,
      setGuideMood,
      reaction,
      playReaction,
      triggerGuideReaction,
      triggerErrorReaction,
      triggerSuccessReaction,
      nextStep,
      dismissStep,
      acceptGuide,
      declineGuide,
      stopGuide,
    }),
    [
      mood,
      setMood,
      minimized,
      setMinimizedSafe,
      dismissed,
      setDismissed,
      tip,
      setTip,
      pageContext,
      position,
      move,
      setPosition,
      showBubble,
      setShowBubble,
      speak,
      resetForNewSession,
      guideState,
      guideStep,
      guideTargetPosition,
      setGuideMood,
      reaction,
      playReaction,
      triggerGuideReaction,
      triggerErrorReaction,
      triggerSuccessReaction,
      nextStep,
      dismissStep,
      acceptGuide,
      declineGuide,
      stopGuide,
    ],
  )

  return <DishaContext.Provider value={value}>{children}</DishaContext.Provider>
}


