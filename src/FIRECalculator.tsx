import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { cn } from './utils';

export default function FIRECalculator() {
  const [currentAge, setCurrentAge] = useState(28);
  const [retirementAge, setRetirementAge] = useState(45);
  const [monthlySavings, setMonthlySavings] = useState(25000);
  const [currentSavings, setCurrentSavings] = useState(500000);
  const [fireNumber, setFireNumber] = useState(20000000);

  const annualReturn = 12; // Adjusted for Indian markets (Mutual Funds)
  const yearsToRetire = retirementAge - currentAge;
  const monthlyRate = annualReturn / 100 / 12;
  const months = yearsToRetire * 12;
  
  const projectedSavings = 
    currentSavings * Math.pow(1 + monthlyRate, months) + 
    monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  const isFireOnTrack = projectedSavings >= fireNumber;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">FIRE Calculator</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Plan your Early Retirement (Financial Independence Retire Early)</p>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden">
        <div className="p-8 space-y-6 grid-bg">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Current Age</label>
              <input type="number" value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Retire Age</label>
              <input type="number" value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Monthly Save (₹)</label>
              <input type="number" value={monthlySavings} onChange={e => setMonthlySavings(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">FIRE Target (₹)</label>
              <input type="number" value={fireNumber} onChange={e => setFireNumber(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
            </div>
          </div>
          <div className="bg-gumroad-yellow border-4 border-black p-6 neo-brutalism-shadow-xs text-center">
            <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Projected Savings at {retirementAge}</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-black">₹</span>
              <h3 className="text-4xl font-black font-headline text-black tracking-tighter">{projectedSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            </div>
            <p className={cn("text-[10px] font-black uppercase tracking-widest mt-4 p-2 border-2 border-black inline-block", isFireOnTrack ? "bg-emerald-400" : "bg-rose-400")}>
              {isFireOnTrack ? "✨ W. YOU ARE ON TRACK!" : `L. FALLING SHORT BY ₹${(fireNumber - projectedSavings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
