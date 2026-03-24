import React, { useState, useEffect, useMemo } from 'react';
import { Newspaper, AlertTriangle, Calendar, Clock, Globe, RefreshCcw, ChevronRight, Info, Sparkles, TrendingUp, TrendingDown, Activity, Zap, BarChart3, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

interface NewsItem {
  title: string;
  country: string;
  date: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast: string;
  previous: string;
}

interface Headline {
  id: number;
  title: string;
  source: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface FearGreed {
  value: number;
  sentiment: string;
  lastUpdated: string;
}

interface SeasonalityData {
  asset: string;
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  description: string;
  strength: number; // 1-100
}

export const NewsTab: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAiFallback, setIsAiFallback] = useState(false);

  const seasonality: SeasonalityData[] = [
    { asset: 'USD', trend: 'Bullish', strength: 75, description: 'March historically shows USD strength as capital flows into US markets for end-of-quarter adjustments.' },
    { asset: 'ES / MES', trend: 'Bullish', strength: 65, description: 'Indices often see a "Pre-Easter" rally or end-of-quarter window dressing by institutional funds.' },
    { asset: 'NQ / MNQ', trend: 'Bullish', strength: 60, description: 'Tech seasonality remains positive in late Q1, though sensitive to yield fluctuations.' },
    { asset: 'GC (Gold)', trend: 'Bearish', strength: 45, description: 'Gold often faces headwinds in late March if the USD remains strong, though geopolitical risk is a wildcard.' },
  ];

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [newsRes, headlinesRes, fgRes] = await Promise.all([
        fetch('/api/news'),
        fetch('/api/headlines'),
        fetch('/api/fear-greed')
      ]);

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData);
      } else {
        await fetchNewsWithAI();
      }

      if (headlinesRes.ok) {
        const headlinesData = await headlinesRes.json();
        setHeadlines(headlinesData);
      }

      if (fgRes.ok) {
        const fgData = await fgRes.json();
        setFearGreed(fgData);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch all data:", err);
      await fetchNewsWithAI();
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsWithAI = async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key not found");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "List the high and medium impact US economic news for this week (March 23-29, 2026). Return as a JSON array of objects with fields: title, country (USD), date, time (ET), impact (High/Medium), forecast, previous.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                country: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ["High", "Medium"] },
                forecast: { type: Type.STRING },
                previous: { type: Type.STRING },
              },
              required: ["title", "country", "date", "time", "impact"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || "[]");
      if (data && data.length > 0) {
        setNews(data);
        setIsAiFallback(true);
      } else {
        throw new Error("AI returned empty results");
      }
    } catch (err) {
      console.error("AI Fallback failed:", err);
      const mockNews: NewsItem[] = [
        { title: "FOMC Member Speaks", country: "USD", date: "03-23-2026", time: "10:00am", impact: "Medium", forecast: "", previous: "" },
        { title: "Core Durable Goods Orders m/m", country: "USD", date: "03-24-2026", time: "8:30am", impact: "High", forecast: "0.2%", previous: "0.1%" },
        { title: "CB Consumer Confidence", country: "USD", date: "03-24-2026", time: "10:00am", impact: "High", forecast: "106.5", previous: "104.8" },
        { title: "Unemployment Claims", country: "USD", date: "03-26-2026", time: "8:30am", impact: "High", forecast: "215K", previous: "212K" },
        { title: "Final GDP q/q", country: "USD", date: "03-26-2026", time: "8:30am", impact: "High", forecast: "3.2%", previous: "3.2%" },
        { title: "Core PCE Price Index m/m", country: "USD", date: "03-27-2026", time: "8:30am", impact: "High", forecast: "0.3%", previous: "0.4%" }
      ];
      setNews(mockNews);
      setIsAiFallback(true);
      setError('Using estimated calendar data due to service interruption.');
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 15 * 60 * 1000); // 15 min refresh
    return () => clearInterval(interval);
  }, []);

  const groupedNews = useMemo(() => {
    const groups: { [key: string]: NewsItem[] } = {};
    news.forEach(item => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return groups;
  }, [news]);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Newspaper className="text-red-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Market Intelligence</h1>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Real-time Analysis & Economic Data</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAiFallback && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
              <Sparkles size={10} />
              AI Enhanced
            </div>
          )}
          <button 
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
          >
            <RefreshCcw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Headlines & Fear/Greed (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Fear & Greed Barometer */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-blue-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Fear & Greed Index</h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Live Barometer</span>
            </div>

            <div className="relative flex flex-col items-center">
              {/* Barometer Arc */}
              <div className="w-full h-24 relative flex items-end justify-center overflow-hidden">
                <div className="absolute inset-0 border-[12px] border-zinc-800 rounded-t-full" />
                
                {/* Gradient Arc Overlay */}
                <div className="absolute inset-0 border-[12px] rounded-t-full border-transparent" 
                     style={{ 
                       background: 'conic-gradient(from 180deg at 50% 100%, #ef4444 0deg, #f97316 45deg, #eab308 90deg, #22c55e 135deg, #10b981 180deg)',
                       maskImage: 'radial-gradient(circle at 50% 100%, transparent 58%, black 60%)',
                       WebkitMaskImage: 'radial-gradient(circle at 50% 100%, transparent 58%, black 60%)'
                     }} 
                />

                {/* Needle */}
                <motion.div 
                  initial={{ rotate: -90 }}
                  animate={{ rotate: ((fearGreed?.value || 50) * 1.8) - 90 }}
                  transition={{ type: "spring", stiffness: 50 }}
                  className="absolute bottom-0 left-1/2 w-1 h-20 bg-white origin-bottom -translate-x-1/2 z-10 rounded-full"
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-xl" />
                </motion.div>
                
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-zinc-900 border-4 border-zinc-800 rounded-full z-20" />
              </div>

              <div className="mt-4 text-center">
                <div className="text-4xl font-black text-white tracking-tighter">{fearGreed?.value || '--'}</div>
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${
                  (fearGreed?.value || 50) > 75 ? 'text-emerald-400' : 
                  (fearGreed?.value || 50) > 55 ? 'text-green-400' : 
                  (fearGreed?.value || 50) > 45 ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {fearGreed?.sentiment || 'Neutral'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 mt-8">
              {['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`h-1 w-full rounded-full ${
                    i === 0 ? 'bg-red-600' : i === 1 ? 'bg-orange-500' : i === 2 ? 'bg-yellow-500' : i === 3 ? 'bg-green-500' : 'bg-emerald-600'
                  } opacity-30`} />
                  <span className="text-[6px] font-black uppercase tracking-tighter text-zinc-600 text-center leading-none">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Headlines */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Live Headlines</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Feed</span>
              </div>
            </div>

            <div className="space-y-4">
              {headlines.map((headline) => (
                <div key={headline.id} className="group cursor-pointer p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl hover:border-zinc-700 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{headline.source}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{headline.time}</span>
                  </div>
                  <h3 className="text-[11px] font-bold text-zinc-200 leading-relaxed group-hover:text-white transition-colors">
                    {headline.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Economic Calendar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 space-y-8 min-h-[600px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-red-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Economic Calendar</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Med</span>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {Object.entries(groupedNews).map(([date, items]) => (
                <div key={date} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-zinc-800/50" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-zinc-800/50" />
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="group flex items-center gap-4 p-4 bg-zinc-950/30 border border-zinc-800/30 rounded-2xl hover:bg-zinc-950/50 hover:border-zinc-700 transition-all">
                        <div className="flex flex-col items-center justify-center min-w-[60px] py-1 border-r border-zinc-800/50">
                          <Clock size={12} className="text-zinc-600 mb-1" />
                          <span className="text-[10px] font-mono text-zinc-400">{item.time}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              item.impact === 'High' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{item.impact} Impact</span>
                          </div>
                          <h3 className="text-[11px] font-bold text-zinc-200 group-hover:text-white transition-colors">{item.title}</h3>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div className="space-y-0.5">
                            <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Forecast</p>
                            <p className="text-[10px] font-mono text-zinc-400">{item.forecast || '--'}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Prev</p>
                            <p className="text-[10px] font-mono text-zinc-400">{item.previous || '--'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Seasonality (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-300">Asset Seasonality</h2>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">March 2026</span>
            </div>

            <div className="space-y-4">
              {seasonality.map((item) => (
                <div key={item.asset} className="p-5 bg-zinc-950/50 border border-zinc-800/50 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-white">{item.asset}</span>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      item.trend === 'Bullish' ? 'text-emerald-400 bg-emerald-500/10' : 
                      item.trend === 'Bearish' ? 'text-red-400 bg-red-500/10' : 
                      'text-zinc-400 bg-zinc-500/10'
                    }`}>
                      {item.trend === 'Bullish' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {item.trend}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                    "{item.description}"
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
                      <span>Historical Strength</span>
                      <span>{item.strength}%</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.strength}%` }}
                        className={`h-full rounded-full ${
                          item.trend === 'Bullish' ? 'bg-emerald-500' : 'bg-red-500'
                        }`} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Info size={12} className="text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Trading Tip</span>
              </div>
              <p className="text-[9px] text-zinc-500 leading-relaxed">
                Seasonality is a roadmap, not a rule. Always align seasonal trends with current price action and liquidity windows.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
