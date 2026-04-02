import { useState, useEffect } from 'react';
import { Loader2, Repeat, IndianRupee, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

export default function SubscriptionTracker({ user }: { user: any }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [manualSubs, setManualSubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', price: '', cycle: 'Monthly' });

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase || !user) return;
      setIsLoading(true);

      // 1. Fetch transactions for auto-detection
      const { data: txData } = await supabase.from('transactions')
        .select('vendor, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense');
      
      if (txData) {
        const vendorCounts = new Map<string, number>();
        const vendorAmounts = new Map<string, number>();
        
        txData.forEach(t => {
          vendorCounts.set(t.vendor, (vendorCounts.get(t.vendor) || 0) + 1);
          vendorAmounts.set(t.vendor, Number(t.amount));
        });
        
        const commonSubs = ['netflix', 'spotify', 'amazon', 'gym', 'hulu', 'disney+', 'apple', 'adobe', 'youtube', 'canva', 'figma'];
        
        const detected = Array.from(vendorCounts.entries())
          .filter(([name, count]) => {
             const lowerName = name.toLowerCase();
             return count > 1 || commonSubs.some(sub => lowerName.includes(sub));
          })
          .map(([name, count]) => ({
             id: `auto-${name}`,
             name, 
             price: vendorAmounts.get(name) || 0,
             cycle: 'Monthly',
             isAuto: true
          }));
          
        setSubs(detected);
      }

      // 2. Fetch manual subscriptions from DB
      const { data: mData } = await supabase.from('manual_subscriptions').select('*').eq('user_id', user.id);
      if (mData) {
        setManualSubs(mData.map(m => ({ ...m, isAuto: false })));
      }

      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    const { data, error } = await supabase.from('manual_subscriptions').insert([{
      user_id: user.id,
      name: newSub.name,
      price: parseFloat(newSub.price),
      billing_cycle: newSub.cycle
    }]).select();

    if (!error && data) {
      setManualSubs([{ ...data[0], isAuto: false }, ...manualSubs]);
      setIsModalOpen(false);
      setNewSub({ name: '', price: '', cycle: 'Monthly' });
    }
  };

  const handleDeleteManual = async (id: string) => {
    if (!supabase) return;
    await supabase.from('manual_subscriptions').delete().eq('id', id);
    setManualSubs(manualSubs.filter(m => m.id !== id));
  };

  const allSubs = [...subs, ...manualSubs];
  const total = allSubs.reduce((acc, sub) => acc + (Number(sub.price) || 0), 0);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white border-b-4 border-black pb-4">
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Subscriptions</h1>
          <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Auto-detected & manual recurring payments</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-4 py-2 border-4 border-black neo-brutalism-shadow font-black uppercase text-xs hover:translate-x-1 hover:-translate-y-1 transition-all cursor-pointer"
        >
          Add Custom +
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 border-4 border-black bg-white flex items-center justify-center neo-brutalism-shadow">
          <Loader2 className="animate-spin text-black" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-black border-4 border-black p-8 neo-brutalism-shadow text-center text-white">
            <p className="text-xs font-black uppercase tracking-widest mb-2 border-b-2 border-white pb-1 inline-block">Total Monthly Burn</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-black text-gumroad-pink">₹</span>
              <h3 className="text-4xl font-black font-headline tracking-tighter text-gumroad-pink">{total.toFixed(2)}</h3>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-60">Smart detection active</p>
          </div>
          
          <div className="space-y-4">
            {allSubs.length === 0 && <p className="text-black font-bold text-sm text-center py-12 border-4 border-black border-dashed bg-white">No subscriptions detected yet. Add some custom ones!</p>}
            {allSubs.map((sub, i) => (
              <div key={sub.id || i} className="flex justify-between items-center p-5 border-4 border-black bg-white hover:bg-gumroad-yellow transition-all neo-brutalism-shadow-xs group">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 border-4 border-black flex items-center justify-center text-black", sub.isAuto ? "bg-gumroad-pink" : "bg-gumroad-yellow")}>
                    <Repeat size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black font-headline text-xl text-black uppercase">{sub.name}</p>
                      {sub.isAuto && <span className="text-[8px] bg-black text-white px-2 py-0.5 font-black uppercase">Auto</span>}
                    </div>
                    <p className="text-xs font-black text-black/60 uppercase tracking-widest">{sub.cycle || sub.billing_cycle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1 text-right">
                    <span className="text-lg font-black">₹</span>
                    <p className="text-2xl font-black font-headline text-black group-hover:scale-110 transition-transform">{(Number(sub.price) || 0).toFixed(2)}</p>
                  </div>
                  {!sub.isAuto && (
                    <button 
                      onClick={() => handleDeleteManual(sub.id)}
                      className="w-10 h-10 border-2 border-black bg-white hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors neo-brutalism-shadow-xs cursor-pointer group-hover:translate-x-0"
                    >
                      <Trash2 size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-black max-w-md w-full neo-brutalism-shadow-lg overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gumroad-yellow">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tighter text-black">New Subscription</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 border-4 border-black bg-white hover:bg-gumroad-pink flex items-center justify-center text-black cursor-pointer transition-colors">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              <form onSubmit={handleAddManual} className="p-8 space-y-6 grid-bg">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Subscription Name</label>
                  <input required type="text" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} className="w-full px-4 py-3 border-4 border-black bg-white focus:bg-gumroad-pink/10 font-bold outline-none transition-all placeholder:text-black/30" placeholder="e.g. Gym, Rent, ICICI Insurance" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Price (₹)</label>
                  <input required type="number" step="0.01" value={newSub.price} onChange={e => setNewSub({...newSub, price: e.target.value})} className="w-full px-4 py-3 border-4 border-black bg-white focus:bg-gumroad-pink/10 font-bold outline-none transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Billing Cycle</label>
                  <select value={newSub.cycle} onChange={e => setNewSub({...newSub, cycle: e.target.value})} className="w-full px-4 py-3 border-4 border-black bg-white focus:bg-gumroad-pink/10 font-bold outline-none transition-all">
                    <option>Monthly</option>
                    <option>Yearly</option>
                    <option>Quarterly</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-4 bg-gumroad-pink text-black font-black uppercase tracking-widest text-xs border-4 border-black neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Track Subscription</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
