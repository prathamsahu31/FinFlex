import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Bot, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../utils';

interface AIInsightsProps {
  transactions: any[];
}

export default function AIInsights({ transactions }: AIInsightsProps) {
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (transactions.length === 0 || insight) return;

    const generateInsight = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Key");

        const ai = new GoogleGenAI(apiKey);
        
        // Fallback for Demo Mode / Broken Supabase
        const dataToAnalyze = transactions.length > 0 ? transactions : [
          { category: 'Dining', amount: 450, vendor: 'Starbucks', date: new Date().toISOString() },
          { category: 'Shopping', amount: 12000, vendor: 'Apple Store', date: new Date().toISOString() },
          { category: 'Entertainment', amount: 800, vendor: 'Netflix', date: new Date().toISOString() },
        ];

        const context = `
Analyze these transactions and give a sarcastic, Gen-Z "financial vibe check" in under 2 sentences. 
Target personality: Brutally honest, uses slang (no cap, W, L, sus), obsessed with productivity.
Transactions: ${JSON.stringify(dataToAnalyze.slice(0, 10))}
`;
        
        const callAI = async (modelName: 'gemini-2.0-flash' | 'gemini-1.5-flash' = 'gemini-2.0-flash') => {
          try {
            return await ai.models.generateContent({
              model: modelName,
              contents: context,
            });
          } catch (err: any) {
            // If primary model 2.0 fails with quota/not found, fallback to 1.5
            if (modelName === 'gemini-2.0-flash') {
              console.warn("Gemini 2.0-Flash Quota Exceeded or Not Found, falling back to 1.5-Flash...");
              return await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: context,
              });
            }
            throw err;
          }
        };

        const response = await callAI();

        setInsight(response.text || "Brain empty, keep spending ig.");
      } catch (err) {
        console.error("AI Insight Error:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(generateInsight, 1000); // Small delay for effect
    return () => clearTimeout(timer);
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-4 neo-brutalism-shadow mb-8 flex items-center gap-4 animate-pulse">
        <Bot size={24} className="text-black" />
        <p className="text-xs font-black uppercase tracking-widest">Gemini is vibe-checking your wallet...</p>
      </div>
    );
  }

  if (error || !insight) return null;

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-gumroad-yellow border-4 border-black p-4 neo-brutalism-shadow mb-8 flex items-start gap-4"
    >
      <div className="bg-black p-2 border-2 border-black shrink-0">
        <Sparkles size={20} className="text-white" fill="currentColor" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-1">AI FINANCIAL ROAST</p>
        <p className="text-sm font-black text-black italic">"{insight}"</p>
      </div>
    </motion.div>
  );
}
