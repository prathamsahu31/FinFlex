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
import CountUp from './CountUp';

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

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
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

  const trendData = useMemo(() => {
    // Simple mock grouping for trend (e.g., last 5 days we have data for)
    // Group by date string "MMM D"
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
    })).slice(-14); // Return last 14 unique dates
  }, [transactions]);

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
      className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6 bg-slate-50/50 min-h-full"
    >
      
      {/* Top Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm cursor-pointer">
          <p className="text-indigo-100 text-sm font-medium mb-1">Total Balance</p>
          <h2 className="text-3xl font-bold mb-1">
            <CountUp value={stats.balance} prefix="₹" decimals={2} />
          </h2>
          <span className="flex items-center text-indigo-100 text-xs font-medium">
            <TrendingUp size={14} className="mr-1"/> All Time
          </span>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer">
          <div className="flex justify-between items-start mb-1">
            <p className="text-slate-500 text-sm font-medium">Income</p>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">
            <CountUp value={stats.income} prefix="₹" decimals={2} />
          </h2>
          <p className="text-slate-400 text-xs">All incoming transfers & salary</p>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer">
          <div className="flex justify-between items-start mb-1">
            <p className="text-slate-500 text-sm font-medium">Expenses</p>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">
            <CountUp value={stats.expenses} prefix="₹" decimals={2} />
          </h2>
          <p className="text-slate-400 text-xs">Bills, shopping & daily spend</p>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer">
          <div className="flex justify-between items-start mb-1">
            <p className="text-slate-500 text-sm font-medium">Net Savings Rate</p>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">
            <CountUp value={stats.netSavingsRate} suffix="%" decimals={1} />
          </h2>
          <p className="text-slate-400 text-xs">of total income saved</p>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Investment Portfolio */}
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Investment Portfolio</h3>
              <div className="flex gap-2 text-slate-400">
                <Briefcase size={16} className="cursor-pointer hover:text-slate-600" />
                <MoreVertical size={16} className="cursor-pointer hover:text-slate-600" />
              </div>
            </div>
            <div className="relative h-40 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl -ml-10 -mb-10"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium opacity-90">Total Value</span>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">+8.4% YTD</span>
                </div>
                <div>
                  <h4 className="text-2xl font-bold tracking-tight">$84,500.00</h4>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-xs opacity-80">S&P 500 ETF (VOO)</span>
                    <span className="text-xs font-medium opacity-90">65%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1.5">
                    <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cash Tracking */}
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Cash Tracking</h3>
              <MoreVertical size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashTrackingData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={val => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} barSize={8} />
                  <Bar dataKey="expenses" fill="#64748b" radius={[2, 2, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Future Transactions */}
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Future Transactions</h3>
              <MoreVertical size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <div className="space-y-4 mb-5">
              <div className="flex items-center justify-between hover:bg-slate-50 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">A</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Adobe</p>
                    <p className="text-[11px] text-slate-400">Jan 28, 20:01</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">$100.00</span>
              </div>
              <div className="flex items-center justify-between hover:bg-slate-50 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">in</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">LinkedIn</p>
                    <p className="text-[11px] text-slate-400">Jan 29, 00:01</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">$8.00</span>
              </div>
              <div className="flex items-center justify-between hover:bg-slate-50 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black text-red-600 flex items-center justify-center font-bold text-lg">N</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Netflix</p>
                    <p className="text-[11px] text-slate-400">Jan 30, 00:01</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">$10.00</span>
              </div>
              <div className="flex items-center justify-between hover:bg-slate-50 p-2 -mx-2 rounded-xl cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">U</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">Unreal Subscription</p>
                    <p className="text-[11px] text-slate-400">Feb 1, 00:01</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">$156.00</span>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 border border-slate-200 text-indigo-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <Plus size={16} /> Add Reminder
            </motion.button>
          </motion.div>

          {/* Category Budgets */}
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Category Budgets</h3>
              <MoreVertical size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <div className="space-y-4">
              {budgetProgress.map(b => (
                <div key={b.name}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-slate-700">{b.name}</span>
                    <span className="text-[10px] text-slate-500">${b.value.toFixed(0)} / ${b.target}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${b.percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-1.5 rounded-full", b.isOver ? "bg-red-500" : "")} 
                      style={{ backgroundColor: b.isOver ? undefined : b.color }}
                    />
                  </div>
                </div>
              ))}
              {budgetProgress.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No expenses yet.</p>}
            </div>
          </motion.div>
        </div>

        {/* Right Side (spans 9 columns) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Monthly Trend */}
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800">Monthly Trend</h3>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-100 transition-colors"
              >
                This Month <ChevronDown size={14} />
              </motion.button>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={val => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 7, strokeWidth: 0 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#64748b" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#64748b', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 7, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bottom Row of Right Side */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Recent Transactions */}
            <motion.div whileHover={{ scale: 1.01 }} className="md:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
                <div className="flex gap-3 text-slate-400">
                  <Search size={16} className="cursor-pointer hover:text-slate-600" />
                  <Filter size={16} className="cursor-pointer hover:text-slate-600" />
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">All Recent</h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map(t => (
                      <motion.div key={t.id} whileHover={{ x: 4 }} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl font-serif text-slate-700">
                            {t.vendor.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{t.vendor}</p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(t.date || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-8">
                          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 w-24">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: CATEGORY_COLORS[t.category] || '#94a3b8'}}></div> {t.category}
                          </span>
                          <span className={cn(
                            "text-sm font-semibold w-24 text-right",
                            t.type === 'income' ? 'text-emerald-500' : 'text-slate-800'
                          )}>
                            {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </span>
                          <CreditCard size={16} className="text-slate-300 group-hover:text-slate-400" />
                        </div>
                      </motion.div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-sm text-slate-500 p-4 text-center">No transactions yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Spending by Category */}
            <motion.div whileHover={{ scale: 1.01 }} className="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-800">Spending by Category</h3>
                <MoreVertical size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
              </div>
              
              <div className="flex-1 min-h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-2">
                {categoryData.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-[11px] text-slate-500 truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
          </div>
        </div>
      </div>
    </motion.div>
  );
}
