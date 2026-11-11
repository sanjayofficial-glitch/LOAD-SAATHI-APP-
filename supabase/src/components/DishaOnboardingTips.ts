import { useEffect, useCallback } from 'react'
import { useDisha } from './DishaContext.hooks'
import type { DishaMood } from './DishaMascot'

const ONBOARDED_KEY = 'loadsaathi-disha-onboarded'
const AUTO_OPEN_TIPS = true

export const pageContextMessages: Record<string, Array<{ message: string; mood: DishaMood }>> = {
  'public-landing': [
    { message: "Ready to ship? Tap 'I Want to Ship Goods' to post your first load.", mood: 'excited' },
    { message: "Have a truck? Tap 'I Have Truck Space' to start earning.", mood: 'playful' },
  ],
  'shipper': [
    { message: "Tip: Use filters to narrow down trucks by route and capacity!", mood: 'thinking' },
    { message: "Your credit score unlocks better rates — check it in your profile!", mood: 'playful' },
  ],
  'trucker': [
    { message: "Tip: Post a trip to get matched with shippers automatically!", mood: 'excited' },
    { message: "Browse loads by route to find profitable trips near you.", mood: 'listening' },
  ],
  'auth': [
    { message: "Take your time — I'll guide you through each step.", mood: 'listening' },
    { message: "Questions? Just tap me and I'll help out!", mood: 'idle' },
  ],
}

export function useDishaPageTip() {
  const { pageContext, dismissed, minimized, tip, speak } = useDisha()

  const hasSeenTip = useCallback(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(ONBOARDED_KEY) === '1'
    } catch {
      return false
    }
  }, [])

  const markTipSeen = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(ONBOARDED_KEY, '1')
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (dismissed || minimized) return

    const actionPages: Array<typeof pageContext> = [
      'public-landing',
      'auth',
      'shipper',
      'trucker',
      'admin',
    ]

    if (!actionPages.includes(pageContext)) return

    const showGreeting =
      pageContext === 'shipper' ||
      pageContext === 'trucker' ||
      pageContext === 'auth'

    if (showGreeting && !hasSeenTip() && AUTO_OPEN_TIPS) {
      const greeting: Record<string, { message: string; mood: DishaMood }> = {
        shipper: {
          message: "Welcome! Post your first load or browse trucks — I'm here to guide you.",
          mood: 'listening',
        },
        trucker: {
          message: "Welcome! Post a trip or browse loads — tap me anytime for help.",
          mood: 'listening',
        },
        'public-landing': {
          message: "Hi! I'm Freddy, your LoadSaathi assistant. Tap me or click 'I Want to Ship Goods' to get started!",
          mood: 'playful',
        },
        auth: {
          message: "Hi! I'm Freddy 👋 Ready to help you get set up. Tap any highlighted field for tips!",
          mood: 'playful',
        },
        admin: {
          message: 'Welcome to the admin panel. Tap me if you need help navigating.',
          mood: 'idle',
        },
      }

      const g = greeting[pageContext]
      if (g && !tip) {
        speak(g.message, g.mood)
        markTipSeen()
      }
    }
  }, [pageContext, dismissed, minimized, tip, speak, hasSeenTip, markTipSeen])
}