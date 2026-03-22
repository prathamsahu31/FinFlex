import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calculator, DollarSign, CheckCircle2, Plus, X, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ec4899', '#8b5cf6'];

export default function Portfolio() {
  const [user, setUser] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({ symbol: '', name: '', shares: '', current_price: '' });

  // FIRE Calculator State
  const [currentAge, setCurrentAge] = useState(28);
  const [retirementAge, setRetirementAge] = useState(45);
  const [monthlySavings, setMonthlySavings] = useState(1500);
  const [fireNumber, setFireNumber] = useState(1500000);

  // Savings Buckets State
  const [buckets, setBuckets] = useState([
    { id: 1, name: 'Emergency Fund', target: 20000, current: 15500, color: 'bg-rose-500', icon: '🏦' },
    { id: 2, name: 'House Downpayment', target: 60000, current: 18000, color: 'bg-blue-500', icon: '🏠' },
    { id: 3, name: 'Japan Trip', target: 5000, current: 2300, color: 'bg-emerald-500', icon: '✈️' }
  ]);

  useEffect(() => {
    const initData = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data: assetData } = await supabase.from('portfolio_assets').select('*').eq('user_id', user.id);
      if (assetData) {
        setAssets(assetData.map((a, i) => ({
          ...a,
          value: Number(a.shares) * Number(a.current_price),
          color: COLORS[i % COLORS.length]
        })));
      }
      setIsLoading(false);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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
  }, []);

  const totalValue = useMemo(() => assets.reduce((sum, a) => sum + a.value, 0), [assets]);
  const currentSavings = totalValue;

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase.from('portfolio_assets').insert([{
        user_id: user.id,
        symbol: newAsset.symbol.toUpperCase(),
        name: newAsset.name || newAsset.symbol.toUpperCase(),
        shares: Number(newAsset.shares),
        current_price: Number(newAsset.current_price)
      }]).select();

      if (!error && data) {
        setAssets(prev => [...prev, {
          ...data[0],
          value: Number(data[0].shares) * Number(data[0].current_price),
          color: COLORS[prev.length % COLORS.length]
        }]);
        setShowAddAsset(false);
        setNewAsset({ symbol: '', name: '', shares: '', current_price: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateFireTarget = async (newVal: number) => {
    setFireNumber(newVal);
    if (!supabase || !user) return;
    await supabase.from('profiles').update({ fire_target: newVal }).eq('id', user.id);
  };

  // Calculate projected savings at retirement age
  const yearsToRetire = retirementAge - currentAge;
  const annualReturn = 7; // Assumed 7% historic real return
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Live Portfolio</h3>
            <button
              onClick={() => setShowAddAsset(!showAddAsset)}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors uppercase tracking-wider"
            >
              {showAddAsset ? <X size={14} /> : <Plus size={14} />}
              {showAddAsset ? 'Cancel' : 'Add Asset'}
            </button>
          </div>

          <AnimatePresence>
            {showAddAsset && (
              <motion.form
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                onSubmit={handleAddAsset}
                className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner"
              >
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Add New Asset</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Symbol</label>
                    <input type="text" required value={newAsset.symbol} onChange={e => setNewAsset({ ...newAsset, symbol: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. VOO" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name (Optional)</label>
                    <input type="text" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="S&P 500 ETF" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Shares</label>
                    <input type="number" step="any" required value={newAsset.shares} onChange={e => setNewAsset({ ...newAsset, shares: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="10.5" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Price</label>
                    <input type="number" step="any" required value={newAsset.current_price} onChange={e => setNewAsset({ ...newAsset, current_price: e.target.value })} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="400.00" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
                  Save Asset
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mb-8 relative z-10">
            <p className="text-sm text-slate-500 font-medium mb-2">Total Asset Value</p>
            <div className="flex items-end gap-4">
              <motion.h2
                key={totalValue}
                initial={{ opacity: 0.8, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "text-5xl font-bold tracking-tight transition-colors duration-500",
                  "text-slate-900"
                )}
              >
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.h2>
              <span className={cn(
                "flex items-center text-sm font-bold mb-2 px-2 py-1 rounded-lg",
                "bg-emerald-100 text-emerald-700"
              )}>
                <TrendingUp size={16} className="mr-1" /> +0.00%
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assets}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {assets.map((entry, index) => (
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
              {assets.map((item) => (
                <div key={item.symbol} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-medium text-slate-600">{item.symbol}</span>
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
                    onChange={(e) => updateFireTarget(Number(e.target.value))}
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

      {/* Savings Buckets */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Savings Buckets</h3>
            <p className="text-sm text-slate-500 mt-1">Allocate your net savings towards distinct goals</p>
          </div>
          <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-wider">
            <Plus size={14} /> Add Bucket
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {buckets.map(bucket => {
            const percent = Math.min((bucket.current / bucket.target) * 100, 100);
            const isCompleted = percent === 100;
            return (
              <motion.div
                key={bucket.id}
                whileHover={{ y: -4 }}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">
                    {bucket.icon}
                  </div>
                  {isCompleted && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>}
                </div>

                <h4 className="font-bold text-slate-800 mb-1">{bucket.name}</h4>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-2xl font-bold tracking-tight text-slate-900">${bucket.current.toLocaleString()}</span>
                  <span className="text-sm text-slate-500 mb-1">/ ${bucket.target.toLocaleString()}</span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full", bucket.color)}
                  />
                </div>
                <p className="text-xs font-medium text-slate-500 text-right">{percent.toFixed(0)}% Funded</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
