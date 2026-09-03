import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import type { CreditInsights } from '@/types'

interface AIInsightsProps {
  insights: CreditInsights | null | undefined
  loading: boolean
}

export default React.memo(function AIInsights({ insights, loading }: AIInsightsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating insights...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) return null

  const TrendIcon = insights.overallTrend === 'up'
    ? TrendingUp
    : insights.overallTrend === 'down'
    ? TrendingDown
    : Minus

  const trendColor = insights.overallTrend === 'up'
    ? 'text-green-500'
    : insights.overallTrend === 'down'
    ? 'text-red-500'
    : 'text-yellow-500'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5" />
          AI Insights
          <Badge variant="outline" className="text-[10px]">
            {insights.provider}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
          <span className="text-sm font-medium">{insights.summary}</span>
        </div>

        {insights.strengths && insights.strengths.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-green-600 dark:text-green-400">Strengths</p>
            <ul className="space-y-0.5">
              {insights.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-0.5 text-green-500">+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insights.improvements && insights.improvements.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-orange-600 dark:text-orange-400">To Improve</p>
            <ul className="space-y-0.5">
              {insights.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-0.5 text-orange-500">→</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
