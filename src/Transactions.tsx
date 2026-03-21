import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Plus, FileText, Tag, CheckCircle2, Search, Filter } from 'lucide-react';
import { cn } from './utils';

const INITIAL_TRANSACTIONS = [
  { id: 1, date: 'Today, 08:55', merchant: 'Amazon', category: 'Shopping', amount: -150.00, isGig: false },
  { id: 2, date: 'Today, 09:45', merchant: 'Food Market', category: 'Food & Dining', amount: -79.00, isGig: false },
  { id: 3, date: 'Yesterday, 15:55', merchant: 'Uber', category: 'Transport', amount: -24.50, isGig: false },
  { id: 4, date: 'Yesterday, 18:30', merchant: 'Upwork Escrow', category: 'Income', amount: 450.00, isGig: false },
  { id: 5, date: 'Jan 26, 12:00', merchant: 'Adobe Creative Cloud', category: 'Software', amount: -54.99, isGig: false },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [isUploading, setIsUploading] = useState(false);

  const handleSwipeToTag = (id: number) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isGig: !t.isGig } : t
    ));
  };

  const handleMockUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setTransactions([{
        id: Date.now(),
        date: 'Just now',
        merchant: 'Home Depot (Scanned)',
        category: 'Supplies',
        amount: -124.50,
        isGig: false
      }, ...transactions]);
    }, 2000);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and tag your expenses</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleMockUpload}
            disabled={isUploading}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isUploading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} />}
            {isUploading ? 'Scanning...' : 'Scan Receipt'}
          </button>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors">
            <Plus size={18} />
            Manual Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-lg text-sm transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="p-0">
          <div className="bg-slate-50 px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between">
            <span>Transaction</span>
            <span className="hidden sm:block">Swipe right to tag as Gig-Economy</span>
          </div>
          
          <ul className="divide-y divide-slate-100">
            <AnimatePresence>
              {transactions.map((t) => (
                <motion.li 
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group overflow-hidden bg-white"
                >
                  {/* Background for swipe action */}
                  <div className="absolute inset-0 bg-indigo-500 flex items-center px-6 text-white font-medium">
                    <Tag size={20} className="mr-2" />
                    {t.isGig ? 'Remove Tag' : 'Tag as Gig-Economy'}
                  </div>

                  {/* Draggable surface */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: 0, right: 0.5 }}
                    onDragEnd={(e, info) => {
                      if (info.offset.x > 100) {
                        handleSwipeToTag(t.id);
                      }
                    }}
                    className="relative bg-white px-6 py-4 flex items-center justify-between cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 flex items-center gap-2">
                          {t.merchant}
                          {t.isGig && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                              <Tag size={10} /> Gig
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500">{t.date} â€¢ {t.category}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-bold",
                      t.amount > 0 ? "text-emerald-600" : "text-slate-900"
                    )}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </div>
                  </motion.div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </div>
  );
}
