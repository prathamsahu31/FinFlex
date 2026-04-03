import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Terminal, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function AIDiagnostics() {
  const [customKey, setCustomKey] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const testKey = async () => {
    setStatus('testing');
    setErrorMsg('');
    setResponse('');
    
    try {
      const apiKey = customKey.trim() || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key is missing. Enter one or update .env");

      const ai = new GoogleGenAI({ apiKey });
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: "Respond with exactly 'FinFlex AI is Online!'.",
      });
      
      const text = result.text || "No response";
      
      setResponse(text);
      setStatus('success');
    } catch (err: any) {
      console.error("Diagnostic Error:", err);
      // Simplify the error message for the user if it's the known 400 expired key
      let msg = err.message || "Unknown Error";
      if (msg.includes('400') || msg.includes('expired') || msg.includes('INVALID_ARGUMENT')) {
        msg = "❌ API Key Expired or Invalid. Gemini says: 'API key expired. Please renew the API key.'";
      }
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  return (
    <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow mb-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Terminal size={24} className="text-black" strokeWidth={3} />
        <h2 className="text-xl font-black uppercase tracking-tighter">Gemini System Diagnostics</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-black/5 p-4 border-4 border-black space-y-4">
          <div className="flex flex-col gap-2">
            <label className="font-black text-xs uppercase text-black/60">Override API Key (Optional)</label>
            <input 
              type="password"
              placeholder="PASTE NEW GEMINI KEY HERE..."
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              className="w-full bg-white border-2 border-black p-2 font-black text-xs uppercase tracking-widest focus:outline-none focus:bg-gumroad-yellow/10"
            />
            <p className="text-[9px] font-black uppercase text-black/40 italic">
              Paste a new key here to test it without editing your .env file.
            </p>
          </div>

          <div className="flex justify-between items-center bg-white border-2 border-black border-dashed p-4">
            <div>
              <p className="font-black text-xs uppercase opacity-50">Current .Env Status</p>
              <p className="font-black text-xs">{import.meta.env.VITE_GEMINI_API_KEY ? '✅ Key Found' : '❌ Key Missing'}</p>
            </div>
            <button 
              onClick={testKey}
              disabled={status === 'testing'}
              className="bg-gumroad-pink border-4 border-black px-6 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
            >
              {status === 'testing' ? <Loader2 className="animate-spin" /> : 'Run Test'}
            </button>
          </div>
        </div>

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-400 border-4 border-black flex items-start gap-3"
          >
            <CheckCircle className="shrink-0 mt-1" size={20} strokeWidth={3} />
            <div>
              <p className="font-black uppercase text-sm">Gemini Connection Successful!</p>
              <p className="font-bold text-xs mt-1 italic text-emerald-900">"{response}"</p>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-rose-400 border-4 border-black flex items-start gap-3"
          >
            <AlertCircle className="shrink-0 mt-1" size={20} strokeWidth={3} />
            <div>
              <p className="font-black uppercase text-sm">Diagnostic Failed</p>
              <p className="font-bold text-xs mt-1 text-rose-900 border-t border-rose-900/20 pt-1">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-black/40">
        Engine: Gemini 2.0 Flash • Protocol: Client-Side SDK
      </div>
    </div>
  );
}
