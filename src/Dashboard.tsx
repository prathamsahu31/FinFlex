import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  CreditCard, 
  Wallet, 
  Plus, 
  ChevronDown, 
  Search, 
  Filter,
  Calendar,
  Briefcase,
  Loader2
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
  YAxis,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';
import CountUp from './CountUp';

interface DashboardProps extends TabComponentProps {
  user: any;
  profile: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
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

const MOCK_BUDGETS: Record<string, number> = {
  'Food & Dining': 500,
  'Shopping': 300,
  'Transport': 150,
  'Rent & Bills': 1200,
  'Entertainment': 200,
  'Other': 100
};

export default function Dashboard({ setActiveTab, user }: DashboardProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!user);
  const [trendRange, setTrendRange] = useState<'month' | '3months' | 'all'>('month');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!supabase || !user) {
        if (!user) setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
      setIsLoading(false);
    };
    
    fetchTransactions();
  }, []);

  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    
    transactions.forEach(t => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'expense') expenses += Number(t.amount);
    });

    const balance = income - expenses;
    const netSavingsRate = income > 0 ? (balance / income) * 100 : 0;

    return { income, expenses, balance, netSavingsRate };
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

  const budgetProgress = useMemo(() => {
    return categoryData.filter(c => c.name !== 'Salary').map(cat => {
      const target = MOCK_BUDGETS[cat.name] || 500;
      const percent = Math.min((cat.value / target) * 100, 100);
      const isOver = cat.value > target;
      return { ...cat, target, percent, isOver };
    });
  }, [categoryData]);

  const trendDataAll = useMemo(() => {
    const map = new Map<string, { income: number, expenses: number }>();
    transactions.forEach(t => {
      const dateObj = new Date(t.date || t.created_at);
      const key = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!map.has(key)) map.set(key, { income: 0, expenses: 0 });
      const current = map.get(key)!;
      
      if (t.type === 'income') current.income += Number(t.amount);
      if (t.type === 'expense') current.expenses += Number(t.amount);
    });
    
    return Array.from(map.entries()).reverse().map(([name, vals]) => ({
      name,
      income: vals.income,
      expenses: vals.expenses
    }));
  }, [transactions]);

  const trendData = useMemo(() => {
    if (trendRange === 'all') return trendDataAll;
    if (trendRange === '3months') return trendDataAll.slice(-42);
    return trendDataAll.slice(-14);
  }, [trendDataAll, trendRange]);

  const cashTrackingData = trendData.slice(-7); // Just use the last 7 items from trendData for cash tracking mock

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1400px] mx-auto space-y-8"
    >
      
      {/* Top Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-gumroad-pink border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Total Balance</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2">
            <CountUp value={stats.balance} prefix="$" decimals={2} />
          </h2>
          <span className="flex items-center text-black text-xs font-bold bg-white border-2 border-black px-2 py-1 w-max neo-brutalism-shadow">
            <TrendingUp size={16} className="mr-2" strokeWidth={3}/> ALL TIME
          </span>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Income</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2">
            <CountUp value={stats.income} prefix="$" decimals={2} />
          </h2>
          <p className="text-black font-bold text-xs">All incoming transfers</p>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Expenses</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2">
            <CountUp value={stats.expenses} prefix="$" decimals={2} />
          </h2>
          <p className="text-black font-bold text-xs">Bills & daily spend</p>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-gumroad-yellow border-4 border-black p-6 text-black neo-brutalism-shadow cursor-pointer transition-all">
          <p className="text-black font-black font-label text-xs uppercase tracking-widest mb-2 border-b-2 border-black pb-2 inline-block">Net Savings Rate</p>
          <h2 className="text-4xl font-black font-headline mb-2 mt-2">
            <CountUp value={stats.netSavingsRate} suffix="%" decimals={1} />
          </h2>
          <p className="text-black font-bold text-xs">Of total income saved</p>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-8">
          {/* Investment Portfolio */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Portfolio</h3>
              <div className="flex gap-3 text-black">
                <Briefcase size={20} strokeWidth={3} className="cursor-pointer hover:text-gumroad-pink" onClick={() => setActiveTab?.('portfolio')} />
                <MoreVertical size={20} strokeWidth={3} className="cursor-pointer hover:text-gumroad-pink" onClick={() => alert('More options coming soon!')} />
              </div>
            </div>
            
            <div className="h-44 bg-black border-4 border-black text-white p-5 cursor-pointer hover:bg-zinc-900 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gumroad-pink/20 blur-2xl -mr-10 -mt-10 group-hover:bg-gumroad-pink/40 transition-colors"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-black font-label uppercase tracking-widest">Total Value</span>
                  <span className="text-xs font-black text-black bg-gumroad-yellow px-2 py-1 border-2 border-white">+8.4% YTD</span>
                </div>
                <div>
                  <h4 className="text-3xl font-black font-headline tracking-tight mt-2">$84,500.00</h4>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-xs font-bold uppercase tracking-widest">S&P 500 ETF (VOO)</span>
                    <span className="text-xs font-black">65%</span>
                  </div>
                  <div className="w-full bg-zinc-800 border-2 border-white h-3 mt-2 rounded-none">
                    <div className="bg-gumroad-pink h-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cash Tracking */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Cashflow</h3>
              <MoreVertical size={20} className="text-black cursor-pointer hover:text-gumroad-pink" strokeWidth={3} onClick={() => alert('Cashflow details coming soon!')} />
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashTrackingData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 10, fontWeight: 'bold' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#000', fontSize: 10, fontWeight: 'bold' }} tickFormatter={val => `$${val}`} />
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

          {/* Category Budgets */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Budgets</h3>
              <MoreVertical size={20} className="text-black cursor-pointer hover:text-gumroad-pink" strokeWidth={3} onClick={() => alert('Budget customization coming soon!')} />
            </div>
            <div className="space-y-6">
              {budgetProgress.map(b => (
                <div key={b.name}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black font-label uppercase tracking-widest text-black">{b.name}</span>
                    <span className="text-xs font-bold text-black border-b-2 border-black">${b.value.toFixed(0)} / ${b.target}</span>
                  </div>
                  <div className="w-full bg-white border-4 border-black h-4 rounded-none overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${b.percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full border-r-4 border-black", b.isOver ? "bg-error" : "")} 
                      style={{ backgroundColor: b.isOver ? undefined : (b.color === '#60a5fa' || b.color === '#94a3b8' || b.color === '#cbd5e1' ? '#ffbd03' : b.color) }} 
                    />
                  </div>
                </div>
              ))}
              {budgetProgress.length === 0 && <p className="text-sm font-bold text-black text-center py-2">No expenses yet.</p>}
            </div>
          </motion.div>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Monthly Trend */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
              <h3 className="font-black font-headline text-xl uppercase tracking-tight text-black">Monthly Trend</h3>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTrendRange(prev => prev === 'month' ? '3months' : prev === '3months' ? 'all' : 'month')}
                className="flex items-center gap-2 text-xs font-black font-label uppercase tracking-widest text-black bg-gumroad-yellow hover:bg-gumroad-pink px-4 py-2 border-4 border-black neo-brutalism-shadow transition-colors cursor-pointer"
              >
                {trendRange === 'month' ? 'THIS MONTH' : trendRange === '3months' ? 'LAST 3 MO' : 'ALL TIME'} <ChevronDown size={16} strokeWidth={3} />
              </motion.button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" vertical={true} stroke="#e5e5e5" strokeWidth={2} />
                  <XAxis dataKey="name" axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={{ stroke: '#000', strokeWidth: 4 }} tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={{ stroke: '#000', strokeWidth: 4 }} tickLine={{ stroke: '#000', strokeWidth: 4 }} tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} tickFormatter={val => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0px', border: '4px solid black', boxShadow: '4px 4px 0px 0px #000', fontWeight: 'bold' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
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
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div whileHover={{ x: 2, y: 2, boxShadow: 'none' }} className="bg-white border-4 border-black p-6 neo-brutalism-shadow transition-all">
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
                  <motion.div key={t.id} whileHover={{ x: 4 }} className="flex items-center justify-between p-4 border-4 border-black hover:bg-gumroad-pink transition-colors group cursor-pointer neo-brutalism-shadow-sm bg-white">
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
                        {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </span>
                      <CreditCard size={24} strokeWidth={3} className="text-transparent group-hover:text-black transition-colors" />
                    </div>
                  </motion.div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-sm font-bold text-black p-4 text-center border-4 border-black border-dashed">No transactions yet.</p>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
