import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import type { CreditScore, CreditInsights } from '@/types'

export function useCreditScore(userId?: string) {
  const { userProfile, getSupabaseToken } = useAuth()
  const targetUserId = userId || userProfile?.id
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  return useQuery<CreditScore | null>({
    queryKey: ['creditScore', targetUserId],
    queryFn: async () => {
      if (!targetUserId || !supabaseUrl) return null

      const token = await getSupabaseToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(
        `${supabaseUrl}/functions/v1/credit-score?userId=${encodeURIComponent(targetUserId)}`,
        {
          headers,
          signal: AbortSignal.timeout(8000),
        },
      )

      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!targetUserId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })
}

export function useCreditInsights(creditScore: CreditScore | null | undefined) {
  const { userProfile, getSupabaseToken } = useAuth()
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  return useQuery<CreditInsights | null>({
    queryKey: ['creditInsights', userProfile?.id, creditScore?.score],
    queryFn: async () => {
      if (!creditScore || !userProfile || !supabaseUrl) return null

      const token = await getSupabaseToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(
        `${supabaseUrl}/functions/v1/credit-insights`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            score: creditScore.score,
            factors: creditScore.factors,
            userType: userProfile.user_type,
            userName: userProfile.full_name,
          }),
          signal: AbortSignal.timeout(15000),
        },
      )

      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!creditScore && !!userProfile,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })
}
