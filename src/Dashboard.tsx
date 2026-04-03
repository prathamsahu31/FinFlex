import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  MoreVertical, 
  CreditCard, 
  Plus, 
  Search, 
  Filter,
  Briefcase,
  Loader2,
  CalendarDays,
  Target,
  Trophy,
  Zap,
  Crown
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis
} from 'recharts';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';
import CountUp from './CountUp';
import AIInsights from './components/AIInsights';
import AIDiagnostics from './components/AIDiagnostics';

interface DashboardProps extends TabComponentProps {
  user: any;
  profile: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15 } }
};

const CATEGORY_COLORS: Record<string, string> = {
  'Shopping': '#1e293b',
  'Transport': '#e2e8f0',
  'Other': '#93c5fd',
  'Rent & Bills': '#60a5fa',
  'Food & Dining': '#1d4ed8',
  'Entertainment': '#cbd5e1',
  'Salary': '#10b981'
};

export default function Dashboard({ setActiveTab, user }: DashboardProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gamification, setGamification] = useState({ xp: 0, level: 1 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom Date Range State
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [startDate, setStartDate] = useState<string>(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchData = React.useCallback(async (isSilent = false) => {
    if (!supabase || !user) {
      if (!user) setIsLoading(false);
      return;
    }

    if (!isSilent) setIsLoading(true);

    // Fetch all data in parallel — each query is independent
    const [txResult, gamifResult, lbResult, holdResult] = await Promise.allSettled([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('user_gamification').select('xp, level').eq('id', user.id).single(),
      supabase.from('user_gamification').select('id, xp, level').order('xp', { ascending: false }).limit(10),
      supabase.from('stock_holdings').select('*').eq('user_id', user.id),
    ]);

    // Process each result independently — one failure won't affect others
    if (txResult.status === 'fulfilled' && txResult.value.data) {
      setTransactions(txResult.value.data);
    }
    if (gamifResult.status === 'fulfilled' && gamifResult.value.data) {
      setGamification(gamifResult.value.data);
    }
    if (lbResult.status === 'fulfilled' && lbResult.value.data) {
      setLeaderboard(lbResult.value.data.map((d: any, idx: number) => ({
        rank: idx + 1,
        name: `Trader ${(d.id as string).slice(0, 6)}`,
        xp: d.xp || 0,
        isMe: d.id === user.id
      })));
    }
    if (holdResult.status === 'fulfilled' && holdResult.value.data) {
      setHoldings(holdResult.value.data);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();

    // 1. Re-fetch on Window Focus / Tab Switch
    const handleFocus = () => {
      // Small cooldown or silent fetch
      fetchData(true); 
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchData(true);
    });

    // 2. Real-time Supabase Subscription
    const channel = supabase
      .channel('dashboard_sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transactions',
        filter: `user_id=eq.${user?.id}`
      }, () => fetchData(true))
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'user_gamification',
        filter: `id=eq.${user?.id}`
      }, () => fetchData(true))
      .subscribe();

    // 3. Periodic Polling (every 60s) as a fail-safe
    const pollInterval = setInterval(() => fetchData(true), 60000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user, fetchData]);

  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    
    transactions.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'income') income += amt;
      else expenses += amt;
    });

    const balance = income - expenses;
    return { income, expenses, balance };
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type === 'expense') {
        map.set(t.category, (map.get(t.category) || 0) + Number(t.amount));
      }
    });
    
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#94a3b8'
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Trend Data restricted by Custom Range
  const trendData = useMemo(() => {
    const map = new Map<string, { income: number, expenses: number }>();
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    transactions.forEach(t => {
      const dateObj = new Date(t.date || t.created_at);
      if (dateObj >= startObj && dateObj <= endObj) {
        const key = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!map.has(key)) map.set(key, { income: 0, expenses: 0 });
        const current = map.get(key)!;
        
        if (t.type === 'income') current.income += Number(t.amount);
        if (t.type === 'expense') current.expenses += Number(t.amount);
      }
    });
    
    return Array.from(map.entries()).reverse().map(([name, vals]) => ({
      name,
      income: vals.income,
      expenses: vals.expenses
    }));
  }, [transactions, startDate, endDate]);

  const cashTrackingData = trendData.slice(-7); 
  const portfolioTotalValue = useMemo(() => holdings.reduce((sum, h) => sum + (h.total_quantity * h.avg_buy_price), 0), [holdings]);

  const achievements = useMemo(() => {
    const list = [];
    const totalValue = stats.balance + portfolioTotalValue;
    
    if (transactions.length > 0) {
      list.push({ id: 'first_trade', title: 'First Trade', desc: 'Made your first financial move', icon: Zap, color: 'bg-gumroad-pink' });
    }
    if (totalValue >= 11000) { // 10% profit from 10000
      list.push({ id: 'profit_10', title: '10% Gainer', desc: 'Grew your wealth by 10%', icon: TrendingUp, color: 'bg-gumroad-yellow' });
    }
    if (totalValue >= 20000) {
      list.push({ id: 'whale', title: 'Whale Alert', desc: 'Portfolio hit ₹20k baseline', icon: Crown, color: 'bg-emerald-400' });
    }
    if (gamification.level >= 5) {
      list.push({ id: 'pro', title: 'Pro Trader', desc: 'Reached Level 5', icon: Trophy, color: 'bg-indigo-400' });
    }
    return list;
  }, [transactions, stats.balance, portfolioTotalValue, gamification.level]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-black" size={40} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="max-w-[1400px] mx-auto space-y-8 p-4 lg:p-8"
    >
      
      {/* Header with Flex Score */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-5xl font-black font-headline text-black uppercase tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-black font-bold text-sm border-l-4 border-black pl-3 uppercase tracking-tighter">
            Real-time financial warfare
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-gumroad-pink border-4 border-black px-6 py-3 neo-brutalism-shadow transition-transform hover:-translate-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">FLEX SCORE (XP)</p>
            <p className="text-3xl font-black font-headline text-white italic">
              <CountUp value={gamification.xp} duration={2} />
            </p>
          </div>
          <div className="bg-gumroad-yellow border-4 border-black px-4 py-3 neo-brutalism-shadow hidden sm:block">
            <p className="text-[8px] font-black uppercase tracking-widest text-black">TRADER LEVEL</p>
            <p className="text-xl font-black font-headline text-black italic">LVL {gamification.level}</p>
          </div>
        </div>
      </div>
      
      {/* AI Troubleshooting Diagnostics */}
      <AIDiagnostics />

      {/* AI Financial Vibe Check (Gemini Integration) */}
      <AIInsights transactions={transactions} />

      {/* Top Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-gumroad-pink border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Liquid Balance</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2 break-words">
            <CountUp value={stats.balance} prefix="₹" decimals={2} />
          </h2>
          <span className="flex items-center text-black text-xs font-bold bg-white border-2 border-black px-2 py-1 w-max neo-brutalism-shadow">
            <TrendingUp size={16} className="mr-2" strokeWidth={3}/> ALL TIME
          </span>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Income</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2 break-words">
            <CountUp value={stats.income} prefix="₹" decimals={2} />
          </h2>
          <p className="text-black font-bold text-xs">All incoming transfers</p>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Expenses</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2 break-words">
            <CountUp value={stats.expenses} prefix="₹" decimals={2} />
          </h2>
          <p className="text-black font-bold text-xs">Bills & daily spend</p>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-gumroad-yellow border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Rank Position</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2 break-words">
            #{leaderboard.find(l => l.isMe)?.rank || '?'}
          </h2>
          <p className="text-black font-bold text-xs">Out of {leaderboard.length} traders</p>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* True Investment Portfolio summary */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} transition={{ duration: 0.1 }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Holdings</h3>
              <div className="flex gap-3 text-black">
                <Briefcase size={20} strokeWidth={3} className="cursor-pointer hover:text-gumroad-pink" onClick={() => setActiveTab?.('portfolio')} />
              </div>
            </div>
            
            <div 
               className="h-44 bg-black border-4 border-black text-white p-5 cursor-pointer hover:bg-zinc-900 transition-colors relative overflow-hidden group"
               onClick={() => setActiveTab?.('portfolio')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gumroad-pink/20 blur-2xl -mr-10 -mt-10 group-hover:bg-gumroad-pink/40 transition-colors"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-black font-label uppercase tracking-widest">AUM Value</span>
                </div>
                <div>
                  <h4 className="text-3xl font-black font-headline tracking-tight mt-2">
                     ₹{portfolioTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h4>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-xs font-bold uppercase tracking-widest">{holdings.length} Active Positions</span>
                  </div>
                  <div className="w-full bg-zinc-800 border-2 border-white h-3 mt-2 rounded-none">
                    <div className="bg-gumroad-pink h-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Achievements from Zip(1) Integration */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} transition={{ duration: 0.1 }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
             <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
                <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black flex items-center gap-2">
                  <Trophy size={20} strokeWidth={3} className="text-gumroad-yellow" /> Badges
                </h3>
             </div>
             <div className="flex flex-wrap gap-3">
                {achievements.length === 0 ? (
                  <p className="text-xs font-bold text-black/40 uppercase tracking-widest italic py-4">No badges earned yet. Start trading to unlock!</p>
                ) : achievements.map((a) => (
                  <div key={a.id} className={cn("px-4 py-2 border-4 border-black font-black uppercase text-[10px] tracking-widest neo-brutalism-shadow-xs flex items-center gap-2", a.color)}>
                     <a.icon size={12} strokeWidth={4} />
                     {a.title}
                  </div>
                ))}
             </div>
          </motion.div>

          {/* Gamified Leaderboard Card (Live Server Data) */}
          <motion.div variants={itemVariants} className="md:col-span-1 lg:col-span-4">
            <div className="bg-white border-4 border-black neo-brutalism-shadow h-full flex flex-col group">
              <div className="p-4 border-b-4 border-black bg-gumroad-yellow flex items-center justify-between">
                <h3 className="font-black font-headline text-lg uppercase flex items-center gap-2">
                  <TrendingUp size={20} strokeWidth={3} /> Global Leaderboard
                </h3>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                {leaderboard.length === 0 ? (
                  <p className="text-center font-bold text-xs opacity-50 py-4">No ranked players yet.</p>
                ) : leaderboard.map((l) => (
                  <div key={l.rank} className={cn(
                    "flex items-center justify-between p-3 border-2 border-black neo-brutalism-shadow-sm transition-all hover:-translate-x-1",
                    l.isMe ? "bg-gumroad-pink/10 border-gumroad-pink" : "bg-white",
                    l.rank === 1 ? 'bg-emerald-100' : ''
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 border-2 border-black flex items-center justify-center font-black text-xs", l.rank === 1 ? 'bg-emerald-400' : l.isMe ? 'bg-gumroad-pink' : 'bg-gray-200')}>
                        {l.rank === 1 ? '👑' : l.rank}
                      </div>
                      <span className="font-black text-sm">{l.name}</span>
                    </div>
                    <span className="font-black font-headline text-sm">{l.xp.toLocaleString()} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Cashflow Preview */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} transition={{ duration: 0.1 }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Recent Cashflow</h3>
            </div>
            <div className="mt-4 w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={cashTrackingData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 10, fontWeight: 'bold' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 10, fontWeight: 'bold' }} tickFormatter={val => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0px', border: '4px solid black', boxShadow: '4px 4px 0px 0px #000', fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{ fill: '#fcd400' }}
                  />
                  <Bar dataKey="income" fill="#ff90e8" radius={[0, 0, 0, 0]} barSize={12} stroke="#000" strokeWidth={2} />
                  <Bar dataKey="expenses" fill="#000" radius={[0, 0, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Custom Date Range Trend */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} transition={{ duration: 0.1 }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 border-b-4 border-black pb-4 gap-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Financial Trend</h3>
              
              {/* Native Date Pickers */}
              <div className="flex items-center gap-2">
                 <div className="flex items-center bg-white border-4 border-black p-1 neo-brutalism-shadow-xs">
                   <CalendarDays size={16} strokeWidth={3} className="mx-2 text-black/50" />
                   <input 
                     type="date"
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                     className="bg-transparent text-xs font-black uppercase tracking-widest outline-none cursor-pointer" 
                   />
                 </div>
                 <span className="font-bold">-</span>
                 <div className="flex items-center bg-white border-4 border-black p-1 neo-brutalism-shadow-xs">
                   <input 
                     type="date"
                     value={endDate}
                     onChange={(e) => setEndDate(e.target.value)}
                     className="bg-transparent text-xs font-black uppercase tracking-widest outline-none cursor-pointer" 
                   />
                 </div>
              </div>
            </div>
            
            <div className="flex-1 w-full mt-4 h-[320px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={true} stroke="#e5e5e5" strokeWidth={2} />
                    <XAxis dataKey="name" axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={{ stroke: '#000', strokeWidth: 4 }} tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={{ stroke: '#000', strokeWidth: 4 }} tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} tickFormatter={val => `₹${Number(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0px', border: '4px solid black', boxShadow: '4px 4px 0px 0px #000', fontWeight: 'bold' }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                    />
                    <Line 
                      type="step" 
                      dataKey="income" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#000' }} 
                      activeDot={{ r: 8, strokeWidth: 4, stroke: '#000' }} 
                    />
                    <Line 
                      type="step" 
                      dataKey="expenses" 
                      stroke="#ff90e8" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#ff90e8', strokeWidth: 3, stroke: '#000' }} 
                      activeDot={{ r: 8, strokeWidth: 4, stroke: '#000' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm font-black text-black/40 uppercase tracking-widest">No activity in this period.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Categorized Expenses (Actually calculated from real data, no mock limits) */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} transition={{ duration: 0.1 }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Expense Breakdown</h3>
            </div>
            <div className="space-y-6">
              {categoryData.length > 0 ? categoryData.filter(c => c.name !== 'Salary').map(b => (
                <div key={b.name}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black font-label uppercase tracking-widest text-black">{b.name}</span>
                    <span className="text-xs font-bold text-black border-b-2 border-black">₹{b.value.toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-white border-4 border-black h-4 rounded-none overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((b.value / Math.max(stats.expenses, 1)) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full border-r-4 border-black"
                      style={{ backgroundColor: b.color || '#ffbd03' }} 
                    />
                  </div>
                </div>
              )) : (
                 <p className="text-sm font-bold text-black text-center py-2">No expenses recorded yet.</p>
              )}
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} transition={{ duration: 0.1 }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Recent Transactions</h3>
              <div className="flex gap-4 text-black">
                <Search size={20} strokeWidth={3} className="cursor-pointer hover:text-gumroad-pink" onClick={() => setActiveTab?.('transactions')} />
                <Filter size={20} strokeWidth={3} className="cursor-pointer hover:text-gumroad-pink" onClick={() => setActiveTab?.('transactions')} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-black font-label uppercase tracking-widest text-black bg-gumroad-yellow inline-block px-2 py-1 border-2 border-black mb-2">History</h4>
              <div className="space-y-4">
                {transactions.slice(0, 5).map(t => (
                  <motion.div 
                    key={t.id} 
                    whileHover={{ x: 4 }} 
                    transition={{ duration: 0.1 }}
                    className="flex items-center justify-between p-4 border-4 border-black hover:bg-gumroad-pink transition-colors group cursor-pointer neo-brutalism-shadow-sm bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center text-2xl font-black font-headline text-black">
                        {t.vendor.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xl font-black font-headline text-black uppercase">{t.vendor}</p>
                        <p className="text-xs font-bold text-black border-b-2 border-transparent group-hover:border-black inline-block mt-1">
                          {new Date(t.date || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-8">
                      <span className="hidden sm:flex items-center gap-2 text-xs font-bold text-black border-2 border-black px-2 py-1 bg-white">
                        <div className="w-2 h-2 rounded-none border border-black" style={{backgroundColor: CATEGORY_COLORS[t.category] || '#ffbd03'}}></div> {t.category.toUpperCase()}
                      </span>
                      <span className={cn(
                        "text-xl font-black w-28 text-right font-headline",
                        t.type === 'income' ? 'text-emerald-500' : 'text-black'
                      )}>
                        {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                      <CreditCard size={24} strokeWidth={3} className="text-transparent group-hover:text-black transition-colors" />
                    </div>
                  </motion.div>
                ))}
                {transactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-sm font-black text-black text-center mb-4 uppercase tracking-widest">No history found.</p>
                    <button 
                      onClick={() => setActiveTab?.('transactions')}
                      className="neo-stacked-hover btn-rounded bg-gumroad-yellow text-black border-4 border-black px-6 py-3 text-sm font-headline font-black uppercase transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus size={18} strokeWidth={3} /> Log First Expense
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
