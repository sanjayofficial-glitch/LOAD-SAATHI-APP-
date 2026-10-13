import { useEffect, useCallback, useRef } from 'react'
import { useDisha } from '@/components/DishaContext'
import { useDishaGuide } from '@/components/DishaGuideProvider'
import type { DishaMood } from '@/components/DishaMascot'

export interface FormFieldConfig {
  key: string
  selector: string
  placeholder?: boolean
  validate?: (value: string) => boolean
  tip?: string
  tipMood?: DishaMood
}

export interface UseMascotFormWatcherOptions {
  fields: FormFieldConfig[]
  autoStartFlow?: string
}

export function useMascotFormWatcher(options: UseMascotFormWatcherOptions) {
  const { fields, autoStartFlow } = options
  const { setMood, setTip, setShowBubble } = useDisha()
  const { handleFieldFocus, handleValidationError, handleSuccess, startFlow, state } = useDishaGuide()
  const processedFields = useRef<Set<string>>(new Set())
  const keystrokeCount = useRef<Record<string, number>>(Object.fromEntries(fields.map(f => [f.key, 0])))

  useEffect(() => {
    if (autoStartFlow && state.userPreferences.autoGuide) {
      startFlow(autoStartFlow)
    }
  }, [autoStartFlow, state.userPreferences.autoGuide, startFlow, state])

  const notifyField = useCallback((selector: string) => {
    handleFieldFocus(selector)
  }, [handleFieldFocus])

  const watchFields = useCallback(() => {
    fields.forEach(field => {
      const el = document.querySelector<HTMLElement>(field.selector)
      if (!el || processedFields.current.has(field.key)) return

      const inputEl = el as HTMLInputElement | HTMLTextAreaElement

      const handleFocus = () => {
        processedFields.current.add(field.key)
        notifyField(field.selector)

        if (field.tip) {
          setTip({
            message: field.tip,
            mood: field.tipMood ?? 'listening',
            when: 'first-interaction',
          })
          setShowBubble(true)
        }
      }

      const handleInput = (e: Event) => {
        const value = (e.target as HTMLInputElement).value
        keystrokeCount.current[field.key] = (keystrokeCount.current[field.key] ?? 0) + 1

        if (field.validate) {
          const isValid = field.validate(value)

          if (value.length > 0 && !isValid) {
            if (field.tip) {
              setMood('thinking')
              setTip({
                message: field.tip,
                mood: 'thinking',
                when: 'error',
              })
              setShowBubble(true)
            }
          } else if (value.length > 0 && isValid) {
            if (field.tip) {
              setMood('playful')
            }
          }
        } else if (value.length > 0 && field.tip && keystrokeCount.current[field.key] === 1) {
          setMood('listening')
        }
      }

      const handleBlur = () => {
        if (field.validate) {
          const value = inputEl?.value ?? ''
          const isValid = field.validate(value)
          if (value && isValid) {
            handleSuccess(field.selector)
          } else if (value && !isValid) {
            handleValidationError(field.selector, false)
          }
        }
      }

      el.addEventListener('focus', handleFocus)
      el.addEventListener('input', handleInput)
      if (inputEl) {
        inputEl.addEventListener('blur', handleBlur)
      }
    })
  }, [fields, notifyField, handleValidationError, handleSuccess, setMood, setTip, setShowBubble])

  const isGuideActive = state.isActive
  const isActiveState = !isGuideActive && autoStartFlow

  useEffect(() => {
    watchFields()
    const timer = setInterval(watchFields, 500)
    return () => clearInterval(timer)
  }, [isActiveState, watchFields])

  const resetField = useCallback((key: string) => {
    processedFields.current.delete(key)
    keystrokeCount.current[key] = 0
  }, [])

  return {
    resetField,
    isWatching: true,
  }
}

export default useMascotFormWatcher
