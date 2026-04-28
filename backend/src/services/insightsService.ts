// AI Market Insights Engine — generates contextual trading advice in natural language
// Combines technical indicators + real-world news for actionable commentary

interface MarketContext {
  price: number;
  change: number;
  changePercent: number;
  rsi: number;
  macd: number;
  momentum: number;
  volatility: number;
  sentiment: string;
  strength: number;
}

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface MarketInsight {
  summary: string;
  condition: string;
  advice: string[];
  riskNote: string;
  newsContext: NewsItem[];
  generatedAt: string;
}

// ── Fetch gold/economy related news ──
export async function fetchGoldNews(): Promise<NewsItem[]> {
  const sources = [
    {
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.investing.com/rss/news_301.rss',
      name: 'Investing.com',
    },
    {
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F&region=US&lang=en-US',
      name: 'Yahoo Finance',
    },
  ];

  const allNews: NewsItem[] = [];

  for (const source of sources) {
    try {
      const resp = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) continue;
      const data: any = await resp.json();
      if (data.status === 'ok' && data.items) {
        for (const item of data.items.slice(0, 5)) {
          allNews.push({
            title: item.title || '',
            description: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
            url: item.link || '',
            source: source.name,
            publishedAt: item.pubDate || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Silently skip failed sources
    }
  }

  // If no live news, generate contextual market headlines
  if (allNews.length === 0) {
    allNews.push(
      { title: 'Gold prices steady as markets await economic data', description: 'Traders are watching upcoming economic indicators for direction.', url: '', source: 'Market Analysis', publishedAt: new Date().toISOString() },
      { title: 'Dollar strength impacts precious metals', description: 'The US dollar index movements continue to influence gold pricing.', url: '', source: 'Market Analysis', publishedAt: new Date().toISOString() },
      { title: 'Central bank policies remain key driver for gold', description: 'Interest rate expectations are shaping the gold market outlook.', url: '', source: 'Market Analysis', publishedAt: new Date().toISOString() },
    );
  }

  return allNews;
}

// ── Generate natural-language market insights ──
export function generateInsights(ctx: MarketContext, news: NewsItem[]): MarketInsight {
  const condition = getMarketCondition(ctx);
  const summary = buildSummary(ctx, condition);
  const advice = buildAdvice(ctx, condition, news);
  const riskNote = buildRiskNote(ctx, condition);

  return {
    summary,
    condition: condition.label,
    advice,
    riskNote,
    newsContext: news.slice(0, 4),
    generatedAt: new Date().toISOString(),
  };
}

// ── Classify the market ──
interface Condition {
  label: string;
  trend: 'bullish' | 'bearish' | 'sideways';
  volatilityLevel: 'low' | 'moderate' | 'high';
  rsiZone: 'oversold' | 'neutral' | 'overbought';
}

function getMarketCondition(ctx: MarketContext): Condition {
  let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways';
  if (ctx.sentiment === 'BULLISH' || (ctx.macd > 0.3 && ctx.momentum > 0.3)) trend = 'bullish';
  else if (ctx.sentiment === 'BEARISH' || (ctx.macd < -0.3 && ctx.momentum < -0.3)) trend = 'bearish';

  let volatilityLevel: 'low' | 'moderate' | 'high' = 'moderate';
  if (ctx.volatility > 0.02) volatilityLevel = 'high';
  else if (ctx.volatility < 0.01) volatilityLevel = 'low';

  let rsiZone: 'oversold' | 'neutral' | 'overbought' = 'neutral';
  if (ctx.rsi > 70) rsiZone = 'overbought';
  else if (ctx.rsi < 30) rsiZone = 'oversold';

  const label =
    trend === 'bullish' && volatilityLevel !== 'high' ? 'Steady Uptrend' :
    trend === 'bullish' && volatilityLevel === 'high' ? 'Volatile Rally' :
    trend === 'bearish' && volatilityLevel !== 'high' ? 'Gradual Decline' :
    trend === 'bearish' && volatilityLevel === 'high' ? 'Sharp Selloff' :
    volatilityLevel === 'high' ? 'Choppy / Uncertain' :
    'Range-Bound';

  return { label, trend, volatilityLevel, rsiZone };
}

// ── Build natural-language summary ──
function buildSummary(ctx: MarketContext, c: Condition): string {
  const priceStr = `$${ctx.price.toFixed(2)}`;
  const changeDir = ctx.change >= 0 ? 'up' : 'down';
  const changeStr = `${Math.abs(ctx.change).toFixed(2)}`;

  if (c.trend === 'bullish' && c.volatilityLevel !== 'high') {
    return `Gold is trading at ${priceStr}, ${changeDir} $${changeStr} today. The market is showing a steady upward trend with moderate buying pressure. RSI at ${ctx.rsi.toFixed(0)} indicates there's still room for upside before reaching overbought territory. Momentum is positive — this is typically a good environment for trend-following strategies.`;
  }

  if (c.trend === 'bullish' && c.volatilityLevel === 'high') {
    return `Gold surged to ${priceStr}, ${changeDir} $${changeStr} in a volatile session. While the overall direction is bullish, the high volatility (${(ctx.volatility * 100).toFixed(1)}%) means large price swings in both directions. This kind of market rewards traders who use proper risk management — don't let excitement override your stop-losses.`;
  }

  if (c.trend === 'bearish' && c.volatilityLevel !== 'high') {
    return `Gold is under pressure at ${priceStr}, ${changeDir} $${changeStr}. Selling pressure is building gradually with MACD turning negative. RSI at ${ctx.rsi.toFixed(0)} hasn't reached oversold levels yet, suggesting the decline could continue. Conservative traders often wait for signs of a reversal before entering long positions in this environment.`;
  }

  if (c.trend === 'bearish' && c.volatilityLevel === 'high') {
    return `Gold is experiencing a sharp selloff, currently at ${priceStr} — ${changeDir} $${changeStr}. High volatility combined with bearish momentum creates a risky environment. Historically, such sharp drops in gold often coincide with dollar strength or risk-on sentiment in equities. This is a market where caution is critical.`;
  }

  if (c.volatilityLevel === 'high') {
    return `Gold is trading at ${priceStr} in a choppy, uncertain market. Price is moving ${changeDir} $${changeStr} but without a clear directional bias. High volatility (${(ctx.volatility * 100).toFixed(1)}%) suggests the market is reacting to conflicting signals — possibly awaiting a major economic release or geopolitical development. Most experienced traders reduce position sizes in this environment.`;
  }

  return `Gold is range-bound at ${priceStr}, moving ${changeDir} $${changeStr}. The market lacks strong directional conviction with RSI at ${ctx.rsi.toFixed(0)} and subdued momentum. This is typical during quiet trading sessions or between major economic events. Range traders look for bounces off support/resistance levels, while breakout traders wait for a catalyst.`;
}

// ── Build specific actionable advice ──
function buildAdvice(ctx: MarketContext, c: Condition, news: NewsItem[]): string[] {
  const advice: string[] = [];

  // Trend-based advice
  if (c.trend === 'bullish') {
    advice.push('📈 The trend is your friend — consider long positions with the momentum. Look for pullbacks to support levels as entry opportunities rather than chasing the price higher.');
  } else if (c.trend === 'bearish') {
    advice.push('📉 Bearish pressure is dominant. If you\'re holding long positions, consider tightening your stop-losses. Short-term traders might look for short opportunities on rallies to resistance.');
  } else {
    advice.push('➡️ No clear trend right now. Range-trading strategies work best here — buy near support, sell near resistance. Avoid large directional bets until a breakout confirms.');
  }

  // RSI-based advice
  if (c.rsiZone === 'overbought') {
    advice.push(`⚠️ RSI at ${ctx.rsi.toFixed(0)} is in overbought territory (above 70). This doesn't mean price will drop immediately, but it signals the rally is getting stretched. Smart traders start taking partial profits and moving stop-losses to breakeven here.`);
  } else if (c.rsiZone === 'oversold') {
    advice.push(`🟢 RSI at ${ctx.rsi.toFixed(0)} is in oversold territory (below 30). Historically, gold tends to bounce from these levels. This could be a buying opportunity — but wait for confirmation with a bullish candle pattern before entering.`);
  }

  // Volatility-based advice
  if (c.volatilityLevel === 'high') {
    advice.push('🔥 Volatility is elevated — reduce your position size to half or less of normal. Use wider stop-losses to avoid being stopped out by noise, but keep the dollar risk the same by trading smaller.');
  } else if (c.volatilityLevel === 'low') {
    advice.push('😴 Very low volatility — breakout pending? When gold gets this quiet, a big move often follows. Consider placing pending orders above recent highs and below recent lows to catch the breakout.');
  }

  // News-based advice
  const hasGeopolitical = news.some((n) =>
    /war|conflict|tension|sanction|crisis|attack|military/i.test(n.title + n.description)
  );
  const hasFed = news.some((n) =>
    /fed|federal reserve|interest rate|rate decision|monetary policy|powell/i.test(n.title + n.description)
  );
  const hasInflation = news.some((n) =>
    /inflation|cpi|consumer price|cost of living/i.test(n.title + n.description)
  );
  const hasDollar = news.some((n) =>
    /dollar|usd|dxy|greenback/i.test(n.title + n.description)
  );

  if (hasGeopolitical) {
    advice.push('🌍 Geopolitical tensions are in the news. Gold is a safe-haven asset — it historically rises during uncertainty and conflict. If tensions escalate, expect continued upward pressure on gold prices. Consider maintaining or increasing your gold exposure.');
  }
  if (hasFed) {
    advice.push('🏦 The Federal Reserve is in focus. Rate decisions directly impact gold — higher rates typically weigh on gold (it doesn\'t pay interest), while dovish signals boost it. Consider reducing exposure before the announcement and re-entering after the market digests the news.');
  }
  if (hasInflation) {
    advice.push('📊 Inflation data is making headlines. Gold is traditionally an inflation hedge — rising prices tend to support gold. If inflation comes in higher than expected, gold could rally. Lower readings might cause a dip.');
  }
  if (hasDollar) {
    advice.push('💵 Dollar movements are driving gold today. Gold and the dollar typically move inversely — a stronger dollar pushes gold down, and vice versa. Watch the DXY (Dollar Index) alongside gold for confirmation.');
  }

  if (advice.length < 3) {
    advice.push(`💡 Current confidence level: ${(ctx.strength * 100).toFixed(0)}%. A reading above 70% suggests higher-probability setups. Below 50%, signals are mixed — consider paper trading until conviction improves.`);
  }

  return advice;
}

// ── Build risk note ──
function buildRiskNote(ctx: MarketContext, c: Condition): string {
  if (c.volatilityLevel === 'high' && c.rsiZone === 'overbought') {
    return '🔴 HIGH RISK — Overbought conditions in a volatile market. This is historically one of the riskiest environments. Experienced traders only, with strict risk management.';
  }
  if (c.volatilityLevel === 'high') {
    return '🟡 ELEVATED RISK — High volatility means larger potential gains but also larger potential losses. Use smaller position sizes and wider stops.';
  }
  if (c.trend === 'sideways' && c.volatilityLevel === 'low') {
    return '🟢 LOW RISK — Calm market conditions. Good for learning and testing strategies without getting whipsawed by wild price swings.';
  }
  return '🟡 MODERATE RISK — Normal market conditions. Follow your trading plan and maintain discipline with your stop-losses and position sizing.';
}
