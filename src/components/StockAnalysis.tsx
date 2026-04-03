import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../utils';

interface StockAnalysisProps {
  stock: {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
  } | null;
}

export default function StockAnalysis({ stock }: StockAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [recommendation, setRecommendation] = useState<'BUY' | 'SELL' | 'HOLD' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stock?.symbol) return;

    const analyzeStock = async () => {
      setIsLoading(true);
      setAnalysis('');
      setRecommendation(null);
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Key");

        const ai = new GoogleGenAI({ apiKey });
        const context = `
Analyze this stock: ${stock.symbol} (${stock.shortName})
Current Price: $${stock.regularMarketPrice}
Change: ${stock.regularMarketChangePercent.toFixed(2)}%

Goal: Give a sarcastic Gen-Z "market vibe check" in under 2 sentences. 
Target personality: Brutally honest, uses slang (diamond hands, paper hands, bagholder, W, L).
End your response with specifically one of these words on a new line: [BUY], [SELL], or [HOLD].
`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: context,
        });

        const text = response.text || "";
        setAnalysis(text.replace(/\[(BUY|SELL|HOLD)\]/g, '').trim());
        
        if (text.includes('[BUY]')) setRecommendation('BUY');
        else if (text.includes('[SELL]')) setRecommendation('SELL');
        else if (text.includes('[HOLD]')) setRecommendation('HOLD');

      } catch (err) {
        console.error("AI Analysis Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(analyzeStock, 800);
    return () => clearTimeout(timer);
  }, [stock?.symbol]);

  if (!stock) return null;

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-4 neo-brutalism-shadow mt-6 flex items-center gap-4 animate-pulse">
        <Sparkles size={24} className="text-black" />
        <p className="text-xs font-black uppercase tracking-widest tracking-tighter">AI is crunching the ticker for ${stock.symbol}...</p>
      </div>
    );
  }

  if (!analysis) return null;

  const getBadgeStyles = () => {
    switch (recommendation) {
      case 'BUY': return 'bg-emerald-400 text-black';
      case 'SELL': return 'bg-rose-400 text-black';
      case 'HOLD': return 'bg-gumroad-yellow text-black';
      default: return 'bg-black text-white';
    }
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-4 border-black p-6 neo-brutalism-shadow mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-black p-1">
            <Sparkles size={16} className="text-white" fill="currentColor" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-black/60">AI MARKET ANALYSIS</p>
        </div>
        {recommendation && (
          <div className={cn("px-3 py-1 border-2 border-black font-black text-xs uppercase tracking-widest", getBadgeStyles())}>
            {recommendation}
          </div>
        )}
      </div>

      <p className="font-black text-lg italic leading-tight">
        "{analysis}"
      </p>

      <div className="mt-4 flex gap-4 pt-4 border-t-2 border-black/10">
        <div className="flex items-center gap-1">
            {stock.regularMarketChangePercent > 0 ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-rose-600" />}
            <span className="text-[10px] font-bold">Trend analyzed</span>
        </div>
        <div className="flex items-center gap-1">
            <Minus size={14} className="rotate-90 text-black/20" />
            <span className="text-[10px] font-bold">Market Sentiment: {recommendation === 'SELL' ? 'Sus' : 'Valid'}</span>
        </div>
      </div>
    </motion.div>
  );
}
