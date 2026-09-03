interface CreditScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function CreditScoreGauge({ score, size = 'md' }: CreditScoreGaugeProps) {
  const clamped = Math.max(300, Math.min(900, score))
  const pct = ((clamped - 300) / 600) * 100

  const hue = ((900 - clamped) / 600) * 120
  const color = `hsl(${hue}, 80%, 45%)`

  const dims = { sm: 80, md: 120, lg: 160 }
  const strokeWidth = { sm: 6, md: 8, lg: 10 }
  const fontSize = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }
  const d = dims[size]
  const sw = strokeWidth[size]
  const r = (d - sw) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: d, height: d }}>
      <svg width={d} height={d} className="-rotate-90">
        <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={sw} />
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className={`absolute font-bold ${fontSize[size]}`} style={{ color }}>
        {clamped}
      </span>
    </div>
  )
}
