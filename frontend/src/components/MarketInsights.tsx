import { useEffect, useState } from 'react';
import { Brain, Newspaper, RefreshCw, ExternalLink, AlertTriangle, Lightbulb } from 'lucide-react';
import { api } from '../services/api';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface InsightData {
  summary: string;
  condition: string;
  advice: string[];
  riskNote: string;
  newsContext: NewsItem[];
  generatedAt: string;
}

export default function MarketInsights() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchInsights() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMarketInsights() as InsightData;
      setInsights(data);
    } catch (err: any) {
      setError('Could not load insights');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const conditionColor =
    insights?.condition?.includes('Uptrend') || insights?.condition?.includes('Rally')
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : insights?.condition?.includes('Decline') || insights?.condition?.includes('Selloff')
        ? 'text-red-400 bg-red-500/10 border-red-500/20'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Market Insights</h3>
            <p className="text-[10px] text-gray-500">Real-time analysis & news</p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <p className="text-xs text-red-400 text-center py-4">{error}</p>}

      {!insights && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full" />
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          {/* Market Condition Badge */}
          <div className="flex items-center gap-2">
            <span className={`badge border ${conditionColor} text-xs px-2.5 py-1`}>
              {insights.condition}
            </span>
            <span className="text-[10px] text-gray-500">
              {new Date(insights.generatedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Summary — the main natural language insight */}
          <div className="p-3.5 bg-surface-700/40 rounded-lg border border-white/5">
            <p className="text-sm text-gray-200 leading-relaxed">{insights.summary}</p>
          </div>

          {/* Actionable Advice */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={12} className="text-gold-400" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">What to do</span>
            </div>
            <div className="space-y-2">
              {insights.advice.map((tip, i) => (
                <div key={i} className="p-3 bg-surface-700/30 rounded-lg border border-white/5">
                  <p className="text-xs text-gray-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200/80 leading-relaxed">{insights.riskNote}</p>
          </div>

          {/* News Context */}
          {insights.newsContext.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Newspaper size={12} className="text-blue-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Related News</span>
              </div>
              <div className="space-y-1.5">
                {insights.newsContext.map((news, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-surface-700/30 rounded-lg group hover:bg-surface-700/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 font-medium leading-snug line-clamp-2">{news.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">{news.source}</span>
                        <span className="text-[10px] text-gray-600">•</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(news.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {news.url && (
                      <a href={news.url} target="_blank" rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
