import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, Sparkles, Trash2, Maximize2, Minimize2, TrendingUp, CreditCard, Target, PieChart, User } from 'lucide-react';
import { getGeminiClient } from './lib/gemini';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './types';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: "Yo! I'm your FinFlex AI. Ready to secure the bag? ð°",
    timestamp: '10:00 AM'
  },
  {
    id: 2,
    text: "Vibe check: you spent ₹1,200 on items today. Swept ₹120 into your Flex-Save. That's giving future crorepati energy. ✨",
    sender: 'ai',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const BOT_RESPONSES = [
  "No cap, that's a solid financial move.",
  "Bruh, your spending on takeout is kinda sus. Maybe cook at home tonight?",
  "W. Your portfolio is up 5% today. We love to see it.",
  "Bet. I'll remind you to pay that credit card bill on Friday.",
  "That purchase is definitely not giving FIRE vibes. Rethink?",
  "Big yikes on that Uber surge pricing. Next time take the train?",
  "Main character energy: maxing out your Roth IRA this year. Let's go!"
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function AIAgent({ setActiveTab, user, profile }: TabComponentProps & { user: any, profile: any }) {
  const [messages, setMessages] = useState<any[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [gamification, setGamification] = useState({ xp: 0, coins: 0, level: 1 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!supabase || !user) return;

      const { data: txData } = await supabase.from('transactions').select('category, amount, vendor, date, type').eq('user_id', user.id).order('date', { ascending: false }).limit(20);
      if (txData) setTransactions(txData);

      const { data: hData } = await supabase.from('stock_holdings').select('*').eq('user_id', user.id).gt('total_quantity', 0);
      if (hData) setHoldings(hData);

      const { data: gamifData } = await supabase.from('user_gamification').select('*').eq('id', user.id).single();
      if (gamifData) setGamification(gamifData);
    };
    fetchUserData();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);

    // Fallback for Demo Mode / Broken Supabase
    const txToAnalyze = transactions.length > 0 ? transactions : [
      { category: 'Dining', amount: 450, vendor: 'Starbucks', date: new Date().toISOString() },
      { category: 'Shopping', amount: 12000, vendor: 'Apple Store', date: new Date().toISOString() },
    ];
    const holdingsToAnalyze = holdings.length > 0 ? holdings : [
      { symbol: 'AAPL', average_price: 150, total_quantity: 10 },
      { symbol: 'BTC-USD', average_price: 45000, total_quantity: 0.1 },
    ];

    // Build conversation history string
    const historyContext = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

    const context = `
You are FinFlex AI, a highly aggressive, Gen-Z financial analyst and trading bot. 
Tone: brutally honest, hilarious, sarcastic, but technically sound in trading advice.
Use slang: 'no cap', 'sus', 'W', 'L', 'vibe check', 'diamond hands', 'paper hands', 'bagholder'.

USER PROFILE: ${JSON.stringify(profile || { name: 'Demo Trader' })}
GAMIFICATION STATS: Trader Level ${gamification.level}, ${gamification.xp} XP
ASSET HOLDINGS (Stock Portfolio): ${JSON.stringify(holdingsToAnalyze)}
RECENT TRANSACTIONS: ${JSON.stringify(txToAnalyze)}

CONVERSATION HISTORY:
${historyContext}

GOAL: Answer the user's latest message by analyzing their data. 
- If they ask for stock recs or portfolio insights, analyze ASSET HOLDINGS (call them a bagholder if they own bad stocks, praise W picks). Suggest diversification if needed. 
- If they ask about expenses, roast their RECENT TRANSACTIONS.
- Keep responses under 4 sentences. Be punchy, deeply personalized, and use emojis!

The user's latest message is: "${input}"
`;

    const callAI = async (modelName: 'gemini-2.0-flash' | 'gemini-1.5-flash' = 'gemini-2.0-flash', retryCount = 0) => {
      try {
        const ai = getGeminiClient();
        
        // Use the pattern compatible with @google/genai with internal fallback
        const internalFetch = async (currentModel: 'gemini-2.0-flash' | 'gemini-1.5-flash') => {
          try {
            return await ai.models.generateContent({
              model: currentModel,
              contents: context,
            });
          } catch (err: any) {
            // Fallback from 2.0 to 1.5 if 429 or quota zero
            if (currentModel === 'gemini-2.0-flash' && (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED'))) {
               console.warn("Gemini 2.0 Quota Exhausted, falling back to 1.5-flash...");
               return await ai.models.generateContent({
                 model: 'gemini-1.5-flash',
                 contents: context,
               });
            }
            throw err;
          }
        };

        const response = await internalFetch(modelName);

        const newBotMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: response.text || "My brain is lagging rn, try again later.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newBotMsg]);
      } catch (err: any) {
        console.error("AI Error:", err);
        
        // Retry once on rate limit (429) - if even 1.5 fails
        if ((err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) && retryCount < 1) {
          setTimeout(() => callAI('gemini-1.5-flash', retryCount + 1), 2000); 
          return;
        }

        // Handle Expired Key (400)
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('400') || err.message?.includes('expired')) {
          const errorMsg = {
            id: Date.now() + 1,
            sender: 'bot',
            text: "🚨 Your Gemini API Key has expired or is invalid. Please go to AI Studio and get a new one! (Check the Diagnostics tool in the Dashboard for more info).",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, errorMsg]);
          setIsTyping(false);
          return;
        }

        // Handle Quota Exceeded (429)
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          const waitStr = err.message.match(/retry in ([\d.]+s)/)?.[1] || "30 seconds";
          const errorMsg = {
             id: Date.now() + 1,
             sender: 'bot',
             text: `⏳ Quota exceeded for both Gemini 2.0 and 1.5. Wait for ${waitStr} or check your AI Studio plan. No cap, the free tier is sweating rn.`,
             timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, errorMsg]);
          setIsTyping(false);
          return;
        }

        let errorText = "Bruh, the AI is down rn. Too much load.";
        if (err.message === "MISSING_KEY") {
          errorText = "Missing VITE_GEMINI_API_KEY in .env file. Can't help without it. 🔑";
        } else if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          errorText = "Hit the AI rate limit, bestie. Wait 30 sec and try again. ⏳";
        } else if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('403')) {
          errorText = "Your Gemini API key seems invalid or expired. Get a new one at aistudio.google.com 🔑";
        }
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: errorText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } finally {
        setIsTyping(false);
      }
    };
    callAI();
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-8 shrink-0 flex items-center gap-6">
        <div className="w-16 h-16 border-4 border-black bg-gumroad-yellow flex items-center justify-center text-black neo-brutalism-shadow">
          <Bot size={32} strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight flex items-center gap-3">
            FinFlex AI <Sparkles size={24} className="text-gumroad-pink" fill="currentColor" />
          </h1>
          <p className="text-black font-bold text-sm border-l-4 border-black pl-3 uppercase tracking-tighter">Your Gen-Z financial advisor</p>
        </div>
      </div>

      <div className="flex-1 bg-white border-4 border-black neo-brutalism-shadow overflow-hidden flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 grid-bg">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                variants={itemVariants}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 border-4 border-black flex items-center justify-center shrink-0 mt-1 neo-brutalism-shadow-sm",
                  msg.sender === 'user' ? "bg-white text-black" : "bg-gumroad-pink text-black"
                )}>
                  {msg.sender === 'user' ? <User size={20} strokeWidth={3} /> : <Bot size={20} strokeWidth={3} />}
                </div>
                
                <div className={cn(
                  "flex flex-col",
                  msg.sender === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-5 py-4 border-4 border-black neo-brutalism-shadow-sm",
                    msg.sender === 'user' 
                      ? "bg-gumroad-yellow text-black font-bold" 
                      : "bg-white text-black font-medium"
                  )}>
                    <p className="text-[16px] leading-tight">{msg.text}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-black mt-2 px-1">{msg.timestamp}</span>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div 
                variants={itemVariants}
                className="flex gap-4 max-w-[80%]"
              >
                <div className="w-10 h-10 border-4 border-black bg-gumroad-pink flex items-center justify-center shrink-0 mt-1 neo-brutalism-shadow-sm">
                  <Bot size={20} strokeWidth={3} />
                </div>
                <div className="bg-white border-4 border-black px-5 py-5 neo-brutalism-shadow-sm flex gap-2 items-center">
                  <motion.div className="w-3 h-3 bg-black" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.div className="w-3 h-3 bg-black" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="w-3 h-3 bg-black" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </motion.div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t-4 border-black">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your spending vibes..." 
              className="w-full bg-white border-4 border-black focus:bg-gumroad-yellow/10 outline-none pl-4 pr-16 py-5 text-[16px] font-bold placeholder:text-black/40 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-3 w-12 h-12 bg-gumroad-pink hover:bg-white text-black border-4 border-black flex items-center justify-center transition-all neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:bg-black/10 disabled:cursor-not-allowed"
            >
              <Send size={24} strokeWidth={3} className="ml-1" />
            </button>
          </form>
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 hide-scrollbar">
            {["Roast my spending habits", "Am I broke?", "Vibe check my last 5 purchases"].map((suggestion) => (
              <button 
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="shrink-0 text-xs font-black uppercase tracking-widest text-black bg-white border-2 border-black hover:bg-gumroad-yellow px-4 py-2 transition-all hover:translate-y-[-2px] cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
