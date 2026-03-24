import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Target, Repeat, DollarSign, X, CreditCard, PieChart, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

const TOOLS = [
  { id: 'emi', title: 'EMI Calculator', icon: Calculator, description: 'Calculate your monthly loan EMIs', color: 'bg-gumroad-pink text-black' },
  { id: 'fire', title: 'FIRE Calculator', icon: Target, description: 'Plan your early retirement', color: 'bg-gumroad-yellow text-black' },
  { id: 'subs', title: 'Subscriptions', icon: Repeat, description: 'Track your recurring payments', color: 'bg-black text-white' },
  { id: 'currency', title: 'Currency Converter', icon: DollarSign, description: 'Real-time exchange rates', color: 'bg-white text-black' },
  { id: 'tax', title: 'Tax Estimator', icon: PieChart, description: 'Estimate your annual taxes', color: 'bg-gumroad-pink text-black' },
  { id: 'budget', title: 'Budget Planner', icon: CreditCard, description: '50/30/20 rule calculator', color: 'bg-gumroad-yellow text-black' },
];

function EmiCalculator() {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(5);

  const r = rate / 12 / 100;
  const n = years * 12;
  const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Loan Amount ($)</label>
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
      <div className="bg-gumroad-pink border-4 border-black p-6 neo-brutalism-shadow-sm text-center">
        <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Monthly EMI</p>
        <h3 className="text-4xl font-black font-headline text-black tracking-tighter">${emi ? emi.toFixed(2) : '0.00'}</h3>
        <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-4">Total Interest: ${emi ? ((emi * n) - principal).toFixed(2) : '0.00'}</p>
      </div>
    </div>
  );
}

function FireCalculator() {
  const [currentAge, setCurrentAge] = useState(28);
  const [retirementAge, setRetirementAge] = useState(45);
  const [monthlySavings, setMonthlySavings] = useState(1500);
  const [currentSavings, setCurrentSavings] = useState(83172);
  const [fireNumber, setFireNumber] = useState(1500000);

  const annualReturn = 7;
  const yearsToRetire = retirementAge - currentAge;
  const monthlyRate = annualReturn / 100 / 12;
  const months = yearsToRetire * 12;
  
  const projectedSavings = 
    currentSavings * Math.pow(1 + monthlyRate, months) + 
    monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  const isFireOnTrack = projectedSavings >= fireNumber;

  return (
    <div className="space-y-6">
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
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Monthly Save ($)</label>
          <input type="number" value={monthlySavings} onChange={e => setMonthlySavings(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">FIRE Target ($)</label>
          <input type="number" value={fireNumber} onChange={e => setFireNumber(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
        </div>
      </div>
      <div className="bg-gumroad-yellow border-4 border-black p-6 neo-brutalism-shadow-sm text-center">
        <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Projected Savings</p>
        <h3 className="text-4xl font-black font-headline text-black tracking-tighter">${projectedSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}</h3>
        <p className={cn("text-[10px] font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-2", isFireOnTrack ? "text-black" : "text-rose-600")}>
          {isFireOnTrack ? "✨ W. You are on track!" : `L. Falling short by $${(fireNumber - projectedSavings).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
        </p>
      </div>
    </div>
  );
}

function SubscriptionsTracker() {
  const [subs, setSubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase.from('transactions')
        .select('vendor, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense');
      
      if (data) {
        // Auto-detect recurring transactions based on common names or duplicates
        const vendorCounts = new Map<string, number>();
        const vendorAmounts = new Map<string, number>();
        
        data.forEach(t => {
          vendorCounts.set(t.vendor, (vendorCounts.get(t.vendor) || 0) + 1);
          // Keep the latest/highest amount ideally, just keeping last seen here
          vendorAmounts.set(t.vendor, Number(t.amount));
        });
        
        const commonSubs = ['netflix', 'spotify', 'amazon', 'gym', 'hulu', 'disney+', 'apple', 'adobe'];
        
        const detected = Array.from(vendorCounts.entries())
          .filter(([name, count]) => {
             const lowerName = name.toLowerCase();
             return count > 1 || commonSubs.some(sub => lowerName.includes(sub));
          })
          .map(([name, count]) => ({
             name, 
             price: vendorAmounts.get(name) || 0,
             cycle: 'Monthly'
          }));
          
        if (detected.length > 0) {
           setSubs(detected);
        } else {
           // Fallback empty state if no transactions fit
           setSubs([]);
        }
      }
      setIsLoading(false);
    };
    fetchSubs();
  }, []);

  const total = subs.reduce((acc, sub) => acc + sub.price, 0);

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-black border-4 border-black p-6 neo-brutalism-shadow-sm text-center text-white">
        <p className="text-xs font-black uppercase tracking-widest mb-2 border-b-2 border-white pb-1 inline-block">Total Monthly Cost</p>
        <h3 className="text-4xl font-black font-headline tracking-tighter text-gumroad-pink">${total.toFixed(2)}</h3>
        <p className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-60">Auto-detected from your transactions.</p>
      </div>
      <div className="space-y-4">
        {subs.length === 0 && <p className="text-black font-bold text-sm text-center py-4">No recurring subscriptions detected.</p>}
        {subs.map((sub, i) => (
          <div key={i} className="flex justify-between items-center p-4 border-4 border-black bg-white hover:bg-gumroad-yellow transition-all cursor-pointer neo-brutalism-shadow-xs group">
            <div>
              <p className="font-black font-headline text-black uppercase">{sub.name}</p>
              <p className="text-xs font-black text-black/60 uppercase tracking-widest">{sub.cycle}</p>
            </div>
            <p className="text-xl font-black font-headline text-black group-hover:scale-110 transition-transform">${sub.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrencyConverter() {
  const [amount, setAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');

  // Mock exchange rates relative to USD
  const rates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.4,
    INR: 82.9,
    AUD: 1.53,
    CAD: 1.35,
  };

  const convertedAmount = (amount / rates[fromCurrency]) * rates[toCurrency];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">From</label>
          <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors appearance-none">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">To</label>
          <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors appearance-none">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow-sm text-center">
        <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Converted Amount</p>
        <h3 className="text-4xl font-black font-headline text-black tracking-tighter">{convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} {toCurrency}</h3>
        <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-4">1 {fromCurrency} = {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}</p>
      </div>
    </div>
  );
}

function TaxEstimator() {
  const [income, setIncome] = useState(85000);
  const [filingStatus, setFilingStatus] = useState('single');

  // Simplified 2024 US Tax Brackets (Mock)
  const calculateTax = () => {
    let tax = 0;
    let remainingIncome = income;

    if (filingStatus === 'single') {
      const brackets = [
        { limit: 11600, rate: 0.10 },
        { limit: 47150, rate: 0.12 },
        { limit: 100525, rate: 0.22 },
        { limit: 191950, rate: 0.24 },
        { limit: 243725, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
      ];
      
      let prevLimit = 0;
      for (const bracket of brackets) {
        if (income > prevLimit) {
          const taxableInThisBracket = Math.min(income - prevLimit, bracket.limit - prevLimit);
          tax += taxableInThisBracket * bracket.rate;
          prevLimit = bracket.limit;
        } else {
          break;
        }
      }
    } else {
      // Simplified mock for married filing jointly
      tax = income * 0.15; 
    }
    return tax;
  };

  const estimatedTax = calculateTax();
  const effectiveRate = income > 0 ? (estimatedTax / income) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Annual Income ($)</label>
          <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Filing Status</label>
          <select value={filingStatus} onChange={e => setFilingStatus(e.target.value)} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors appearance-none">
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
          </select>
        </div>
      </div>
      <div className="bg-gumroad-pink border-4 border-black p-6 neo-brutalism-shadow-sm text-center">
        <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Estimated Federal Tax</p>
        <h3 className="text-4xl font-black font-headline text-black tracking-tighter">${estimatedTax.toLocaleString('en-US', { maximumFractionDigits: 0 })}</h3>
        <p className="text-[10px] font-black text-black uppercase tracking-widest mt-4">Effective Tax Rate: {effectiveRate.toFixed(1)}%</p>
      </div>
      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest text-center">This is a simplified estimation and does not constitute professional tax advice.</p>
    </div>
  );
}

function BudgetPlanner() {
  const [income, setIncome] = useState(5000);

  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Monthly After-Tax Income ($)</label>
        <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
      </div>
      
      <div className="space-y-4">
        {[
          { label: 'Needs (50%)', desc: 'Housing, food, utilities, transport', val: needs, color: 'bg-gumroad-pink' },
          { label: 'Wants (30%)', desc: 'Entertainment, dining out, hobbies', val: wants, color: 'bg-gumroad-yellow' },
          { label: 'Savings/Debt (20%)', desc: 'Investments, emergency fund, debt payoff', val: savings, color: 'bg-white' },
        ].map((cat, i) => (
          <div key={i} className={cn("p-5 border-4 border-black flex justify-between items-center neo-brutalism-shadow-xs", cat.color)}>
            <div>
              <p className="font-black font-headline text-black uppercase">{cat.label}</p>
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest">{cat.desc}</p>
            </div>
            <p className="text-2xl font-black font-headline text-black">${cat.val.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Tools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const renderToolContent = () => {
    switch (activeTool) {
      case 'emi': return <EmiCalculator />;
      case 'fire': return <FireCalculator />;
      case 'subs': return <SubscriptionsTracker />;
      case 'currency': return <CurrencyConverter />;
      case 'tax': return <TaxEstimator />;
      case 'budget': return <BudgetPlanner />;
      default: return <div className="p-8 text-center text-slate-500">Tool under construction. Check back soon!</div>;
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Financial Tools</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Calculators and trackers to manage your wealth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TOOLS.map(tool => (
          <motion.button
            key={tool.id}
            whileHover={{ x: 4, y: 4, boxShadow: 'none' }}
            onClick={() => setActiveTool(tool.id)}
            className="bg-white p-8 border-4 border-black neo-brutalism-shadow text-left group transition-all"
          >
            <div className={cn("w-16 h-16 border-4 border-black flex items-center justify-center mb-6 neo-brutalism-shadow-sm", tool.color)}>
              <tool.icon size={32} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black font-headline text-black mb-2 uppercase">{tool.title}</h3>
            <p className="text-xs font-bold text-black uppercase tracking-tighter opacity-60">{tool.description}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setActiveTool(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-4 border-black neo-brutalism-shadow-lg w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gumroad-yellow">
                <h2 className="text-2xl font-black font-headline text-black uppercase tracking-tighter">
                  {TOOLS.find(t => t.id === activeTool)?.title}
                </h2>
                <button 
                  onClick={() => setActiveTool(null)}
                  className="w-10 h-10 flex items-center justify-center border-4 border-black bg-white text-black hover:bg-gumroad-pink transition-colors cursor-pointer"
                >
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto grid-bg">
                {renderToolContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
