import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ShipperSpendingChartProps {
  data: { month: string; spending: number }[];
}

export default function ShipperSpendingChart({ data }: ShipperSpendingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(v >= 100000 ? 1 : 0)}k` : v}`} />
        <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spending']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
        <Bar dataKey="spending" fill="url(#spendingGradient)" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}
