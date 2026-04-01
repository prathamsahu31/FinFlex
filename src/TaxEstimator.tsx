import { useState } from 'react';
import { IndianRupee, Upload, Sparkles, TrendingUp, AlertCircle, FileText, Loader2, Info } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from './utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TaxEstimator() {
  const [income, setIncome] = useState<number>(0);
  const [deductions80c, setDeductions80c] = useState<number>(0);
  const [deductions80d, setDeductions80d] = useState<number>(0);
  const [hra, setHra] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  const calculateTaxes = () => {
    // Standard Deductions
    const stdNew = 75000; // FY 25-26 New Regime updates
    const stdOld = 50000;

    // --- NEW REGIME (FY 2025-26 Budget Slabs) ---
    const netNew = Math.max(0, income - stdNew);
    let newTax = 0;
    if (netNew <= 400000) newTax = 0;
    else if (netNew <= 800000) newTax = (netNew - 400000) * 0.05;
    else if (netNew <= 1200000) newTax = 20000 + (netNew - 800000) * 0.10;
    else if (netNew <= 1500000) newTax = 60000 + (netNew - 1200000) * 0.15;
    else if (netNew <= 2000000) newTax = 105000 + (netNew - 1500000) * 0.20;
    else if (netNew <= 2400000) newTax = 205000 + (netNew - 2000000) * 0.25;
    else newTax = 305000 + (netNew - 2400000) * 0.30;
    
    // Rebate under 87A New Regime
    if (netNew <= 1200000) newTax = 0; 

    // --- OLD REGIME ---
    const totalDeductions = stdOld + deductions80c + deductions80d + hra;
    const netOld = Math.max(0, income - totalDeductions);
    let oldTax = 0;
    if (netOld <= 250000) oldTax = 0;
    else if (netOld <= 500000) oldTax = (netOld - 250000) * 0.05;
    else if (netOld <= 1000000) oldTax = 12500 + (netOld - 500000) * 0.20;
    else oldTax = 112500 + (netOld - 1000000) * 0.30;
    
    // Rebate under 87A Old Regime (Up to 5L)
    if (netOld <= 500000) oldTax = 0;

    // Add 4% Health & Education Cess
    newTax = newTax > 0 ? newTax * 1.04 : 0;
    oldTax = oldTax > 0 ? oldTax * 1.04 : 0;

    return { 
      newRegime: Math.round(newTax), 
      oldRegime: Math.round(oldTax),
      winner: newTax <= oldTax ? 'NEW' : 'OLD',
      savings: Math.abs(oldTax - newTax)
    };
  };

  const results = calculateTaxes();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert("Please upload an image file (JPG, PNG).");
        return;
    }

    setIsScanning(true);
    setAiAdvice(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                `You are an Indian Chartered Accountant AI. Analyze this image of a Form-16, salary slip, or tax document.
                 Extract these exact values as numbers. If not found, use 0.
                 Return ONLY valid JSON format:
                 { "income": number, "deductions80c": number, "deductions80d": number, "hra": number }`,
                {
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data
                    }
                }
            ]
        });

        const rawJson = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
        const data = JSON.parse(rawJson);
        
        if (data.income) setIncome(Number(data.income));
        if (data.deductions80c) setDeductions80c(Math.min(Number(data.deductions80c), 150000));
        if (data.deductions80d) setDeductions80d(Number(data.deductions80d));
        if (data.hra) setHra(Number(data.hra));

        // Generate dynamic AI advice based on parsed data
        let advice = "";
        const cSpace = 150000 - (Number(data.deductions80c) || 0);
        if (cSpace > 0 && Number(data.income) > 700000) {
            advice = `Vibe Check: You have ₹${cSpace.toLocaleString('en-IN')} left in your 80C limit! Invest this in an ELSS Mutual Fund before March 31st to slash your Old Regime tax further. `;
        }
        advice += `Based on your docs, I ran the math. You should definitely file using the ${results.winner} regime to secure the bag and save ₹${results.savings.toLocaleString('en-IN')}.`;
        
        setAiAdvice(advice);

      } catch (err) {
         console.error('OCR Error', err);
         alert("Failed to read document using AI. Please enter values manually.");
      } finally {
         setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight flex items-center gap-3">
          AI Tax Filer <Sparkles size={28} className="text-gumroad-yellow fill-current" />
        </h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">
          Gemini Vision OCR • FY 2025-26 Comparison
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Inputs & Scanner */}
        <div className="space-y-6">
          
          {/* AI Scanner Dropzone */}
          <div className="bg-gumroad-pink border-4 border-black neo-brutalism-shadow p-6 relative overflow-hidden group">
             {isScanning && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm animate-pulse">
                   <Loader2 size={40} className="text-gumroad-pink animate-spin mb-4" />
                   <p className="text-white font-black uppercase tracking-widest text-sm">Gemini reading Form-16...</p>
                </div>
             )}
             
             <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 border-4 border-black bg-white flex justify-center items-center group-hover:-rotate-12 transition-transform">
                   <FileText size={24} className="text-black" />
                </div>
                <span className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-white">Magic Upload</span>
             </div>
             
             <h3 className="font-black font-headline uppercase leading-tight text-xl mb-2">Upload Salary Slip / Form-16</h3>
             <p className="text-xs font-bold font-label tracking-widest uppercase opacity-80 mb-6">Let FinFlex AI auto-extract your income and deductions.</p>
             
             <label className="w-full flex justify-center items-center gap-3 py-4 bg-white border-4 border-black font-black uppercase tracking-widest text-black hover:bg-black hover:text-white transition-colors cursor-pointer neo-brutalism-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                <Upload size={18} strokeWidth={3} />
                Select Image (JPG/PNG)
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
             </label>
          </div>

          {/* Manual Inputs Grid */}
          <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 grid-bg">
             <h3 className="font-black font-headline uppercase text-lg mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
                <IndianRupee size={20} strokeWidth={3} /> Income & Deductions
             </h3>
             
             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2 block">Gross Annual Income</label>
                 <input type="number" value={income || ''} onChange={(e) => setIncome(Number(e.target.value))} className="w-full h-12 bg-white border-4 border-black px-4 font-black focus:bg-gumroad-yellow/20 outline-none transition-colors neo-brutalism-shadow-xs" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2 block">Sec 80C (Max 1.5L)</label>
                   <input type="number" value={deductions80c || ''} onChange={(e) => setDeductions80c(Number(e.target.value))} className="w-full h-12 bg-white border-4 border-black px-4 font-black focus:bg-gumroad-yellow/20 outline-none transition-colors neo-brutalism-shadow-xs" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2 block">HRA Claim</label>
                   <input type="number" value={hra || ''} onChange={(e) => setHra(Number(e.target.value))} className="w-full h-12 bg-white border-4 border-black px-4 font-black focus:bg-gumroad-yellow/20 outline-none transition-colors neo-brutalism-shadow-xs" />
                 </div>
               </div>
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2 block">Sec 80D (Health Ins.)</label>
                 <input type="number" value={deductions80d || ''} onChange={(e) => setDeductions80d(Number(e.target.value))} className="w-full h-12 bg-white border-4 border-black px-4 font-black focus:bg-gumroad-yellow/20 outline-none transition-colors neo-brutalism-shadow-xs" />
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Calculations & AI Suggestion */}
        <div className="space-y-6">
           
           {/* Regime Battle */}
           <div className="bg-black border-4 border-black neo-brutalism-shadow p-6">
              <h3 className="font-black font-headline uppercase text-white mb-6 border-b-2 border-white/20 pb-2 text-center text-xl">The Showdown</h3>
              
              <div className="grid grid-cols-2 gap-4">
                 {/* New Regime Card */}
                 <div className={cn("border-4 bg-white p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all", results.winner === 'NEW' ? "border-gumroad-pink scale-105 neo-brutalism-shadow-sm z-10" : "border-black/50 opacity-80")}>
                    {results.winner === 'NEW' && <div className="absolute top-0 right-0 bg-gumroad-pink text-black font-black text-[8px] uppercase tracking-widest px-2 py-1 rotate-12 -mt-1 -mr-2 border-2 border-black">Winner</div>}
                    <span className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">New Regime</span>
                    <span className="text-2xl font-black font-headline tracking-tighter">₹{results.newRegime.toLocaleString('en-IN')}</span>
                 </div>
                 
                 {/* Old Regime Card */}
                 <div className={cn("border-4 bg-white p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all", results.winner === 'OLD' ? "border-gumroad-pink scale-105 neo-brutalism-shadow-sm z-10" : "border-black/50 opacity-80")}>
                    {results.winner === 'OLD' && <div className="absolute top-0 right-0 bg-gumroad-pink text-black font-black text-[8px] uppercase tracking-widest px-2 py-1 rotate-12 -mt-1 -mr-2 border-2 border-black">Winner</div>}
                    <span className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">Old Regime</span>
                    <span className="text-2xl font-black font-headline tracking-tighter">₹{results.oldRegime.toLocaleString('en-IN')}</span>
                 </div>
              </div>

              {income > 0 && (
                 <div className="mt-6 bg-gumroad-yellow border-4 border-black p-4 text-center neo-brutalism-shadow-xs rotate-1">
                    <p className="text-xs font-black uppercase tracking-widest text-black flex items-center justify-center gap-2">
                       <TrendingUp size={16} strokeWidth={3} /> You Save By Switching
                    </p>
                    <p className="text-4xl font-black font-headline mt-1 tracking-tighter">₹{results.savings.toLocaleString('en-IN')}</p>
                 </div>
              )}
           </div>

           {/* AI Personalized Suggestion */}
           <AnimatePresence>
             {aiAdvice && (
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white border-4 border-black neo-brutalism-shadow p-6 flex gap-4 items-start"
                >
                   <div className="w-10 h-10 shrink-0 bg-gumroad-yellow border-4 border-black rounded-full flex items-center justify-center overflow-hidden">
                      <Sparkles size={20} className="text-black" />
                   </div>
                   <div>
                      <h4 className="font-black font-headline uppercase text-sm mb-1 tracking-widest">FinFlex CA Advice</h4>
                      <p className="text-sm font-bold leading-relaxed">{aiAdvice}</p>
                   </div>
                </motion.div>
             )}
             {!aiAdvice && income > 0 && (
                 <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 flex gap-4 items-center opacity-60">
                    <Info size={24} className="text-black" />
                    <p className="text-xs font-black uppercase tracking-widest text-black/60">Upload a tax document to receive personalized AI investment advice.</p>
                 </div>
             )}
           </AnimatePresence>
           
        </div>
      </div>
    </div>
  );
}
