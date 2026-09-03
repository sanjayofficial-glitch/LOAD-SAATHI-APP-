import { useRef, useEffect, useState, useCallback } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'

export interface AIMatchResult {
  aiScore: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

/**
 * Fetches AI match scores for the top items in a list.
 * Only processes the first `maxItems` items, staggers calls to avoid throttling.
 * Resets fetched set when items change to handle filtering/reordering.
 */
export function useSmartMatch<T extends { id: string }>(
  items: T[],
  getParams: (item: T) => Record<string, unknown> | null,
  maxItems = 10,
) {
  const [scores, setScores] = useState<Record<string, AIMatchResult>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const { getToken } = useClerkAuth()
  const fetchedRef = useRef<Set<string>>(new Set())
  const prevItemsRef = useRef<string>('')

  const fetchScore = useCallback(async (item: T) => {
    const params = getParams(item)
    if (!params || !supabaseUrl || fetchedRef.current.has(item.id)) return null


    setLoadingId(item.id)
    try {
      const token = await getToken({ template: 'supabase' })
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${supabaseUrl}/functions/v1/match-ml`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(6000),
      })
      if (!response.ok) return null
      const data: AIMatchResult = await response.json()
      fetchedRef.current.add(item.id)
      return data
    } catch {
      fetchedRef.current.add(item.id)
      return null
    } finally {
      setLoadingId(null)
    }
  }, [getParams, supabaseUrl, getToken])

  useEffect(() => {
    const top = items.slice(0, maxItems)
    if (top.length === 0 || !supabaseUrl) return

    // Reset fetched set when the item list changes (filter, reorder, etc.)
    const itemsKey = top.map(i => i.id).join(',')
    if (itemsKey !== prevItemsRef.current) {
      fetchedRef.current.clear()
      prevItemsRef.current = itemsKey
    }

    let cancelled = false

    const run = async () => {
      for (const item of top) {
        if (cancelled || fetchedRef.current.has(item.id)) continue
        const result = await fetchScore(item)
        if (result && !cancelled) {
          setScores(prev => ({ ...prev, [item.id]: result }))
        }
        await new Promise(r => setTimeout(r, 150))
      }
    }

    run()
    return () => { cancelled = true }
  }, [items, maxItems, supabaseUrl, fetchScore])

  return { scores, loadingId }
}
