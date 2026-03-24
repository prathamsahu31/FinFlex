import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, Sparkles, Trash2, Maximize2, Minimize2, TrendingUp, CreditCard, Target, PieChart, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: 'bot',
    text: "Yo! I'm your FinFlex AI. Ready to secure the bag? ð°",
    timestamp: '10:00 AM'
  },
  {
    id: 2,
    sender: 'bot',
    text: "Vibe check: you spent $15 on coffee today. Swept $1.50 into your Flex-Save. That's giving future millionaire energy. â¨",
    timestamp: '10:01 AM'
  }
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

export default function AIAgent({ setActiveTab }: TabComponentProps) {
  const [messages, setMessages] = useState<any[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('transactions').select('category, amount, vendor, date, type').eq('user_id', user.id).order('date', { ascending: false });
      if (data) setTransactions(data);
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

    const callAI = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key in .env");

        const ai = new GoogleGenAI({ apiKey });
        const context = `
You are FinFlex AI, helping users Flex Financial Discipline. You are a Gen-Z financial advisor. You use slang like 'no cap', 'sus', 'W', and 'vibe check'. Tone: fun, encouraging, slightly roasting if they spend too much on dumb things but always helpful. Keep it concise, short paragraphs.
The user has the following recent transaction history in JSON format:
${JSON.stringify(transactions.slice(0, 50))}

The user asks: "${input}"
Provide a brief, helpful, and stylized response answering their question based on the data.
`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: context,
        });

        const newBotMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: response.text || "My brain is lagging rn, try again later.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newBotMsg]);
      } catch (err: any) {
        console.error("AI Error:", err);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: err.message.includes("Missing API Key") ? "Bruh, missing VITE_GEMINI_API_KEY in .env. Can't help without it." : "Bruh, the AI is down rn. Too much load.",
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
            {["Am I on track for FIRE?", "Analyze my food spending", "How much did I save this week?"].map((suggestion) => (
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
