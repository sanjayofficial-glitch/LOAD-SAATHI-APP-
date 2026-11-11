import { createContext } from 'react'
import type { DishaMood } from './DishaMascot'
import type { DishaPosition } from './DishaMascot'
import type { GuideState, GuideStep } from './DishaGuideEngine'

export type DishaPageContext =
  | 'public-landing'
  | 'public-public'
  | 'auth'
  | 'shipper'
  | 'trucker'
  | 'admin'
  | 'profile'
  | 'shipper-post'
  | 'trucker-post'
  | 'unknown'

export interface DishaTip {
  message: string
  mood?: DishaMood
  when?: 'enter' | 'idle' | 'first-interaction' | 'cta-hover' | 'success' | 'error' | 'help-open'
}

export interface DishaContextValue {
  mood: DishaMood
  setMood: (mood: DishaMood) => void
  minimized: boolean
  setMinimized: (minimized: boolean) => void
  dismissed: boolean
  setDismissed: (dismissed: boolean) => void
  tip: DishaTip | null
  setTip: (tip: DishaTip | null) => void
  pageContext: DishaPageContext
  anchor: 'bottom-right' | 'bottom-left' | 'free'
  position: DishaPosition
  move: (dx: number, dy: number) => void
  setPosition: (position: DishaPosition) => void
  showBubble: boolean
  setShowBubble: (show: boolean) => void
  speak: (message: string, mood?: DishaMood) => void
  resetForNewSession: () => void
  reaction: { name: string; nonce: number } | null;
  playReaction: (name: string) => void;
  // Guide integration
  guideState: GuideState | null
  guideStep: GuideStep | null
  guideTargetPosition: { x: number; y: number; side: string; targetRect: DOMRect | null } | null
  setGuideMood: (mood: DishaMood) => void
  triggerGuideReaction: (reaction: 'error' | 'success' | 'confused' | 'thinking' | 'idle') => void
  triggerErrorReaction: (message: string) => void
  triggerSuccessReaction: (message: string) => void
  nextStep: () => void
  dismissStep: () => void
  /** Accept the pending "Can I guide you?" offer and start the walkthrough. */
  acceptGuide: () => boolean
  /** Decline the pending offer and park the mascot back in its circle. */
  declineGuide: () => boolean
  /** Stop the active guide and return the mascot to its circle. */
  stopGuide: () => void
}

export const DishaContext = createContext<DishaContextValue | null>(null)
