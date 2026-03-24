import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from './lib/supabase';
import { cn } from './utils';

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

export default function AIAgent() {
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
      <div className="mb-6 shrink-0 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            FinFlex AI <Sparkles size={18} className="text-amber-500" />
          </h1>
          <p className="text-slate-500 text-sm">Your Gen-Z financial advisor</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[80%]",
                msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                msg.sender === 'user' ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"
              )}>
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={cn(
                "flex flex-col",
                msg.sender === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl",
                  msg.sender === 'user' 
                    ? "bg-slate-900 text-white rounded-tr-sm" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                )}>
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-xs text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[80%]"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-2 h-2 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your spending vibes..." 
              className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-2xl pl-4 pr-12 py-4 text-[15px] transition-all outline-none"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
            {["Am I on track for FIRE?", "Analyze my food spending", "How much did I save this week?"].map((suggestion) => (
              <button 
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="shrink-0 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
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
