import { useEffect, useState } from 'react';
import {
  ArrowLeft, Trophy, TrendingUp, TrendingDown, Target, BarChart3,
  Award, AlertTriangle, Star, ChevronDown, ChevronUp, Clock, DollarSign,
  Activity, Zap, Shield, Scale
} from 'lucide-react';
import { api } from '../services/api';

interface TradeAnalysis {
  trade: any;
  analysis: {
    verdict: string;
    highlights: string[];
    improvements: string[];
    score: number;
  };
}

interface SummaryData {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldingTimeMs: number;
  startingBalance: number;
  currentBalance: number;
  returnPercent: number;
}

interface AnalyticsData {
  trades: any[];
  summary: SummaryData | null;
  perTradeAnalysis: TradeAnalysis[];
}

interface Props {
  onBack: () => void;
}

export default function AnalyticsPage({ onBack }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getTradeAnalytics() as AnalyticsData;
        setData(res);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading your trade analytics...</p>
        </div>
      </div>
    );
  }

  const s = data?.summary;
  const analyses = data?.perTradeAnalysis ?? [];
  const filtered = filter === 'all' ? analyses
    : filter === 'wins' ? analyses.filter(a => (a.trade.pnl ?? 0) > 0)
    : analyses.filter(a => (a.trade.pnl ?? 0) < 0);

  return (
    <div className="min-h-screen bg-surface-900">
      {/* ── Header ── */}
      <header className="h-16 bg-surface-800/90 backdrop-blur-md border-b border-white/5 flex items-center px-6 sticky top-0 z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mr-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Dashboard</span>
        </button>
        <div className="h-8 w-px bg-white/10 mr-6" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Trade Analytics</h1>
            <p className="text-[10px] text-gray-500">AI-powered performance review & coaching</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {!s || s.closedTrades === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400/10 to-gold-600/10 flex items-center justify-center mb-6">
              <Trophy size={36} className="text-gold-400/40" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Completed Trades Yet</h2>
            <p className="text-sm text-gray-400 max-w-lg mx-auto text-center leading-relaxed mb-8">
              Open a position on the dashboard, then close it to see your personalized AI trade analysis.
              Each trade gets scored and reviewed with specific suggestions.
            </p>
            <button onClick={onBack}
              className="px-6 py-2.5 bg-gradient-to-r from-gold-400 to-gold-600 text-surface-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-gold-500/20 transition-all">
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* ════════════ PERFORMANCE OVERVIEW ════════════ */}
            <section>
              <h2 className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-4">Performance Overview</h2>

              {/* Hero stat row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <HeroCard
                  label="Account Balance"
                  value={`$${s.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  subtitle={`Started at $${s.startingBalance.toLocaleString()}`}
                  icon={DollarSign}
                  gradient={s.currentBalance >= s.startingBalance ? 'from-emerald-500/10 to-emerald-600/10' : 'from-red-500/10 to-red-600/10'}
                  color={s.currentBalance >= s.startingBalance ? 'text-emerald-400' : 'text-red-400'}
                />
                <HeroCard
                  label="Total Return"
                  value={`${s.returnPercent >= 0 ? '+' : ''}${s.returnPercent}%`}
                  subtitle={`${s.totalPnl >= 0 ? '+' : ''}$${s.totalPnl.toFixed(2)} realized`}
                  icon={TrendingUp}
                  gradient={s.returnPercent >= 0 ? 'from-emerald-500/10 to-teal-500/10' : 'from-red-500/10 to-orange-500/10'}
                  color={s.returnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <HeroCard
                  label="Win Rate"
                  value={`${s.winRate}%`}
                  subtitle={`${s.wins}W / ${s.losses}L of ${s.closedTrades} trades`}
                  icon={Target}
                  gradient={s.winRate >= 50 ? 'from-blue-500/10 to-indigo-500/10' : 'from-amber-500/10 to-orange-500/10'}
                  color={s.winRate >= 50 ? 'text-blue-400' : 'text-amber-400'}
                />
                <HeroCard
                  label="Profit Factor"
                  value={s.profitFactor >= 999 ? '∞' : s.profitFactor.toFixed(2)}
                  subtitle={s.profitFactor >= 2 ? 'Excellent' : s.profitFactor >= 1 ? 'Profitable' : 'Losing money'}
                  icon={Scale}
                  gradient={s.profitFactor >= 1.5 ? 'from-purple-500/10 to-pink-500/10' : 'from-red-500/10 to-rose-500/10'}
                  color={s.profitFactor >= 1.5 ? 'text-purple-400' : s.profitFactor >= 1 ? 'text-amber-400' : 'text-red-400'}
                />
              </div>

              {/* Detailed stats */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                <MiniStat icon={Activity} label="Avg P&L" value={`$${s.avgPnl.toFixed(2)}`} color={s.avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                <MiniStat icon={TrendingUp} label="Avg Win" value={`+$${s.avgWin.toFixed(2)}`} color="text-emerald-400" />
                <MiniStat icon={TrendingDown} label="Avg Loss" value={`-$${s.avgLoss.toFixed(2)}`} color="text-red-400" />
                <MiniStat icon={Award} label="Best Trade" value={`+$${s.bestTrade.toFixed(2)}`} color="text-emerald-400" />
                <MiniStat icon={AlertTriangle} label="Worst Trade" value={`$${s.worstTrade.toFixed(2)}`} color="text-red-400" />
                <MiniStat icon={Clock} label="Avg Hold" value={formatDuration(s.avgHoldingTimeMs)} color="text-gray-300" />
              </div>
            </section>

            {/* ════════════ AI COACHING SUMMARY ════════════ */}
            <section className="p-5 bg-gradient-to-r from-surface-800 to-surface-800/80 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-gold-400" />
                <h3 className="text-sm font-semibold text-white">AI Performance Coach</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{getCoachingSummary(s)}</p>
            </section>

            {/* ════════════ TRADE-BY-TRADE ANALYSIS ════════════ */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs text-gray-500 uppercase tracking-widest font-medium">
                  Trade-by-Trade Review ({filtered.length})
                </h2>
                <div className="flex gap-1">
                  {(['all', 'wins', 'losses'] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        filter === f
                          ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}>
                      {f === 'all' ? 'All' : f === 'wins' ? '✅ Wins' : '❌ Losses'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filtered.map((item, index) => {
                  const t = item.trade;
                  const a = item.analysis;
                  const isExpanded = expandedTrade === (t.id ?? index);
                  const isWin = (t.pnl ?? 0) > 0;
                  const globalIndex = analyses.indexOf(item);

                  return (
                    <div key={t.id ?? index}
                      className={`rounded-2xl overflow-hidden border transition-all ${
                        isExpanded ? 'border-gold-500/20 bg-surface-800' : 'border-white/5 bg-surface-800/60'
                      }`}>
                      {/* Trade header */}
                      <button
                        onClick={() => setExpandedTrade(isExpanded ? null : (t.id ?? index))}
                        className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left">
                        {/* Trade number + indicator */}
                        <div className="flex flex-col items-center w-10">
                          <span className="text-xs text-gray-500 font-medium">#{globalIndex + 1}</span>
                          <div className={`w-3 h-3 rounded-full mt-1 ${isWin ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        </div>

                        {/* Trade info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.type === 'BUY'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}>{t.type}</span>
                            <span className="text-xs text-gray-300">
                              ${t.entryPrice?.toFixed(2)} → ${t.exitPrice?.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-600">• {t.quantity} oz</span>
                          </div>
                          <p className="text-[11px] text-gray-500">{a.verdict}</p>
                        </div>

                        {/* P&L + Score */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-base font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isWin ? '+' : ''}${t.pnl?.toFixed(2)}
                            </p>
                          </div>

                          {/* Score ring */}
                          <div className="relative w-11 h-11 hidden sm:block">
                            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={a.score >= 70 ? '#34d399' : a.score >= 40 ? '#fbbf24' : '#f87171'}
                                strokeWidth="3" strokeDasharray={`${a.score}, 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{a.score}</span>
                          </div>

                          {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                        </div>
                      </button>

                      {/* Expanded analysis */}
                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-4 border-t border-white/5">
                          {/* Trade details grid */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4">
                            <DetailItem label="Entry" value={`$${t.entryPrice?.toFixed(2)}`} />
                            <DetailItem label="Exit" value={`$${t.exitPrice?.toFixed(2)}`} />
                            <DetailItem label="Volume" value={`${t.quantity} oz`} />
                            <DetailItem label="Stop Loss" value={t.stopLoss ? `$${t.stopLoss.toFixed(2)}` : 'Not set'} color={t.stopLoss ? 'text-red-400' : 'text-gray-600'} />
                            <DetailItem label="Take Profit" value={t.takeProfit ? `$${t.takeProfit.toFixed(2)}` : 'Not set'} color={t.takeProfit ? 'text-emerald-400' : 'text-gray-600'} />
                          </div>

                          {/* Highlights */}
                          {a.highlights.length > 0 && (
                            <div>
                              <h4 className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                                <Star size={11} /> What You Did Well
                              </h4>
                              <div className="space-y-2">
                                {a.highlights.map((h, i) => (
                                  <div key={i} className="flex gap-3 p-3 bg-emerald-500/[0.04] rounded-xl border border-emerald-500/10">
                                    <span className="text-emerald-400 mt-0.5 shrink-0 text-sm">✓</span>
                                    <p className="text-xs text-emerald-100/80 leading-relaxed">{h}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Improvements */}
                          {a.improvements.length > 0 && (
                            <div>
                              <h4 className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                                <Shield size={11} /> How to Improve
                              </h4>
                              <div className="space-y-2">
                                {a.improvements.map((imp, i) => (
                                  <div key={i} className="flex gap-3 p-3 bg-amber-500/[0.04] rounded-xl border border-amber-500/10">
                                    <span className="text-amber-400 mt-0.5 shrink-0 text-sm">→</span>
                                    <p className="text-xs text-amber-100/80 leading-relaxed">{imp}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function HeroCard({ label, value, subtitle, icon: Icon, gradient, color }: {
  label: string; value: string; subtitle: string; icon: any; gradient: string; color: string;
}) {
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} border border-white/5`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
      <p className="text-[10px] text-gray-500">{subtitle}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color = 'text-white' }: {
  icon: any; label: string; value: string; color?: string;
}) {
  return (
    <div className="p-3 bg-surface-800/60 rounded-xl border border-white/5 text-center">
      <Icon size={12} className={`${color} mx-auto mb-1 opacity-60`} />
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
      <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function DetailItem({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 60000) return '<1m';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function getCoachingSummary(s: SummaryData): string {
  const parts: string[] = [];

  parts.push(`You've completed ${s.closedTrades} trade${s.closedTrades > 1 ? 's' : ''}, generating a ${s.returnPercent >= 0 ? 'profit' : 'loss'} of ${s.returnPercent >= 0 ? '+' : ''}${s.returnPercent}% on your starting balance.`);

  if (s.winRate >= 60) {
    parts.push(`Your ${s.winRate}% win rate is above average — you're selecting setups well. Keep being selective.`);
  } else if (s.winRate >= 45) {
    parts.push(`Your ${s.winRate}% win rate is near the breakeven zone. Focus on improving your average win-to-loss ratio to stay profitable even with fewer wins.`);
  } else {
    parts.push(`Your ${s.winRate}% win rate needs work. Quality over quantity — wait for A+ setups instead of entering every opportunity.`);
  }

  if (s.profitFactor >= 2) {
    parts.push('Your profit factor of ' + s.profitFactor.toFixed(1) + ' is excellent — your winners significantly outpace your losers. Keep this ratio.');
  } else if (s.profitFactor >= 1) {
    parts.push('You\'re profitable, but there\'s room to grow. Try letting winners run longer with trailing stops, while cutting losers faster.');
  } else {
    parts.push('Your losses currently outweigh gains. The #1 fix: always set a stop-loss, and never risk more than 1-2% per trade.');
  }

  if (s.avgHoldingTimeMs > 0) {
    const mins = Math.round(s.avgHoldingTimeMs / 60000);
    if (mins < 5) parts.push('Your average hold time is very short — scalping requires extreme precision. Consider holding a bit longer to capture bigger moves.');
    else if (mins > 120) parts.push('You tend to hold positions for extended periods. This patience can pay off, but make sure you always have a stop-loss protecting your capital.');
  }

  return parts.join(' ');
}
