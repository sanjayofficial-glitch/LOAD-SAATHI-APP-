import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface HistoryEntry {
  score: number
  changed_at: string
}

interface CreditScoreHistoryProps {
  history: HistoryEntry[]
}

export default function CreditScoreHistory({ history }: CreditScoreHistoryProps) {
  if (!history || history.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Not enough data points to show history yet.</p>
        </CardContent>
      </Card>
    )
  }

  const data = history.map((h) => ({
    date: new Date(h.changed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    score: h.score,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score History</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={[300, 900]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
