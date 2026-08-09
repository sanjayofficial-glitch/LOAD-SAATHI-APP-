
import { Shield, Star, TrendingUp, Award, Brain, Clock, MessageSquare } from 'lucide-react';
import SeoMeta from "@/components/SeoMeta";

const scoreFactors = [
  { label: 'Completion Rate', score: 92, max: 100, weight: '35%', color: 'bg-green-500', icon: Shield },
  { label: 'Reliability', score: 88, max: 100, weight: '25%', color: 'bg-blue-500', icon: Star },
  { label: 'Communication', score: 85, max: 100, weight: '15%', color: 'bg-purple-500', icon: MessageSquare },
  { label: 'Reviews & Feedback', score: 90, max: 100, weight: '15%', color: 'bg-yellow-500', icon: ThumbsUp },
  { label: 'Platform Tenure', score: 78, max: 100, weight: '10%', color: 'bg-orange-500', icon: Clock },
];

const insights = [
  { text: 'Your completion rate is in the top 5% of all truckers on the platform.', type: 'positive' as const },
  { text: 'Consistent on-time deliveries have boosted your reliability score by 12 points this quarter.', type: 'positive' as const },
  { text: 'Responding to messages within 30 minutes could improve your communication score.', type: 'suggestion' as const },
  { text: 'Completing 3 more trips this month will unlock the "Gold Trust" badge.', type: 'suggestion' as const },
];

const tiers = [
  { label: 'Bronze', range: '300-549', color: 'text-amber-600', bar: 'bg-amber-500' },
  { label: 'Silver', range: '550-699', color: 'text-gray-400', bar: 'bg-gray-400' },
  { label: 'Gold', range: '700-799', color: 'text-yellow-500', bar: 'bg-yellow-500' },
  { label: 'Platinum', range: '800-900', color: 'text-blue-400', bar: 'bg-blue-400' },
];

function ThumbsUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

export default function CreditScorePreview() {
  const score = 832;
  const tier = 'Platinum';

  return (
    <>
      <SeoMeta title="Credit Score Preview — LoadSaathi App Screens" description="Preview LoadSaathi's digital freight credit score: a trust and reputation system that quantifies reliability across every interaction." canonical="/screens/credit-score" />
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-purple-500/5 via-transparent to-transparent">
          <div className="absolute top-0 right-1/3 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-16 sm:py-20 relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">App Preview: Credit Score</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A trust and reputation system that quantifies reliability across every interaction on the platform.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12">
        <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
          <div className="h-11 border-b border-border bg-card/80 flex items-center px-5 gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">TRUST_SCORE_DASHBOARD</span>
            <div className="flex-grow" />
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div className="p-6 bg-background/50 dark:bg-[#050816]/50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Score Gauge */}
              <div className="lg:col-span-1">
                <div className="glass-card p-6 rounded-xl border-border text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">Overall Trust Score</div>

                  {/* Gauge */}
                  <div className="relative w-44 h-44 mx-auto mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGradient)" strokeWidth="8"
                        strokeDasharray={`${(score / 900) * 264} 264`}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-foreground">{score}</span>
                      <span className="text-sm font-bold text-blue-400">{tier}</span>
                    </div>
                  </div>

                  {/* Tier Range */}
                  <div className="flex justify-center gap-2 mb-6">
                    {tiers.map((t) => {
                      const rangeStart = parseInt(t.range.split('-')[0] ?? '0');
                      return (
                        <div key={t.label} className="text-center">
                          <div className={`h-1.5 w-10 rounded-full ${score >= rangeStart ? t.bar : 'bg-border'} mb-1`} />
                          <div className={`text-[9px] font-semibold ${t.color}`}>{t.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Platform Percentile</span>
                      <span className="font-bold text-foreground">Top 3%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Score Change</span>
                      <span className="font-bold text-green-400 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />+24 pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="font-bold text-foreground">Today</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                {/* Score Factors */}
                <div className="glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center gap-2 mb-5">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Score Breakdown</span>
                  </div>
                  <div className="space-y-4">
                    {scoreFactors.map((factor) => {
                      const Icon = factor.icon;
                      const fillPercent = (factor.score / factor.max) * 100;
                      return (
                        <div key={factor.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-semibold text-foreground">{factor.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{factor.score}/{factor.max}</span>
                              <span className="text-[10px] text-muted-foreground">Weight: {factor.weight}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${factor.color}`}
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="glass-card p-5 rounded-xl border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">AI Insights</span>
                  </div>
                  <div className="space-y-3">
                    {insights.map((insight, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                        insight.type === 'positive' ? 'bg-green-500/5 border border-green-500/10' : 'bg-blue-500/5 border border-blue-500/10'
                      }`}>
                        <div className={`p-1 rounded-full mt-0.5 ${
                          insight.type === 'positive' ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          {insight.type === 'positive' ? (
                            <TrendingUp className={`h-3 w-3 ${insight.type === 'positive' ? 'text-green-400' : 'text-blue-400'}`} />
                          ) : (
                            <Brain className="h-3 w-3 text-blue-400" />
                          )}
                        </div>
                        <span className="text-xs text-foreground/80">{insight.text}</span>
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