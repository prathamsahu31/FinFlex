import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, FileText, Tag, Search, Filter, Loader2, Clock, Trash2 } from 'lucide-react';
import { cn } from './utils';
import { supabase } from './lib/supabase';
import DataEntryModal from './DataEntryModal';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        if (user) {
          fetchTransactions(user.id);
        } else {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchTransactions = async (userId?: string) => {
    if (!supabase) return;
    const uid = userId || user?.id;
    if (!uid) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipeToTag = async (id: string, currentIsGig: boolean) => {
    if (!supabase) return;
    
    // Optimistic update
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, is_gig: !currentIsGig } : t
    ));

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_gig: !currentIsGig })
        .eq('id', id);
        
      if (error) {
        // Revert on error
        setTransactions(prev => prev.map(t => 
          t.id === id ? { ...t, is_gig: currentIsGig } : t
        ));
        throw error;
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    // Optimistic update
    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) {
        // Fetch again on error to restore
        fetchTransactions();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleUpdateCustomTag = async (id: string, newTag: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ custom_tag: newTag })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating custom tag:', error);
    }
  };

  const handleTagChangeLocal = (id: string, newTag: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, custom_tag: newTag } : t
    ));
  };

  const filteredTransactions = transactions.filter(t => 
    t.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.custom_tag && t.custom_tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and tag your expenses</p>
        </div>
        
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsDataEntryOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            Data Entry +
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-lg text-sm transition-all outline-none"
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
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12 text-slate-400">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No transactions found. Click "Data Entry +" to add some.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              <AnimatePresence>
                {filteredTransactions.map((t) => (
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
                      {t.is_gig ? 'Remove Tag' : 'Tag as Gig-Economy'}
                    </div>

                    {/* Draggable surface */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={{ left: 0, right: 0.5 }}
                      onDragEnd={(e, info) => {
                        if (info.offset.x > 100) {
                          handleSwipeToTag(t.id, t.is_gig);
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
                            {t.vendor}
                            {t.is_gig && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                                <Tag size={10} /> Gig
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={12} />
                              {new Date(t.created_at || t.date).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                            <span className="text-slate-300">•</span>
                            <input
                              type="text"
                              value={t.custom_tag || ''}
                              onChange={(e) => handleTagChangeLocal(t.id, e.target.value)}
                              onBlur={(e) => handleUpdateCustomTag(t.id, e.target.value)}
                              placeholder="Add custom tag..."
                              className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 border-transparent focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all w-28 placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "font-bold",
                          t.type === 'income' ? "text-emerald-600" : "text-slate-900"
                        )}>
                          {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      <DataEntryModal 
        isOpen={isDataEntryOpen} 
        onClose={() => setIsDataEntryOpen(false)} 
        onSuccess={() => fetchTransactions()} 
      />
    </div>
  );
}
