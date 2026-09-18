import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PricePoint {
  date: string;
  price: number;
}

interface PriceTrendChartProps {
  origin: string;
  destination: string;
}

export default function PriceTrendChart({ origin, destination }: PriceTrendChartProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!origin || !destination) return;
    setLoading(true);
    setData([]);
    setCurrentPrice(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      setLoading(false);
      return;
    }

    fetch(`${supabaseUrl}/functions/v1/demand-forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originCity: origin, destinationCity: destination, allowPublic: true, daysAhead: 7 }),
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((apiData: any) => {
        const forecasts = apiData.forecasts || [];
        const points: PricePoint[] = forecasts.slice(0, 14).map((f: any) => ({
          date: f.date,
          price: f.suggestedPricePerTonne,
        }));
        setData(points);
        const lastPoint = points[points.length - 1];
        if (lastPoint) {
          setCurrentPrice(lastPoint.price);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [origin, destination]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const lastPrice = prices[prices.length - 1];
    if (lastPrice === undefined) return null;
    const current = currentPrice ?? lastPrice;
    let position: "low" | "medium" | "high" = "medium";
    if (current <= min + (max - min) * 0.33) position = "low";
    else if (current >= max - (max - min) * 0.33) position = "high";

    return { min, max, avg, median, current, position };
  }, [data, currentPrice]);

  if (!origin || !destination) return null;

  return (
    <Card className="mt-6 glass-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-400" /> Price Trend
          <span className="text-xs text-muted-foreground font-normal">{origin} → {destination}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length > 0 && stats ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-3xl font-black text-foreground">₹{stats.current.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">per tonne</div>
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                stats.position === "low" ? "bg-green-900/20 text-green-400" :
                stats.position === "high" ? "bg-red-900/20 text-red-400" :
                "bg-yellow-900/20 text-yellow-400"
              }`}>
                {stats.position === "low" ? "Low" : stats.position === "high" ? "High" : "Medium"} — {stats.position === "low" ? "Prices are low" : stats.position === "high" ? "Prices are high" : "Prices are moderate"}
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v: number) => `₹${v}`} domain={["dataMin - 100", "dataMax + 100"]} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelFormatter={(label: string | number) => new Date(String(label)).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                    formatter={(value: number | string) => [`₹${Number(value)}`, "Price per tonne"] as unknown as React.ReactNode[]}
                  />
                  <ReferenceLine y={stats.median} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="price" stroke="#f97316" strokeWidth={3} dot={{ fill: "#f97316", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span>Based on {data.length} days of demand forecasts. Dashed line shows median price.</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No historical price data available for this route yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
