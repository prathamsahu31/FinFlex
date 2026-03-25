import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, Target, Plus, X, DollarSign, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, Info, Loader2, CheckCircle2, TrendingDown, Calculator } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ec4899', '#8b5cf6'];

export default function Portfolio({ setActiveTab, user, profile }: TabComponentProps & { user: any, profile: any }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!user);
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
  const [showAddBucket, setShowAddBucket] = useState(false);
  const [newBucket, setNewBucket] = useState({ name: '', target: '', current: '', icon: '🎯' });

  const BUCKET_COLORS = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'];

  const handleAddBucket = () => {
    if (!newBucket.name || !newBucket.target) return;
    const newId = Math.max(...buckets.map(b => b.id), 0) + 1;
    setBuckets(prev => [...prev, {
      id: newId,
      name: newBucket.name,
      target: Number(newBucket.target),
      current: Number(newBucket.current) || 0,
      color: BUCKET_COLORS[newId % BUCKET_COLORS.length],
      icon: newBucket.icon || '🎯'
    }]);
    setShowAddBucket(false);
    setNewBucket({ name: '', target: '', current: '', icon: '🎯' });
  };

  useEffect(() => {
    const initData = async () => {
      if (!supabase || !user) {
        setIsLoading(!user);
        return;
      }

      const { data: assetData } = await supabase.from('portfolio_assets').select('*').eq('user_id', user.id);
      if (assetData) {
        setAssets(assetData.map((a, i) => ({
          ...a,
          value: Number(a.shares) * Number(a.current_price),
          color: COLORS[i % COLORS.length]
        })));
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
  }, [user, profile]);

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
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Portfolio & FIRE</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Track your assets and plan your early retirement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Portfolio */}
        <div className="bg-white border-4 border-black p-6 lg:p-8 neo-brutalism-shadow flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-black text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1 inline-block">Live Portfolio</h3>
            <motion.button
              whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
              onClick={() => setShowAddAsset(!showAddAsset)}
              className="flex items-center gap-2 text-xs font-black px-4 py-2 border-4 border-black bg-gumroad-pink text-black neo-brutalism-shadow-sm cursor-pointer transition-all uppercase tracking-widest"
            >
              {showAddAsset ? <X size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
              {showAddAsset ? 'Cancel' : 'Add Asset'}
            </motion.button>
          </div>

          <AnimatePresence>
            {showAddAsset && (
              <motion.form
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                onSubmit={handleAddAsset}
                className="mb-8 p-6 bg-gumroad-yellow/10 border-4 border-black neo-brutalism-shadow-sm overflow-hidden"
              >
                <h4 className="text-sm font-black text-black uppercase tracking-widest mb-4">Add New Asset</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Symbol</label>
                    <input type="text" required value={newAsset.symbol} onChange={e => setNewAsset({ ...newAsset, symbol: e.target.value })} className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10 transition-colors placeholder:text-black/30" placeholder="e.g. VOO" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Name (Optional)</label>
                    <input type="text" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10 transition-colors placeholder:text-black/30" placeholder="S&P 500 ETF" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Shares</label>
                    <input type="number" step="any" required value={newAsset.shares} onChange={e => setNewAsset({ ...newAsset, shares: e.target.value })} className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10 transition-colors placeholder:text-black/30" placeholder="10.5" />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Current Price</label>
                    <input type="number" step="any" required value={newAsset.current_price} onChange={e => setNewAsset({ ...newAsset, current_price: e.target.value })} className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10 transition-colors placeholder:text-black/30" placeholder="400.00" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-gumroad-pink hover:text-black transition-colors border-4 border-black neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                  Save Asset
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mb-12 relative z-10">
            <p className="text-xs text-black font-black uppercase tracking-widest mb-3">Total Asset Value</p>
            <div className="flex items-center gap-4">
              <motion.h2
                key={totalValue}
                initial={{ opacity: 0.8, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-black font-headline tracking-tighter text-black bg-gumroad-yellow px-4 py-2 border-4 border-black neo-brutalism-shadow-sm inline-block"
              >
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </motion.h2>
              <span className="flex items-center text-xl font-black text-emerald-600 bg-white border-4 border-black px-3 py-1 neo-brutalism-shadow-xs">
                <TrendingUp size={18} strokeWidth={3} className="mr-1" /> +0.00%
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] relative grid-bg border-4 border-black neo-brutalism-shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={assets}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
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
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '4px solid #000',
                    borderRadius: '0',
                    boxShadow: '4px 4px 0px #000'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className="absolute bottom-4 left-0 right-0 flex flex-wrap justify-center gap-4 px-4 pb-2">
              {assets.map((item) => (
                <div key={item.symbol} className="flex items-center gap-2 bg-white border-2 border-black px-2 py-1 neo-brutalism-shadow-xs">
                  <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-black">{item.symbol}</span>
                </div>
              ))}
            </div>
          </div>
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
                  <DollarSign size={18} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                  <input
                    type="number"
                    value={monthlySavings}
                    onChange={(e) => setMonthlySavings(Number(e.target.value))}
                    className="w-full bg-white border-4 border-black pl-10 pr-4 py-3 text-black font-bold focus:bg-gumroad-yellow/10 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">FIRE Number</label>
                <div className="relative">
                  <DollarSign size={18} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
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
              <p className="text-xs font-black text-black uppercase tracking-widest mb-2">Projected Savings at Age {retirementAge}</p>
              <h4 className={cn(
                "text-5xl font-black font-headline tracking-tighter mb-6",
                isFireOnTrack ? "text-emerald-600" : "text-black"
              )}>
                ${projectedSavings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
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
                  ? <span className="text-emerald-600 flex items-center gap-2"><CheckCircle2 size={18} strokeWidth={3} /> You are on track to FIRE!</span>
                  : <span className="text-rose-600">You will fall short by ${(fireNumber - projectedSavings).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Buckets */}
      <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black font-headline uppercase tracking-tighter text-black">Savings Buckets</h3>
            <p className="text-black font-bold text-xs uppercase tracking-tighter opacity-60 mt-1">Allocate your net savings towards distinct goals</p>
          </div>
          <motion.button 
            whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
            onClick={() => setShowAddBucket(!showAddBucket)}
            className="flex items-center gap-2 text-xs font-black px-4 py-2 border-4 border-black bg-white text-black neo-brutalism-shadow-sm cursor-pointer transition-all uppercase tracking-widest"
          >
            {showAddBucket ? <X size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
            {showAddBucket ? 'Cancel' : 'Add Bucket'}
          </motion.button>
        </div>

        <AnimatePresence>
          {showAddBucket && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-6 bg-gumroad-yellow/10 border-4 border-black neo-brutalism-shadow-sm overflow-hidden"
            >
              <h4 className="text-sm font-black text-black uppercase tracking-widest mb-4">New Savings Bucket</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Name</label>
                  <input type="text" value={newBucket.name} onChange={e => setNewBucket({...newBucket, name: e.target.value})} placeholder="e.g. Vacation" className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10 placeholder:text-black/30" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Target ($)</label>
                  <input type="number" value={newBucket.target} onChange={e => setNewBucket({...newBucket, target: e.target.value})} placeholder="10000" className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10 placeholder:text-black/30" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Current ($)</label>
                  <input type="number" value={newBucket.current} onChange={e => setNewBucket({...newBucket, current: e.target.value})} placeholder="0" className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10 placeholder:text-black/30" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Icon</label>
                  <input type="text" value={newBucket.icon} onChange={e => setNewBucket({...newBucket, icon: e.target.value})} className="w-full px-4 py-2 bg-white border-4 border-black text-sm font-bold outline-none focus:bg-gumroad-pink/10" />
                </div>
              </div>
              <button onClick={handleAddBucket} className="w-full py-3 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-gumroad-pink hover:text-black transition-colors border-4 border-black neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer">
                Save Bucket
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {buckets.map(bucket => {
            const percent = Math.min((bucket.current / bucket.target) * 100, 100);
            const isCompleted = percent === 100;
            return (
              <motion.div
                key={bucket.id}
                whileHover={{ y: -4 }}
                className="bg-white border-4 border-black neo-brutalism-shadow-sm p-6 flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 border-4 border-black bg-white flex items-center justify-center text-3xl neo-brutalism-shadow-xs">
                    {bucket.icon}
                  </div>
                  {isCompleted && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-white border-2 border-emerald-600 px-2 py-1 flex items-center gap-1"><CheckCircle2 size={12} strokeWidth={3} /> Goal Reached</span>}
                </div>

                <h4 className="font-black font-headline text-xl uppercase text-black mb-2">{bucket.name}</h4>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-black font-headline text-black">${bucket.current.toLocaleString()}</span>
                  <span className="text-xs font-bold text-black opacity-40 uppercase tracking-tighter">/ ${bucket.target.toLocaleString()}</span>
                </div>

                <div className="w-full bg-white border-4 border-black h-4 mb-2 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full border-r-4 border-black", bucket.color.replace('bg-', 'bg-'))}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/60 text-right">{percent.toFixed(0)}% Funded</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
