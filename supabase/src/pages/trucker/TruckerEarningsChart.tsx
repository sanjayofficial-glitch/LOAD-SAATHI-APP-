import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TruckerEarningsChartProps {
  data: { month: string; earnings: number }[];
}

export default function TruckerEarningsChart({ data }: TruckerEarningsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey="earnings" fill="url(#orangeGradient)" radius={[6, 6, 0, 0]} maxBarSize={48} />
        <defs>
          <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#fb923c" stopOpacity={0.4} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
