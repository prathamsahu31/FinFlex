import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Target, IndianRupee, TrendingUp, TrendingDown, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';
import { io } from 'socket.io-client';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ec4899', '#8b5cf6', '#d946ef', '#f43f5e'];

export default function Portfolio({ setActiveTab, user, profile }: TabComponentProps & { user: any, profile: any }) {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(!user);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  // FIRE Calculator State
  const [currentAge, setCurrentAge] = useState(28);
  const [retirementAge, setRetirementAge] = useState(45);
  const [monthlySavings, setMonthlySavings] = useState(1500);
  const [fireNumber, setFireNumber] = useState(1500000);

  useEffect(() => {
    let isMounted = true;
    const socket = io(backendUrl);

    const initData = async () => {
      if (!supabase || !user) {
        setIsLoading(!user);
        return;
      }

      // Fetch Real Holdings from FinFlex Simulator
      const { data: assetData } = await supabase.from('stock_holdings').select('*').eq('user_id', user.id);
      if (assetData) {
        const hData = assetData.filter(a => a.total_quantity > 0);
        setHoldings(hData);
        
        // Subscribe to live prices for all held symbols
        socket.on('connect', () => {
           hData.forEach(h => {
             socket.emit('subscribe', h.symbol);
           });
        });
      }
      setIsLoading(false);

      if (profile) {
        if (profile.fire_target) setFireNumber(Number(profile.fire_target));
        if (profile.age) setCurrentAge(Number(profile.age));
        if (profile.monthly_income && profile.monthly_expenses) {
          const savings = Number(profile.monthly_income) - Number(profile.monthly_expenses);
          if (savings >= 0) setMonthlySavings(savings);
        }
      }
    };
    initData();

    socket.on('marketUpdate', (data: any[]) => {
       if (!isMounted) return;
       const nextPrices = { ...livePrices };
       data.forEach(q => {
         nextPrices[q.symbol] = q.price;
       });
       setLivePrices(nextPrices);
    });

    return () => { 
        isMounted = false;
        socket.disconnect();
    };
  }, [user, profile, backendUrl]);

  const assets = useMemo(() => {
    return holdings.map((h, i) => {
        const currentPrice = livePrices[h.symbol] || h.avg_buy_price; 
        const currentValue = h.total_quantity * currentPrice;
        const investedValue = h.total_quantity * h.avg_buy_price;
        const plPercent = ((currentValue - investedValue) / investedValue) * 100;

        return {
            symbol: h.symbol,
            shares: h.total_quantity,
            value: currentValue,
            invested: investedValue,
            plPercent: plPercent || 0,
            color: COLORS[i % COLORS.length]
        };
    }).sort((a,b) => b.value - a.value);
  }, [holdings, livePrices]);

  const totalCurrentValue = useMemo(() => assets.reduce((sum, a) => sum + a.value, 0), [assets]);
  const totalInvestedValue = useMemo(() => assets.reduce((sum, a) => sum + a.invested, 0), [assets]);
  const portfolioPlPercent = totalInvestedValue > 0 ? ((totalCurrentValue - totalInvestedValue) / totalInvestedValue) * 100 : 0;
  
  const currentSavings = totalCurrentValue;

  const updateFireTarget = async (newVal: number) => {
    setFireNumber(newVal);
    if (!supabase || !user) return;
    await supabase.from('profiles').update({ fire_target: newVal }).eq('id', user.id);
  };

  const yearsToRetire = retirementAge - currentAge;
  const annualReturn = 7; 
  const monthlyRate = annualReturn / 100 / 12;
  const months = yearsToRetire * 12;

  const projectedSavings =
    currentSavings * Math.pow(1 + monthlyRate, months) +
    monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  const isFireOnTrack = projectedSavings >= fireNumber;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-black" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Portfolio & FIRE</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Track your simulated assets and plan your early retirement</p>
      </div>

      <div className="bg-white border-4 border-black p-6 lg:p-8 neo-brutalism-shadow flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-black text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1 flex items-center gap-2">
             <RefreshCw size={14} className="animate-spin-slow" /> Live Holdings
          </h3>
          <button
             onClick={() => setActiveTab?.('trading')}
             className="px-4 py-2 border-4 border-black bg-gumroad-pink text-black text-xs font-black uppercase tracking-widest cursor-pointer neo-brutalism-shadow-xs hover:translate-x-1 hover:-translate-y-1 transition-transform"
          >
             Open Trading Floor
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-6 mb-12">
           <div className="relative z-10 w-full md:w-auto">
             <p className="text-xs text-black font-black uppercase tracking-widest mb-3">Total Asset Value (AUM)</p>
             <div className="flex items-center gap-4">
               <motion.h2
                 key={totalCurrentValue}
                 initial={{ opacity: 0.8, y: -2 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-6xl font-black font-headline tracking-tighter text-black bg-gumroad-yellow px-4 py-2 border-4 border-black neo-brutalism-shadow-sm inline-block"
               >
                 ₹{totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </motion.h2>
             </div>
           </div>

           {assets.length > 0 && (
              <div className={cn("px-4 py-2 border-4 border-black flex items-center gap-2 text-xl font-black rotate-2", portfolioPlPercent >= 0 ? "bg-emerald-400 text-black" : "bg-rose-400 text-black")}>
                 {portfolioPlPercent >= 0 ? <TrendingUp size={24} strokeWidth={3} /> : <TrendingDown size={24} strokeWidth={3} />}
                 {portfolioPlPercent >= 0 ? '+' : ''}{portfolioPlPercent.toFixed(2)}%
              </div>
           )}
        </div>

        {assets.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-12 border-4 border-black border-dashed">
              <p className="text-sm font-black text-black/50 uppercase tracking-widest mb-4">You hold exactly 0 assets.</p>
           </div>
        ) : (
           <div className="flex flex-col lg:flex-row gap-8">
               <div className="flex-1 min-h-[300px] relative grid-bg border-4 border-black neo-brutalism-shadow-sm">
                 <ResponsiveContainer width="100%" height="100%">
                   <RechartsPieChart>
                     <Pie
                       data={assets}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={100}
                       paddingAngle={8}
                       dataKey="value"
                       stroke="#000"
                       strokeWidth={4}
                     >
                       {assets.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <RechartsTooltip
                       formatter={(value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                       contentStyle={{
                         backgroundColor: '#fff', border: '4px solid #000', borderRadius: '0', boxShadow: '4px 4px 0px #000', fontWeight: 'bold'
                       }}
                     />
                   </RechartsPieChart>
                 </ResponsiveContainer>
               </div>

               <div className="lg:w-1/2 space-y-4 max-h-[300px] overflow-y-auto pr-4">
                  {assets.map(a => (
                     <div key={a.symbol} className="bg-white border-2 border-black p-3 flex items-center justify-between group hover:bg-black/5 transition-colors neo-brutalism-shadow-xs">
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: a.color }}></div>
                           <div>
                              <p className="font-black text-lg uppercase leading-none">{a.symbol}</p>
                              <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">{a.shares} Shares</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-lg">₹{a.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                           <p className={cn("text-xs font-black flex items-center justify-end gap-1 mt-1", a.plPercent >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {a.plPercent >= 0 ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
                              {a.plPercent >= 0 ? '+' : ''}{a.plPercent.toFixed(2)}%
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
           </div>
        )}
      </div>

      {/* FIRE Calculator */}
      <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 lg:p-8 text-black relative overflow-hidden flex flex-col">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 border-4 border-black bg-gumroad-yellow flex items-center justify-center text-black neo-brutalism-shadow-sm">
              <Target size={28} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-2xl font-black font-headline uppercase tracking-tighter">FIRE Calculator</h3>
              <p className="text-black font-bold text-xs uppercase tracking-tighter opacity-60">Financial Independence, Retire Early</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Current Age</label>
              <input
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:bg-gumroad-pink/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Retire Age</label>
              <input
                type="number"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:bg-gumroad-pink/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">Monthly Save</label>
              <div className="relative">
                <IndianRupee size={18} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                <input
                  type="number"
                  value={monthlySavings}
                  onChange={(e) => setMonthlySavings(Number(e.target.value))}
                  className="w-full bg-white border-4 border-black pl-10 pr-4 py-3 text-black font-bold focus:bg-gumroad-yellow/10 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-black uppercase tracking-widest">FIRE Target</label>
              <div className="relative">
                <IndianRupee size={18} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                <input
                  type="number"
                  value={fireNumber}
                  onChange={(e) => updateFireTarget(Number(e.target.value))}
                  className="w-full bg-white border-4 border-black pl-10 pr-4 py-3 text-black font-bold focus:bg-gumroad-yellow/10 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow-sm flex-1 flex flex-col justify-center">
            <p className="text-xs font-black text-black uppercase tracking-widest mb-2">Projected Value at Age {retirementAge}</p>
            <h4 className={cn(
              "text-5xl font-black font-headline tracking-tighter mb-6",
              projectedSavings >= fireNumber ? "text-emerald-600" : "text-black"
            )}>
              ₹{projectedSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h4>

            <div className="w-full bg-white border-4 border-black h-8 mb-4 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((projectedSavings / fireNumber) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full border-r-4 border-black",
                  isFireOnTrack ? "bg-emerald-500" : "bg-gumroad-yellow"
                )}
              />
            </div>

            <p className="text-xs font-black uppercase tracking-widest">
              {isFireOnTrack
                ? <span className="text-emerald-600 flex items-center gap-2"><CheckCircle2 size={18} strokeWidth={3} /> On track to FIRE!</span>
                : <span className="text-rose-600">Short by ₹{(fireNumber - projectedSavings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
