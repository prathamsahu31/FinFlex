import { useState, useEffect } from 'react';
import { Loader2, Repeat, IndianRupee } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

export default function SubscriptionTracker({ user }: { user: any }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      if (!supabase || !user) return;
      
      const { data } = await supabase.from('transactions')
        .select('vendor, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense');
      
      if (data) {
        const vendorCounts = new Map<string, number>();
        const vendorAmounts = new Map<string, number>();
        
        data.forEach(t => {
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
             name, 
             price: vendorAmounts.get(name) || 0,
             cycle: 'Monthly'
          }));
          
        setSubs(detected);
      }
      setIsLoading(false);
    };
    fetchSubs();
  }, [user]);

  const total = subs.reduce((acc, sub) => acc + sub.price, 0);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Subscriptions</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Auto-detected recurring payments from your history</p>
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
            {subs.length === 0 && <p className="text-black font-bold text-sm text-center py-12 border-4 border-black border-dashed bg-white">No recurring subscriptions detected yet. Add more transactions!</p>}
            {subs.map((sub, i) => (
              <div key={i} className="flex justify-between items-center p-5 border-4 border-black bg-white hover:bg-gumroad-yellow transition-all neo-brutalism-shadow-xs group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black">
                    <Repeat size={24} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-black font-headline text-xl text-black uppercase">{sub.name}</p>
                    <p className="text-xs font-black text-black/60 uppercase tracking-widest">{sub.cycle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black">₹</span>
                  <p className="text-2xl font-black font-headline text-black group-hover:scale-110 transition-transform">{sub.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
