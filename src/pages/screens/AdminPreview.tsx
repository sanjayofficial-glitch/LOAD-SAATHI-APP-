
import { useState } from 'react';
import {
  Activity, Users, DollarSign, TrendingUp, Bell,
  AlertTriangle, CheckCircle, XCircle, Server, Zap, BarChart3,
  type LucideIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts';
import SeoMeta from "@/components/SeoMeta";

const responseTimeData = [
  { time: '00:00', value: 245 }, { time: '04:00', value: 180 }, { time: '08:00', value: 320 },
  { time: '10:00', value: 480 }, { time: '12:00', value: 410 }, { time: '14:00', value: 520 },
  { time: '16:00', value: 490 }, { time: '18:00', value: 560 }, { time: '20:00', value: 430 },
  { time: '22:00', value: 290 },
];

const dailyRevenue = [
  { day: 'Mon', revenue: 142000, trips: 48 },
  { day: 'Tue', revenue: 185000, trips: 62 },
  { day: 'Wed', revenue: 168000, trips: 55 },
  { day: 'Thu', revenue: 210000, trips: 71 },
  { day: 'Fri', revenue: 195000, trips: 68 },
  { day: 'Sat', revenue: 132000, trips: 42 },
  { day: 'Sun', revenue: 98000, trips: 31 },
];

interface Event {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  time: string;
}

const events: Event[] = [
  { id: 1, type: 'success', message: 'Trip TRP-891 completed — payment released', time: '2m ago' },
  { id: 2, type: 'info', message: 'New shipper registered: Tata Logistics Pvt Ltd', time: '5m ago' },
  { id: 3, type: 'warning', message: 'AI Match Score dropped below 70% for SHP-1017', time: '12m ago' },
  { id: 4, type: 'success', message: 'Gemini price prediction updated for 8 shipments', time: '18m ago' },
  { id: 5, type: 'error', message: 'Payment gateway timeout — retrying transaction #TX-8842', time: '25m ago' },
  { id: 6, type: 'info', message: 'New trucker onboarded: Harpreet Singh (Fleet of 3)', time: '30m ago' },
  { id: 7, type: 'warning', message: 'Peak hour load detected — 142 concurrent requests', time: '42m ago' },
  { id: 8, type: 'success', message: 'Shipment SHP-1024 matched via AI (98.2% score)', time: '48m ago' },
  { id: 9, type: 'info', message: 'System health check passed — all services operational', time: '55m ago' },
  { id: 10, type: 'error', message: 'Supabase connection pool at 85% capacity', time: '1h ago' },
];

const eventIcon: Record<string, LucideIcon> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Bell,
};

const eventColor: Record<string, string> = {
  success: 'text-green-400 bg-green-500/10 border-green-500/20',
  warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const MetricCard = ({ icon: Icon, label, value, sub, iconColor }: {
  icon: LucideIcon; label: string; value: string; sub: string; iconColor: string;
}) => (
  <div className="glass-card p-4 rounded-xl border-border">
    <div className="flex items-start justify-between mb-2">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      <div className={`p-1.5 rounded-lg ${iconColor.replace('text-', 'bg-').split(' ')[0]}/10`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
    </div>
    <div className="text-2xl font-black text-foreground mb-0.5">{value}</div>
    <div className="text-[10px] text-muted-foreground">{sub}</div>
  </div>
);

export default function AdminPreview() {
  const [activeSection, setActiveSection] = useState<'events' | 'metrics'>('events');

  return (
    <>
      <SeoMeta title="Admin Center Preview — LoadSaathi App Screens" description="Preview LoadSaathi's admin command center with system health monitoring, business intelligence, and live event tracking." canonical="/screens/admin" />
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-red-500/5 via-transparent to-transparent">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.05] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #ef4444 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-16 sm:py-20 relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">App Preview: Admin Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-time command center with system health monitoring, business intelligence, and live event tracking.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12">
        <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
          <div className="h-11 border-b border-border bg-card/80 flex items-center px-5 gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">ADMIN_COMMAND_CENTER</span>
            <div className="flex-grow" />
            <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => setActiveSection('events')}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeSection === 'events' ? 'bg-red-500/20 text-red-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Live Feed
              </button>
              <button
                onClick={() => setActiveSection('metrics')}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeSection === 'metrics' ? 'bg-blue-500/20 text-blue-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Analytics
              </button>
            </div>
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <MetricCard icon={Activity} label="Response Time" value="245ms" sub="Avg · P95: 520ms" iconColor="text-green-400" />
              <MetricCard icon={Server} label="Error Rate" value="0.8%" sub="Last 24h · Target: <2%" iconColor="text-red-400" />
              <MetricCard icon={DollarSign} label="Revenue (MTD)" value="₹12.4L" sub="+18.3% vs last month" iconColor="text-orange-500" />
              <MetricCard icon={TrendingUp} label="Success Rate" value="97.2%" sub="+2.4% this quarter" iconColor="text-green-400" />
              <MetricCard icon={Users} label="Active Users" value="1,842" sub="+156 today" iconColor="text-blue-400" />
              <MetricCard icon={Zap} label="AI Matches" value="3,421" sub="This month" iconColor="text-purple-400" />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Charts */}
              <div className="lg:col-span-3 space-y-6">
                {/* Response Time Area Chart */}
                <div className="glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">API Response Time</span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Last 24 hours · milliseconds</div>
                    </div>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={responseTimeData}>
                        <defs>
                          <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fill="url(#responseGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue Bar Chart */}
                <div className="glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Daily Revenue & Trips</span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Current week</div>
                    </div>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyRevenue}>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right Panel: Live Events */}
              <div className="lg:col-span-2">
                <div className="glass-card p-5 rounded-xl border-border h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Live Event Feed</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-muted-foreground">Live</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {events.map((event) => {
                      const Icon = eventIcon[event.type] ?? Activity;
                      return (
                        <div
                          key={event.id}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border ${eventColor[event.type]} transition-all`}
                        >
                          <Icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <div className="flex-grow min-w-0">
                            <p className="text-[11px] text-foreground/80 leading-relaxed">{event.message}</p>
                            <span className="text-[9px] text-muted-foreground">{event.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
