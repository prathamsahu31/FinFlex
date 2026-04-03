import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Sparkles, X, Mic, Paperclip, Loader2, User, MessageSquare, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from './lib/supabase';
import { cn } from './utils';

interface FloatingAIChatProps {
  user: any;
  profile: any;
}

const THINKING_MESSAGES = [
  "Analyzing your vibe...",
  "Consulting the budget gods...",
  "Roasting your latest spending...",
  "Checking if that's giving FIRE energy...",
  "Calculating the cost of being iconic...",
  "No cap, thinking hard rn...",
  "Vibe-checking your transactions...",
  "Deep-diving into your wallet..."
];

export default function FloatingAIChat({ user, profile }: FloatingAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'bot',
      text: "Yo! I'm your FinFlex AI. Need a quick vibe check on your finances? 💸",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingIdx, setThinkingIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  // Cycle thinking messages
  useEffect(() => {
    let interval: any;
    if (isTyping) {
      interval = setInterval(() => {
        setThinkingIdx(prev => (prev + 1) % THINKING_MESSAGES.length);
      }, 2000);
    } else {
      setThinkingIdx(0);
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!supabase || !user) return;
      const { data } = await supabase
        .from('transactions')
        .select('category, amount, vendor, date, type')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50);
      if (data) setTransactions(data);
    };
    if (isOpen) fetchTransactions();
  }, [user, isOpen]);

  const handleSend = async (textOverride?: string, retryCount = 0) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // Only add user message on first attempt (not retries)
    if (retryCount === 0) {
      const newUserMsg = {
        id: Date.now(),
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newUserMsg]);
      setInput('');
      setIsTyping(true);
    }

    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("MISSING_KEY");

      const ai = new GoogleGenAI({ apiKey });
      const context = `
You are FinFlex AI, a global Gen-Z financial advisor. 
Style: Fun, slightly roasting, encouraging, and highly analytical. Use slang like "no cap", "giving millionaire energy", "vibe check".

USER CONTEXT:
${JSON.stringify(profile || {}, null, 2)}

RECENT TRANSACTIONS:
${JSON.stringify(transactions, null, 2)}

The user says: "${textToSend}"
Give a brief, witty, and helpful response. If they upload a document (implied by context if applicable), acknowledge the effort.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            { role: 'user', parts: [{ text: context }] }
        ],
      });

      const newBotMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text || "My brain is lagging, bestie. Try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (err: any) {
      console.error(err);
      
      // Retry once on rate limit
      if ((err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) && retryCount < 1) {
        setTimeout(() => handleSend(textToSend, retryCount + 1), 2000);
        return;
      }
      
      let errorText = "Bruh, the AI is hitting a wall. Check your connection or API key.";
      if (err.message === "MISSING_KEY") {
        errorText = "Missing VITE_GEMINI_API_KEY in .env. Set it up first! 🔑";
      } else if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        errorText = "Rate limited! Wait 30 sec and try again. ⏳";
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

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTyping(true);
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: `📎 Uploaded: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    // OCR logic (simplified for chat context)
    try {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [
                    { 
                        role: 'user', 
                        parts: [
                            { text: "Analyze this document/receipt. What's the main takeaway for my finances?" },
                            { inlineData: { data: base64Data, mimeType: file.type } }
                        ] 
                    }
                ]
            });
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: response.text || "Document scanned, but I've got no words. Looks interesting though!",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
            setIsTyping(false);
        };
        reader.readAsDataURL(file);
    } catch (err) {
        setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[380px] h-[550px] bg-white border-4 border-black neo-brutalism-shadow-lg flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-black p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gumroad-yellow border-2 border-white flex items-center justify-center text-black">
                  <Bot size={20} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-widest text-xs">FinFlex Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-black uppercase">Live & Roasting</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gumroad-pink transition-colors cursor-pointer"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 grid-bg custom-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.sender === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 border-2 border-black neo-brutalism-shadow-xs",
                    msg.sender === 'user' ? "bg-gumroad-pink text-black font-bold" : "bg-white text-black font-medium"
                  )}>
                    <p className="text-sm leading-tight">{msg.text}</p>
                  </div>
                  <span className="text-[8px] font-black uppercase text-black/50 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 bg-gumroad-yellow border-2 border-black flex items-center justify-center shrink-0">
                    <Bot size={14} strokeWidth={3} />
                  </div>
                  <div className="bg-white border-2 border-black px-4 py-2 neo-brutalism-shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">
                      {THINKING_MESSAGES[thinkingIdx]}
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t-4 border-black">
              <div className="flex gap-2 mb-3">
                 <button 
                    onClick={() => setInput("Check my spending vibes")} 
                    className="text-[8px] font-black border-2 border-black px-2 py-1 uppercase hover:bg-gumroad-yellow transition-all"
                 >
                    Vibe Check?
                 </button>
                 <button 
                    onClick={() => setInput("Am I on track for FIRE?")} 
                    className="text-[8px] font-black border-2 border-black px-2 py-1 uppercase hover:bg-gumroad-yellow transition-all"
                 >
                    FIRE Status?
                 </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 border-2 border-black bg-white hover:bg-gumroad-pink transition-all shrink-0 cursor-pointer"
                >
                    <Paperclip size={18} strokeWidth={3} />
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
                </button>
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type or use voice..."
                    className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-bold outline-none focus:bg-gumroad-yellow/10"
                  />
                </div>
                <button 
                    onClick={isListening ? () => {} : startVoice}
                    className={cn(
                        "p-2 border-2 border-black transition-all shrink-0 cursor-pointer",
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-white hover:bg-gumroad-pink"
                    )}
                >
                    <Mic size={18} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="p-2 border-2 border-black bg-black text-white hover:bg-gumroad-pink hover:text-black transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full border-4 border-black flex items-center justify-center text-black neo-brutalism-shadow-lg cursor-pointer transition-all",
          isOpen ? "bg-white" : "bg-gumroad-yellow"
        )}
      >
        {isOpen ? <X size={32} strokeWidth={3} /> : <MessageSquare size={32} strokeWidth={3} fill="currentColor" />}
        {!isOpen && (
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gumroad-pink border-2 border-black flex items-center justify-center"
            >
                <Sparkles size={12} className="text-black" fill="currentColor" />
            </motion.div>
        )}
      </motion.button>
    </div>
  );
}
