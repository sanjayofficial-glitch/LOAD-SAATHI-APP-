import { useQuery } from '@tanstack/react-query'

export interface FuelPrice {
  id: string
  state: string
  city: string
  diesel_price: number
  petrol_price: number
  effective_date: string
  source: string
  updated_at: string
}

export function useFuelPrice(state: string = 'Odisha') {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  return useQuery<FuelPrice | null>({
    queryKey: ['fuelPrice', state],
    queryFn: async () => {
      if (!supabaseUrl) return null

      const response = await fetch(
        `${supabaseUrl}/functions/v1/get-fuel-price?state=${encodeURIComponent(state)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
        },
      )

      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!supabaseUrl,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })
}
