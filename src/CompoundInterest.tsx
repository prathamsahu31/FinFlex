import React, { useState } from 'react';
import { motion } from 'motion/react';
import { IndianRupee, TrendingUp, Calendar, Hash } from 'lucide-react';
import { cn } from './utils';

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState<number>(10000);
  const [annualRate, setAnnualRate] = useState<number>(12);
  const [years, setYears] = useState<number>(10);
  const [frequency, setFrequency] = useState<number>(1); // 1 = Annually, 12 = Monthly

  // A = P(1 + r/n)^(nt)
  const calculateCompoundInterest = () => {
    const P = principal;
    const r = annualRate / 100;
    const n = frequency;
    const t = years;

    const A = P * Math.pow(1 + r / n, n * t);
    const totalInterest = A - P;

    return { totalValue: A, totalInterest, principal: P };
  };

  const results = calculateCompoundInterest();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b-4 border-black pb-4">
        <div className="w-12 h-12 bg-gumroad-yellow border-4 border-black flex items-center justify-center neo-brutalism-shadow-sm">
          <TrendingUp size={24} strokeWidth={3} className="text-black" />
        </div>
        <div>
          <h2 className="text-3xl font-black font-headline uppercase tracking-tight text-black flex items-center gap-2">
            Compound Interest
          </h2>
          <p className="font-bold font-label uppercase text-black/60 text-xs tracking-widest mt-1">Watch Your Wealth Multiply</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 flex flex-col gap-6">
          <div className="space-y-4">
            <h3 className="font-black font-headline uppercase text-xl text-black border-l-4 border-black pl-3 py-1 bg-gumroad-pink w-fit pr-4">Parameters</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <IndianRupee size={14} strokeWidth={3} /> Initial Principal
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-white border-4 border-black p-3 font-bold font-mono focus:outline-none focus:bg-gumroad-yellow/10 transition-colors neo-brutalism-shadow-xs"
                />
              </div>
              <input
                type="range"
                min="1000"
                max="10000000"
                step="1000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full accent-gumroad-pink mt-2 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} strokeWidth={3} /> Annual Interest Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Number(e.target.value))}
                  className="w-full bg-white border-4 border-black p-3 font-bold font-mono focus:outline-none focus:bg-gumroad-yellow/10 transition-colors neo-brutalism-shadow-xs"
                />
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="0.5"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-gumroad-yellow mt-2 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} strokeWidth={3} /> Time Period (Years)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="w-full bg-white border-4 border-black p-3 font-bold font-mono focus:outline-none focus:bg-gumroad-yellow/10 transition-colors neo-brutalism-shadow-xs"
                />
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-black mt-2 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Hash size={14} strokeWidth={3} /> Compounding Frequency
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFrequency(1)}
                  className={cn(
                    "p-3 border-4 font-black uppercase text-xs transition-colors",
                    frequency === 1 ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-black/5"
                  )}
                >
                  Annually
                </button>
                <button
                  onClick={() => setFrequency(12)}
                  className={cn(
                    "p-3 border-4 font-black uppercase text-xs transition-colors",
                    frequency === 12 ? "bg-black text-white border-black" : "bg-white text-black border-black hover:bg-black/5"
                  )}
                >
                  Monthly
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-gumroad-pink border-4 border-black neo-brutalism-shadow p-8 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-black/5 grid-bg" />
            
            <div className="relative z-10 w-full space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-1">Total Future Value</p>
                <p className="text-4xl sm:text-5xl font-black font-headline tracking-tighter text-black break-words group-hover:scale-105 transition-transform drop-shadow-[2px_2px_0px_#fff]">
                  ₹{results.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8 bg-white border-4 border-black p-4 text-left">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/50">Total Investment</p>
                  <p className="text-xl font-black font-mono">₹{results.principal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="border-l-4 border-black/10 pl-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/50">Wealth Gained</p>
                  <p className="text-xl font-black font-mono text-green-600">₹{results.totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 flex-1">
            <h3 className="font-black font-headline uppercase text-lg text-black mb-4">The Magic Factor</h3>
            <p className="font-bold text-sm leading-relaxed border-l-4 border-gumroad-yellow pl-4">
              Your wealth grew by <span className="text-gumroad-pink text-lg bg-black px-1">{(results.totalInterest / results.principal * 100).toFixed(0)}%</span> just by letting it sit. Time is your greatest asset in finance. Start early!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
