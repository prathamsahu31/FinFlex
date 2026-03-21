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
  Briefcase
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

const trendData = [
  { name: 'Jan 1', income: 1000, expenses: 200 },
  { name: 'Jan 7', income: 7500, expenses: 3500 },
  { name: 'Jan 14', income: 5000, expenses: 2000 },
  { name: 'Jan 21', income: 8000, expenses: 5800 },
  { name: 'Jan 28', income: 9000, expenses: 3000 },
];

const cashTrackingData = [
  { name: 'Mon', income: 400, expenses: 240 },
  { name: 'Tue', income: 300, expenses: 139 },
  { name: 'Wed', income: 200, expenses: 980 },
  { name: 'Thu', income: 278, expenses: 390 },
  { name: 'Fri', income: 189, expenses: 480 },
  { name: 'Sat', income: 239, expenses: 380 },
  { name: 'Sun', income: 349, expenses: 430 },
];

const categoryData = [
  { name: 'Shopping', value: 35, color: '#1e293b' },
  { name: 'Transport', value: 15, color: '#e2e8f0' },
  { name: 'Other', value: 10, color: '#93c5fd' },
  { name: 'Rent & Bills', value: 25, color: '#60a5fa' },
  { name: 'Food & Dining', value: 10, color: '#1d4ed8' },
  { name: 'Entertainment', value: 5, color: '#cbd5e1' },
];

export default function Dashboard() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6 bg-slate-50/50 min-h-full">
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-indigo-100 text-sm font-medium mb-1">Total Balance</p>
          <h2 className="text-3xl font-bold mb-1">$120,435.00</h2>
          <span className="flex items-center text-indigo-100 text-xs font-medium">
            <TrendingUp size={14} className="mr-1"/> +2.5%
          </span>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-slate-500 text-sm font-medium">Income</p>
            <span className="flex items-center text-emerald-500 text-xs font-medium">
              <TrendingUp size={14} className="mr-1"/> +1.2%
            </span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">$45,200.00</h2>
          <p className="text-slate-400 text-xs">All incoming transfers & salary</p>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-slate-500 text-sm font-medium">Expenses</p>
            <span className="flex items-center text-rose-500 text-xs font-medium">
              <TrendingDown size={14} className="mr-1"/> -0.8%
            </span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">$24,500.00</h2>
          <p className="text-slate-400 text-xs">Bills, shopping & daily spend</p>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-1">
            <p className="text-slate-500 text-sm font-medium">Net Savings</p>
            <span className="flex items-center text-emerald-500 text-xs font-medium">
              <TrendingUp size={14} className="mr-1"/> +3.4%
            </span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">$20,700.00</h2>
          <p className="text-slate-400 text-xs">27% of income saved</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Investment Portfolio */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Investment Portfolio</h3>
              <div className="flex gap-2 text-slate-400">
                <Briefcase size={16} className="cursor-pointer hover:text-slate-600" />
                <MoreVertical size={16} className="cursor-pointer hover:text-slate-600" />
              </div>
            </div>
            <div className="relative h-40 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-4 overflow-hidden shadow-md">
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
          </div>

          {/* Cash Tracking */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
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
          </div>

          {/* Future Transactions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Future Transactions</h3>
              <MoreVertical size={16} className="text-slate-400 cursor-pointer hover:text-slate-600" />
            </div>
            <div className="space-y-4 mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">A</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Adobe</p>
                    <p className="text-[11px] text-slate-400">Jan 28, 20:01</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">$100.00</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">in</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">LinkedIn</p>
                    <p className="text-[11px] text-slate-400">Jan 29, 00:01</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">$8.00</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black text-red-600 flex items-center justify-center font-bold text-lg">N</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Netflix</p>
                    <p className="text-[11px] text-slate-400">Jan 30, 00:01</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-800">$10.00</span>
              </div>
              <div className="flex items-center justify-between">
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
            <button className="w-full py-2.5 border border-slate-200 text-indigo-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Plus size={16} /> Add Reminder
            </button>
          </div>
        </div>

        {/* Right Side (spans 9 columns) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800">Monthly Trend</h3>
              <button className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-100 transition-colors">
                This Month <ChevronDown size={14} />
              </button>
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
          </div>

          {/* Bottom Row of Right Side */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Recent Transactions */}
            <div className="md:col-span-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
                <div className="flex gap-3 text-slate-400">
                  <Search size={16} className="cursor-pointer hover:text-slate-600" />
                  <Filter size={16} className="cursor-pointer hover:text-slate-600" />
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today</h4>
                    <button className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 underline underline-offset-2">View all</button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl font-serif text-slate-700">a</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Amazon</p>
                          <p className="text-[11px] text-slate-400">Jan 28, 08:55</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 w-24">
                          <div className="w-2 h-2 rounded-full bg-slate-800"></div> Shopping
                        </span>
                        <span className="text-sm font-semibold text-slate-800 w-20 text-right">-$5,100.00</span>
                        <CreditCard size={16} className="text-slate-300 group-hover:text-slate-400" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl text-blue-500">🛒</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Food Market</p>
                          <p className="text-[11px] text-slate-400">Jan 28, 09:45</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 w-24">
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div> Food & Dining
                        </span>
                        <span className="text-sm font-semibold text-slate-800 w-20 text-right">-$79.00</span>
                        <Wallet size={16} className="text-slate-300 group-hover:text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Yesterday</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600">P</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">PayPal</p>
                          <p className="text-[11px] text-slate-400">Jan 27, 04:55</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 w-24">
                          from Don Draper
                        </span>
                        <span className="text-sm font-semibold text-emerald-500 w-20 text-right">+$129.00</span>
                        <CreditCard size={16} className="text-slate-300 group-hover:text-slate-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl text-indigo-600">🏠</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">StayBright Apartments L...</p>
                          <p className="text-[11px] text-slate-400">Jan 27, 15:55</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 w-24">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div> Rent & Bills
                        </span>
                        <span className="text-sm font-semibold text-slate-800 w-20 text-right">-$1,100.00</span>
                        <CreditCard size={16} className="text-slate-300 group-hover:text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spending by Category */}
            <div className="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col">
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
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
