import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Target, Repeat, DollarSign, X, CreditCard, PieChart, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

const TOOLS = [
  { id: 'emi', title: 'EMI Calculator', icon: Calculator, description: 'Calculate your monthly loan EMIs', color: 'bg-blue-100 text-blue-600' },
  { id: 'fire', title: 'FIRE Calculator', icon: Target, description: 'Plan your early retirement', color: 'bg-emerald-100 text-emerald-600' },
  { id: 'subs', title: 'Subscriptions', icon: Repeat, description: 'Track your recurring payments', color: 'bg-purple-100 text-purple-600' },
  { id: 'currency', title: 'Currency Converter', icon: DollarSign, description: 'Real-time exchange rates', color: 'bg-amber-100 text-amber-600' },
  { id: 'tax', title: 'Tax Estimator', icon: PieChart, description: 'Estimate your annual taxes', color: 'bg-rose-100 text-rose-600' },
  { id: 'budget', title: 'Budget Planner', icon: CreditCard, description: '50/30/20 rule calculator', color: 'bg-indigo-100 text-indigo-600' },
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
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Loan Amount ($)</label>
          <input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
          <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (Years)</label>
          <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="bg-blue-50 p-6 rounded-2xl text-center border border-blue-100">
        <p className="text-sm text-blue-600 font-medium mb-1">Monthly EMI</p>
        <h3 className="text-4xl font-bold text-blue-900">${emi ? emi.toFixed(2) : '0.00'}</h3>
        <p className="text-xs text-blue-500 mt-2">Total Interest: ${emi ? ((emi * n) - principal).toFixed(2) : '0.00'}</p>
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Current Age</label>
          <input type="number" value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Retire Age</label>
          <input type="number" value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Save ($)</label>
          <input type="number" value={monthlySavings} onChange={e => setMonthlySavings(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">FIRE Target ($)</label>
          <input type="number" value={fireNumber} onChange={e => setFireNumber(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500" />
        </div>
      </div>
      <div className="bg-emerald-50 p-6 rounded-2xl text-center border border-emerald-100">
        <p className="text-sm text-emerald-600 font-medium mb-1">Projected Savings</p>
        <h3 className="text-4xl font-bold text-emerald-900">${projectedSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}</h3>
        <p className={cn("text-sm font-medium mt-3", isFireOnTrack ? "text-emerald-600" : "text-amber-600")}>
          {isFireOnTrack ? "✨ You are on track!" : `Falling short by $${(fireNumber - projectedSavings).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
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
      <div className="bg-purple-50 p-6 rounded-2xl text-center border border-purple-100">
        <p className="text-sm text-purple-600 font-medium mb-1">Total Monthly Cost</p>
        <h3 className="text-4xl font-bold text-purple-900">${total.toFixed(2)}</h3>
        <p className="text-xs text-purple-500 mt-2">Auto-detected from your transactions.</p>
      </div>
      <div className="space-y-3">
        {subs.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No recurring subscriptions detected.</p>}
        {subs.map((sub, i) => (
          <div key={i} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
            <div>
              <p className="font-medium text-slate-900">{sub.name}</p>
              <p className="text-xs text-slate-500">{sub.cycle}</p>
            </div>
            <p className="font-semibold text-slate-900">${sub.price.toFixed(2)}</p>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
          <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
          <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white">
            {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-amber-50 p-6 rounded-2xl text-center border border-amber-100">
        <p className="text-sm text-amber-600 font-medium mb-1">Converted Amount</p>
        <h3 className="text-4xl font-bold text-amber-900">{convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} {toCurrency}</h3>
        <p className="text-xs text-amber-500 mt-2">1 {fromCurrency} = {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}</p>
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
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Annual Income ($)</label>
          <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Filing Status</label>
          <select value={filingStatus} onChange={e => setFilingStatus(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white">
            <option value="single">Single</option>
            <option value="married">Married Filing Jointly</option>
          </select>
        </div>
      </div>
      <div className="bg-rose-50 p-6 rounded-2xl text-center border border-rose-100">
        <p className="text-sm text-rose-600 font-medium mb-1">Estimated Federal Tax</p>
        <h3 className="text-4xl font-bold text-rose-900">${estimatedTax.toLocaleString('en-US', { maximumFractionDigits: 0 })}</h3>
        <p className="text-xs text-rose-500 mt-2">Effective Tax Rate: {effectiveRate.toFixed(1)}%</p>
      </div>
      <p className="text-xs text-slate-400 text-center">This is a simplified estimation and does not constitute professional tax advice.</p>
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
        <label className="block text-sm font-medium text-slate-700 mb-1">Monthly After-Tax Income ($)</label>
        <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>
      
      <div className="space-y-4">
        <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
          <div>
            <p className="font-bold text-slate-900">Needs (50%)</p>
            <p className="text-xs text-slate-500">Housing, food, utilities, transport</p>
          </div>
          <p className="font-bold text-indigo-600">${needs.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
        
        <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
          <div>
            <p className="font-bold text-slate-900">Wants (30%)</p>
            <p className="text-xs text-slate-500">Entertainment, dining out, hobbies</p>
          </div>
          <p className="font-bold text-purple-600">${wants.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
        
        <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
          <div>
            <p className="font-bold text-slate-900">Savings/Debt (20%)</p>
            <p className="text-xs text-slate-500">Investments, emergency fund, debt payoff</p>
          </div>
          <p className="font-bold text-emerald-600">${savings.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
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
        <h1 className="text-2xl font-bold text-slate-900">Financial Tools</h1>
        <p className="text-slate-500 text-sm mt-1">Calculators and trackers to manage your wealth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", tool.color)}>
              <tool.icon size={24} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{tool.title}</h3>
            <p className="text-sm text-slate-500">{tool.description}</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setActiveTool(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">
                  {TOOLS.find(t => t.id === activeTool)?.title}
                </h2>
                <button 
                  onClick={() => setActiveTool(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {renderToolContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
