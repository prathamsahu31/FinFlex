import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calculator, DollarSign, CheckCircle2 } from 'lucide-react';
import { cn } from './utils';

const PORTFOLIO_DATA = [
  { name: 'S&P 500 (VOO)', value: 45000, color: '#10b981' },
  { name: 'Tech ETF (QQQ)', value: 25000, color: '#3b82f6' },
  { name: 'Crypto (BTC)', value: 8000, color: '#f59e0b' },
  { name: 'Bonds (BND)', value: 5172.64, color: '#64748b' },
];

export default function Portfolio() {
  const [totalValue, setTotalValue] = useState(83172.64);
  const [isPositive, setIsPositive] = useState(true);
  
  // FIRE Calculator State
  const [currentAge, setCurrentAge] = useState(28);
  const [retirementAge, setRetirementAge] = useState(45);
  const [monthlySavings, setMonthlySavings] = useState(1500);
  const [currentSavings, setCurrentSavings] = useState(83172);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [fireNumber, setFireNumber] = useState(1500000);

  // Simulate live market fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      const fluctuation = (Math.random() - 0.45) * 50; // Slight upward bias
      setTotalValue(prev => {
        const newValue = prev + fluctuation;
        setIsPositive(fluctuation >= 0);
        return newValue;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Calculate projected savings at retirement age
  const yearsToRetire = retirementAge - currentAge;
  const monthlyRate = annualReturn / 100 / 12;
  const months = yearsToRetire * 12;
  
  // Future Value of current savings + Future Value of monthly contributions
  const projectedSavings = 
    currentSavings * Math.pow(1 + monthlyRate, months) + 
    monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  const isFireOnTrack = projectedSavings >= fireNumber;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio & FIRE</h1>
        <p className="text-slate-500 text-sm mt-1">Track your assets and plan your early retirement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Portfolio */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Live Portfolio</h3>
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Market
            </span>
          </div>

          <div className="mb-8">
            <p className="text-sm text-slate-500 font-medium mb-2">Total Asset Value</p>
            <div className="flex items-end gap-4">
              <motion.h2 
                key={totalValue}
                initial={{ opacity: 0.8, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-5xl font-bold tracking-tight transition-colors duration-500",
                  isPositive ? "text-slate-900" : "text-slate-800"
                )}
              >
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.h2>
              <span className={cn(
                "flex items-center text-sm font-bold mb-2 px-2 py-1 rounded-lg",
                isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}>
                {isPositive ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                {isPositive ? '+' : ''}{(Math.random() * 0.5).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PORTFOLIO_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {PORTFOLIO_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-4">
              {PORTFOLIO_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-medium text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FIRE Calculator */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 lg:p-8 text-white relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">FIRE Calculator</h3>
                <p className="text-slate-400 text-sm">Financial Independence, Retire Early</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Age</label>
                <input 
                  type="number" 
                  value={currentAge} 
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retire Age</label>
                <input 
                  type="number" 
                  value={retirementAge} 
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Save</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    value={monthlySavings} 
                    onChange={(e) => setMonthlySavings(Number(e.target.value))}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">FIRE Number</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    value={fireNumber} 
                    onChange={(e) => setFireNumber(Number(e.target.value))}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <p className="text-sm text-slate-400 mb-2">Projected Savings at Age {retirementAge}</p>
              <h4 className={cn(
                "text-4xl font-bold tracking-tight mb-4",
                isFireOnTrack ? "text-emerald-400" : "text-amber-400"
              )}>
                ${projectedSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </h4>
              
              <div className="w-full bg-slate-900 rounded-full h-3 mb-3 overflow-hidden border border-slate-700">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((projectedSavings / fireNumber) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isFireOnTrack ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </div>
              
              <p className="text-sm font-medium">
                {isFireOnTrack 
                  ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={16} /> You are on track to FIRE!</span>
                  : <span className="text-amber-400">You will fall short by ${(fireNumber - projectedSavings).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
