import React from 'react'
import { usePricePrediction } from '@/hooks/usePricePrediction'
import type { PricePredictionInput } from '@/hooks/usePricePrediction'
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PricePredictorProps extends PricePredictionInput {
  onApplyPrice?: (price: number) => void
}

export const PricePredictor = React.memo(function PricePredictor(props: PricePredictorProps) {
  const shouldFetch =
    props.originCity.length > 0 &&
    props.destinationCity.length > 0 &&
    props.weightTonnes > 0

  const { data, isLoading, isError } = usePricePrediction({
    originCity: props.originCity,
    destinationCity: props.destinationCity,
    originState: props.originState,
    destinationState: props.destinationState,
    weightTonnes: props.weightTonnes,
    vehicleType: props.vehicleType,
  })

  if (!shouldFetch) return null

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>AI analysing market prices...</span>
      </div>
    )
  }

  if (isError || !data) {
    return null
  }

  const TrendIcon =
    data.trend === 'rising'
      ? TrendingUp
      : data.trend === 'falling'
        ? TrendingDown
        : Minus

  const trendColor =
    data.trend === 'rising'
      ? 'text-red-500'
      : data.trend === 'falling'
        ? 'text-green-500'
        : 'text-gray-400'

  const confidenceColor =
    data.confidence === 'high'
      ? 'text-green-600 dark:text-green-400'
      : data.confidence === 'medium'
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-gray-400'

  return (
    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg p-3 mt-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Price Suggestion</span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
            {data.provider}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${confidenceColor}`}>
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          <span className="capitalize">{data.trend}</span>
          <span className="mx-1">·</span>
          <span className="capitalize">{data.confidence}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-blue-800 dark:text-blue-200">
            ₹{data.recommendedPrice.toLocaleString()}
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">/tonne</span>
          <span className="text-xs text-blue-500 dark:text-blue-500 ml-2">
            ₹{data.range.min.toLocaleString()} – ₹{data.range.max.toLocaleString()}
          </span>
        </div>
        {props.onApplyPrice && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
            onClick={() => props.onApplyPrice?.(data.recommendedPrice)}
          >
            Apply
          </Button>
        )}
      </div>
      {data.historicalLoads != null && (
        <div className="flex items-center gap-1 text-xs text-blue-500/60 dark:text-blue-400/50">
          <Database className="h-3 w-3" />
          <span>Based on {data.historicalLoads} recent load{data.historicalLoads !== 1 ? 's' : ''}
            {data.historicalAvgPrice != null && <> · avg ₹{data.historicalAvgPrice.toLocaleString()}/t</>}
          </span>
        </div>
      )}
      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 italic">
        {data.reasoning}
      </p>
    </div>
  )
})
