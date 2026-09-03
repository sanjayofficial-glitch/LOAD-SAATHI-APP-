import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { CreditScoreFactors } from '@/types'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

interface CreditScoreDetailProps {
  factors: CreditScoreFactors
}

const factorMeta: Record<string, { label: string; desc: string }> = {
  completion: { label: 'Trip Completion', desc: 'Based on completed vs cancelled trips' },
  reliability: { label: 'Reliability', desc: 'On-time performance and accepted request ratio' },
  reviews: { label: 'Reviews', desc: 'Average rating from other users' },
  communication: { label: 'Communication', desc: 'Response rate and message activity' },
  tenure: { label: 'Tenure', desc: 'Account age and platform experience' },
}

export default function CreditScoreDetail({ factors }: CreditScoreDetailProps) {
  const factorKeys = ['completion', 'reliability', 'reviews', 'communication', 'tenure'] as const

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Score Breakdown
          <Badge variant={factors.tier === 'excellent' || factors.tier === 'good' ? 'default' : 'outline'}>
            {factors.tier.replace('_', ' ')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {factorKeys.map((key) => {
          const f = factors[key]
          const meta = factorMeta[key]
          const pct = f.max > 0 ? Math.round((f.score / f.max) * 100) : 0
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{meta?.label ?? key}</span>
                <span className="text-muted-foreground">
                  {f.score}/{f.max}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                {pct >= 70
                  ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                  : <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                {meta?.desc}
              </p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}