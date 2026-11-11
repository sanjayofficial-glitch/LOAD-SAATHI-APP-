import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useDisha } from '@/components/DishaContext.hooks'
import type { DishaMood } from '@/components/DishaMascot'

/**
 * Global mascot reaction layer.
 *
 * Freddy should visibly react to what the user is doing across the whole
 * platform — not just on the auth pages. This hook listens to the common
 * interaction events (typing, searching, clicking, selecting, submitting,
 * navigating) and maps each one to a mood + a short badge next to the mascot.
 *
 * Moods drive the Freddy animation; badges are emitted as a window event so
 * they can be rendered by the mascot without re-rendering the whole app.
 */

export interface MascotReactionDetail {
  mood: DishaMood
  /** Badge text; falls back to MOOD_BADGES[mood].label. */
  label?: string
  /** Badge emoji; falls back to MOOD_BADGES[mood].emoji. */
  emoji?: string
  /** When provided, also opens the speech bubble with this message. */
  message?: string
  /** Set false to change the mood without showing a badge. */
  badge?: boolean
}

/** Short, human label + emoji shown next to the mascot for each mood. */
export const MOOD_BADGES: Record<DishaMood, { emoji: string; label: string }> = {
  idle: { emoji: '🙂', label: 'Ready' },
  blink: { emoji: '🙂', label: 'Ready' },
  waking: { emoji: '👋', label: 'Hi there!' },
  excited: { emoji: '⚡', label: 'Nice typing!' },
  playful: { emoji: '😄', label: 'On it!' },
  listening: { emoji: '👂', label: 'Listening…' },
  thinking: { emoji: '🤔', label: 'Thinking…' },
  working: { emoji: '⚙️', label: 'Working…' },
  celebrate: { emoji: '🎉', label: 'Great job!' },
  confused: { emoji: '😅', label: 'Hmm?' },
  drowsy: { emoji: '😴', label: 'Sleepy…' },
  sleeping: { emoji: '😴', label: 'Zzz…' },
  searching: { emoji: '🔎', label: 'Searching…' },
  curious: { emoji: '👀', label: 'Let’s see…' },
  helpful: { emoji: '💡', label: 'Happy to help!' },
  surprised: { emoji: '😮', label: 'Oh!' },
  happy: { emoji: '😊', label: 'Happy to help' },
  laughing: { emoji: '😂', label: 'Ha ha!' },
}

export const MASCOT_BADGE_EVENT = 'lsaathi-mascot-badge'
export const MASCOT_REACTION_EVENT = 'lsaathi-mascot-reaction'

function emit(name: string, detail: unknown) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

/** Show a transient badge next to the mascot (e.g. "🔎 Searching…"). */
export function emitMascotBadge(label: string, emoji: string) {
  emit(MASCOT_BADGE_EVENT, { label, emoji })
}

/**
 * Trigger a mascot reaction from anywhere in the app, e.g. after a successful
 * upload:
 *   emitMascotReaction('celebrate', { label: 'Load posted!', emoji: '🎉' })
 */
export function emitMascotReaction(mood: DishaMood, options?: Omit<MascotReactionDetail, 'mood'>) {
  emit(MASCOT_REACTION_EVENT, { mood, ...options })
}

const SEARCH_HINT = /search|find|filter|query|lookup|browse/i

function isSearchField(el: HTMLElement): boolean {
  const input = el as HTMLInputElement
  const type = (input.getAttribute?.('type') || 'text').toLowerCase()
  if (type === 'search') return true
  if (input.getAttribute?.('role') === 'searchbox') return true
  if (el.closest('[role="search"], [data-mascot-search]')) return true
  const hint = [input.placeholder, input.name, input.id, el.getAttribute('aria-label')]
    .filter(Boolean)
    .join(' ')
  return SEARCH_HINT.test(hint)
}

function isTextField(el: HTMLElement): boolean {
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true
}

/**
 * Mount once per DishaProvider (all three layouts). Listens platform-wide and
 * keeps the mascot's animation in sync with what the user is doing.
 */
export function useMascotInteractionTracker() {
  const { setMood, setTip, setShowBubble, dismissed, guideState } = useDisha()
  const location = useLocation()

  const lastBadge = useRef<{ label: string; at: number } | null>(null)
  const firstNav = useRef(true)

  // Same-label badges are throttled so rapid typing/clicking doesn't spam;
  // a *different* reaction always replaces the current one immediately.
  const showBadge = useCallback((label: string, emoji: string, throttleMs = 1500) => {
    const now = Date.now()
    const prev = lastBadge.current
    if (prev && prev.label === label && now - prev.at < throttleMs) return
    lastBadge.current = { label, at: now }
    emitMascotBadge(label, emoji)
  }, [])

  const react = useCallback(
    (
      mood: DishaMood,
      options?: { badge?: boolean; label?: string; emoji?: string; message?: string },
    ) => {
      setMood(mood)
      const meta = MOOD_BADGES[mood]
      const label = options?.label ?? meta?.label
      const emoji = options?.emoji ?? meta?.emoji
      if (options?.badge !== false && label && emoji) showBadge(label, emoji)
      if (options?.message) {
        setTip({ message: options.message, mood, when: 'help-open' })
        setShowBubble(true)
      }
    },
    [setMood, setTip, setShowBubble, showBadge],
  )

  // Route changes → a curious "let's see" reaction. (Skipped during a guided
  // flow so the guide owns the mascot's mood.)
  useEffect(() => {
    if (firstNav.current) {
      firstNav.current = false
      return
    }
    if (guideState?.isActive) return
    react('curious')
  }, [location.pathname, react, guideState?.isActive])

  useEffect(() => {
    if (dismissed || guideState?.isActive) return
    const inMascot = (el: Element | null) => !!el?.closest('[data-disha-root]')

    // Typing → excited, or "searching" when it's a search/filter box.
    const onInput = (e: Event) => {
      const el = e.target as HTMLElement | null
      if (!el || inMascot(el)) return
      if (el.tagName === 'SELECT') return
      if (!isTextField(el)) return
      react(isSearchField(el) ? 'searching' : 'excited')
    }

    const onClick = (e: Event) => {
      const el = e.target as HTMLElement | null
      if (!el || inMascot(el)) return
      if (el.closest('input, textarea, select, [contenteditable="true"]')) {
        react('thinking', { label: 'Let me help…', emoji: '🤔' })
        return
      }
      if (el.closest('button, a, [role="button"], [role="tab"], [role="menuitem"], [role="option"]')) {
        react('playful')
      }
    }

    const onChange = (e: Event) => {
      const el = e.target as HTMLElement | null
      if (!el || inMascot(el)) return
      if (el.tagName === 'SELECT') {
        react('curious', { label: 'Good choice!', emoji: '👍' })
        return
      }
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        react('playful')
      }
    }

    const onSubmit = () => react('working')
    const onReaction = (e: Event) => {
      const detail = (e as CustomEvent<MascotReactionDetail>).detail
      if (!detail?.mood) return
      react(detail.mood, detail)
    }

    document.addEventListener('input', onInput)
    document.addEventListener('click', onClick)
    document.addEventListener('change', onChange)
    document.addEventListener('submit', onSubmit)
    window.addEventListener(MASCOT_REACTION_EVENT, onReaction as EventListener)
    return () => {
      document.removeEventListener('input', onInput)
      document.removeEventListener('click', onClick)
      document.removeEventListener('change', onChange)
      document.removeEventListener('submit', onSubmit)
      window.removeEventListener(MASCOT_REACTION_EVENT, onReaction as EventListener)
    }
  }, [dismissed, react, guideState?.isActive])
}

/** Headless component — drop into any screen that lives under DishaProvider. */
export function MascotInteractionTracker() {
  useMascotInteractionTracker()
  return null
}

export default useMascotInteractionTracker
