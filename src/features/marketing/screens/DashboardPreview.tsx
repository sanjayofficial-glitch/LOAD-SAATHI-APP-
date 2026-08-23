
import SeoMeta from "@/components/SeoMeta";
import {
  Package, Clock, TrendingUp, BarChart3, Truck, Map, DollarSign,
  ArrowUp, ArrowDown, Activity, type LucideIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts';

const weeklyData = [
  { name: 'Mon', shipments: 18, revenue: 42000 },
  { name: 'Tue', shipments: 24, revenue: 58000 },
  { name: 'Wed', shipments: 21, revenue: 51000 },
  { name: 'Thu', shipments: 28, revenue: 65000 },
  { name: 'Fri', shipments: 22, revenue: 53000 },
  { name: 'Sat', shipments: 15, revenue: 36000 },
  { name: 'Sun', shipments: 10, revenue: 28000 },
];

const recentShipments = [
  { id: '#SHP-1024', origin: 'Mumbai', dest: 'Delhi', weight: '18T', status: 'In Transit', eta: '2h', statusColor: 'text-blue-400' },
  { id: '#SHP-1023', origin: 'Bangalore', dest: 'Hyderabad', weight: '12T', status: 'Delivered', eta: '-', statusColor: 'text-green-400' },
  { id: '#SHP-1022', origin: 'Chennai', dest: 'Kolkata', weight: '22T', status: 'Pending', eta: 'Tomorrow', statusColor: 'text-yellow-400' },
  { id: '#SHP-1021', origin: 'Delhi', dest: 'Mumbai', weight: '16T', status: 'Awaiting Pickup', eta: '3h', statusColor: 'text-orange-400' },
  { id: '#SHP-1020', origin: 'Pune', dest: 'Ahmedabad', weight: '9T', status: 'In Transit', eta: '5h', statusColor: 'text-blue-400' },
];

const recentTrips = [
  { id: '#TRP-891', origin: 'Delhi', dest: 'Mumbai', distance: '1,420km', earnings: '₹45,000', status: 'Active', statusColor: 'text-green-400' },
  { id: '#TRP-890', origin: 'Mumbai', dest: 'Pune', distance: '150km', earnings: '₹8,500', status: 'Completed', statusColor: 'text-green-400' },
  { id: '#TRP-889', origin: 'Bangalore', dest: 'Chennai', distance: '350km', earnings: '₹18,000', status: 'Active', statusColor: 'text-green-400' },
  { id: '#TRP-888', origin: 'Hyderabad', dest: 'Kolkata', distance: '1,480km', earnings: '₹52,000', status: 'Pending', statusColor: 'text-yellow-400' },
  { id: '#TRP-887', origin: 'Ahmedabad', dest: 'Jaipur', distance: '660km', earnings: '₹24,000', status: 'Completed', statusColor: 'text-green-400' },
];

const StatCard = ({ icon: Icon, label, value, change, changeLabel, iconColor }: {
  icon: LucideIcon; label: string; value: string; change: string; changeLabel: string; iconColor: string;
}) => (
  <div className="glass-card p-5 rounded-xl border-border">
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      <div className={`p-2 rounded-lg ${iconColor.replace('text-', 'bg-').replace('orange-', 'orange-').replace('blue-', 'blue-').replace('green-', 'green-')}/10`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
    </div>
    <div className="text-3xl font-black text-foreground mb-1">{value}</div>
    <div className="flex items-center gap-1 text-xs">
      {change.startsWith('+') ? (
        <ArrowUp className="h-3 w-3 text-green-400" />
      ) : (
        <ArrowDown className="h-3 w-3 text-red-400" />
      )}
      <span className={change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{change}</span>
      <span className="text-muted-foreground ml-1">{changeLabel}</span>
    </div>
  </div>
);

export default function DashboardPreview() {
  return (
    <>
    <SeoMeta title="Dashboard Preview — LoadSaathi App Screens" description="Preview LoadSaathi's role-based dashboard: real-time stats, earnings, and activity at a glance for shippers and truckers." canonical="/screens/dashboard" />
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-orange-500/5 via-transparent to-transparent">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-16 sm:py-20 relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">App Preview: Dashboard</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Role-based command centers giving shippers and truckers real-time visibility into their operations.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12 space-y-16">
        {/* SHIPPER DASHBOARD */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-orange-500 rounded-full" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Shipper Dashboard</h2>
              <p className="text-sm text-muted-foreground">Real-time shipment intelligence and fleet oversight</p>
            </div>
          </div>
          <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
            <div className="h-11 border-b border-border bg-card/80 flex items-center px-5 gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">SHIPPER_WORKSPACE</span>
              <div className="flex-grow" />
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Package} label="Active Shipments" value="124" change="+12%" changeLabel="vs last week" iconColor="text-orange-500" />
                <StatCard icon={Clock} label="Pending Tenders" value="18" change="-5%" changeLabel="vs last week" iconColor="text-blue-400" />
                <StatCard icon={TrendingUp} label="Delivery Rate" value="97.3%" change="+2.1%" changeLabel="this month" iconColor="text-green-400" />
                <StatCard icon={DollarSign} label="Total Spent (MTD)" value="₹18.2L" change="+8.4%" changeLabel="vs last month" iconColor="text-orange-500" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Weekly Shipments</span>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Bar dataKey="shipments" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2 glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Shipments</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {recentShipments.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{s.id}</div>
                          <div className="text-xs text-muted-foreground">{s.origin} → {s.dest} · {s.weight}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${s.statusColor}`}>{s.status}</div>
                          <div className="text-xs text-muted-foreground">{s.eta}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRUCKER DASHBOARD */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-blue-500 rounded-full" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Trucker Dashboard</h2>
              <p className="text-sm text-muted-foreground">Fleet performance, earnings, and route intelligence</p>
            </div>
          </div>
          <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
            <div className="h-11 border-b border-border bg-card/80 flex items-center px-5 gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">TRUCKER_WORKSPACE</span>
              <div className="flex-grow" />
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              <Map className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Truck} label="Fleet Utilization" value="87%" change="+12%" changeLabel="this month" iconColor="text-blue-400" />
                <StatCard icon={Map} label="Active Routes" value="6" change="+2%" changeLabel="vs last week" iconColor="text-green-400" />
                <StatCard icon={DollarSign} label="Earnings (MTD)" value="₹2.8L" change="+15.3%" changeLabel="vs last month" iconColor="text-orange-500" />
                <StatCard icon={TrendingUp} label="Avg. Rating" value="4.8" change="+0.2" changeLabel="this quarter" iconColor="text-blue-400" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Weekly Earnings (₹)</span>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2 glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Trips</span>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {recentTrips.map((t, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{t.id}</div>
                          <div className="text-xs text-muted-foreground">{t.origin} → {t.dest} · {t.distance}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-foreground">{t.earnings}</div>
                          <div className={`text-xs font-semibold ${t.statusColor}`}>{t.status}</div>
                        </div>
                      </div>
                    ))}
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
