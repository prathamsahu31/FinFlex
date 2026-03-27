import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Trash2, Tag, ShoppingBag, Terminal, Wallet, Banknote, DollarSign, Calendar, Calculator, Plus, X, Loader2, FileText, Clock } from 'lucide-react';
import { cn } from './utils';
import { supabase } from './lib/supabase';
import { TabComponentProps } from './constants';
import DataEntryModal from './DataEntryModal';

export default function Transactions({ setActiveTab, user }: TabComponentProps & { user: any }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!user);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTransactions(user.id);
    } else if (supabase) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [user]);

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

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.custom_tag && t.custom_tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Transactions</h1>
          <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3">Manage and tag your expenses</p>
        </div>
        
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
            onClick={() => setIsDataEntryOpen(true)}
            className="flex items-center gap-2 bg-gumroad-pink text-black px-6 py-3 border-4 border-black neo-brutalism-shadow font-headline font-black uppercase tracking-widest cursor-pointer transition-all"
          >
            <Plus size={18} strokeWidth={3} />
            Data Entry +
          </motion.button>
        </div>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden">
        <div className="p-4 border-b-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gumroad-yellow/10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} strokeWidth={3} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..." 
              className="w-full pl-10 pr-4 py-3 bg-white border-4 border-black focus:bg-gumroad-yellow/10 outline-none font-bold placeholder:text-black/50"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={cn(
                "flex items-center gap-2 text-black border-4 border-black px-4 py-2 font-black uppercase text-xs neo-brutalism-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer",
                filterCategory !== 'all' ? 'bg-gumroad-pink' : 'bg-white'
              )}
            >
              <Filter size={16} strokeWidth={3} /> {filterCategory === 'all' ? 'Filter' : filterCategory}
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-white border-4 border-black neo-brutalism-shadow-lg z-50 min-w-[200px]">
                {['all', 'Shopping', 'Transport', 'Food & Dining', 'Rent & Bills', 'Entertainment', 'Other', 'Salary'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilterCategory(cat); setShowFilterDropdown(false); }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 border-black last:border-b-0 hover:bg-gumroad-yellow transition-colors cursor-pointer",
                      filterCategory === cat && 'bg-gumroad-pink'
                    )}
                  >
                    {cat === 'all' ? '✕ Clear Filter' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-0">
          <div className="bg-black px-6 py-3 text-xs font-black text-white uppercase tracking-widest flex justify-between">
            <span>Transaction</span>
            <span className="hidden sm:block">Swipe right to tag as Gig-Economy</span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12 text-black">
              <Loader2 className="animate-spin" size={32} strokeWidth={3} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-black font-bold">
              No transactions found. Click "Data Entry +" to add some.
            </div>
          ) : (
            <motion.ul 
              initial="hidden"
              animate="show"
              variants={{
                show: { transition: { staggerChildren: 0.05 } }
              }}
              className="divide-y-4 divide-black"
            >
              <AnimatePresence>
                {filteredTransactions.map((t) => (
                  <motion.li 
                    key={t.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      show: { opacity: 1, x: 0 }
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative group overflow-hidden bg-white"
                  >
                    {/* Background for swipe action */}
                    <div className="absolute inset-0 bg-gumroad-yellow flex items-center px-6 text-black font-black border-b-4 border-black">
                      <Tag size={20} className="mr-2" strokeWidth={3} />
                      {t.is_gig ? 'REMOVE TAG' : 'TAG AS GIG-ECONOMY'}
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
                      className="relative bg-white px-6 py-5 flex items-center justify-between cursor-grab active:cursor-grabbing border-b-4 border-black last:border-b-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black shrink-0 neo-brutalism-shadow-sm">
                          <FileText size={24} strokeWidth={3} />
                        </div>
                        <div>
                          <p className="font-black font-headline text-xl text-black flex items-center gap-3 uppercase">
                            {t.vendor}
                            {t.is_gig && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 border-2 border-black text-[10px] font-black bg-gumroad-yellow text-black uppercase tracking-widest neo-brutalism-shadow-xs">
                                <Tag size={10} strokeWidth={3} /> Gig
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-black font-bold flex items-center gap-1 uppercase tracking-tighter">
                              <Clock size={12} strokeWidth={3} />
                              {new Date(t.created_at || t.date).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                            <input
                              type="text"
                              value={t.custom_tag || ''}
                              onChange={(e) => handleTagChangeLocal(t.id, e.target.value)}
                              onBlur={(e) => handleUpdateCustomTag(t.id, e.target.value)}
                              placeholder="Add custom tag..."
                              className="text-xs px-3 py-1 bg-white border-2 border-black font-bold text-black focus:bg-gumroad-pink/20 outline-none w-36 placeholder:text-black/40"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "font-black font-headline text-2xl",
                          t.type === 'income' ? "text-emerald-600" : "text-black"
                        )}>
                          {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </div>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="w-10 h-10 border-2 border-black bg-white hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors neo-brutalism-shadow-sm cursor-pointer"
                        >
                          <Trash2 size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </motion.div>
                  </motion.li>

                ))}
              </AnimatePresence>
            </motion.ul>
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
