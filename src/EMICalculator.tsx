import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { cn } from './utils';

export default function EMICalculator() {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(5);

  const r = rate / 12 / 100;
  const n = years * 12;
  const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">EMI Calculator</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Calculate your monthly loan repayments</p>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden">
        <div className="p-8 space-y-6 grid-bg">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Loan Amount (₹)</label>
              <input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Interest Rate (%)</label>
              <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Tenure (Years)</label>
              <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors" />
            </div>
          </div>
          <div className="bg-gumroad-pink border-4 border-black p-6 neo-brutalism-shadow-xs text-center">
            <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Monthly EMI</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-black">₹</span>
              <h3 className="text-4xl font-black font-headline text-black tracking-tighter">{emi ? emi.toFixed(2) : '0.00'}</h3>
            </div>
            <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-4">Total Interest: ₹{emi ? ((emi * n) - principal).toFixed(2) : '0.00'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
