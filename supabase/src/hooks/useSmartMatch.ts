import { useRef, useEffect, useState, useCallback } from 'react'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'

import type { AIMatchResult } from '@/types'

const DEBOUNCE_MS = 300

export function useSmartMatch<T extends { id: string }>(
  items: T[],
  getParams: (item: T) => Record<string, unknown> | null,
  maxItems = 5,
) {
  const [scores, setScores] = useState<Record<string, AIMatchResult>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const { getToken } = useClerkAuth()
  const fetchedRef = useRef<Set<string>>(new Set())
  const prevItemsRef = useRef<string>('')
  const lastFetchRef = useRef<number>(0)

  const fetchScore = useCallback(async (item: T) => {
    const params = getParams(item)
    if (!params || !supabaseUrl || fetchedRef.current.has(item.id)) return null
    const now = Date.now()
    if (now - lastFetchRef.current < DEBOUNCE_MS) return null
    lastFetchRef.current = now

    try {
      const token = await getToken()
      if (!token) return null
      const res = await fetch(`${supabaseUrl}/functions/v1/match-ml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      })
      if (!res.ok) return null
      const data = (await res.json()) as AIMatchResult & { provider?: string }
      setScores(prev => ({ ...prev, [item.id]: data }))
      fetchedRef.current.add(item.id)
      return data
    } catch {
      return null
    }
  }, [getParams, supabaseUrl, getToken])

  useEffect(() => {
    const key = JSON.stringify(items.map(i => i.id))
    if (key === prevItemsRef.current) return
    prevItemsRef.current = key
    fetchedRef.current.clear()
  }, [items])

  useEffect(() => {
    const queue = items.slice(0, maxItems).filter(i => !fetchedRef.current.has(i.id))
    if (queue.length === 0) return
    let cancelled = false
    ;(async () => {
      for (let idx = 0; idx < queue.length; idx++) {
        if (cancelled) break
        const item = queue[idx]
        if (!item) continue
        setLoadingId(item.id)
        await fetchScore(item)
        if (idx < queue.length - 1) await new Promise(r => setTimeout(r, 150))
      }
      if (!cancelled) setLoadingId(null)
    })()
    return () => { cancelled = true }
  }, [items, maxItems, fetchScore])

  return { scores, loadingId, refetch: () => fetchedRef.current.clear() }
}