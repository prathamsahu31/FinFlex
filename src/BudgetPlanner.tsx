import { useState, useEffect } from 'react';
import { IndianRupee, Save, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

export default function BudgetPlanner() {
  const [income, setIncome] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchIncome = async () => {
      if (!supabase) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setIsLoading(false);
          return;
        }
        
        const { data } = await supabase.from('profiles').select('monthly_income').eq('id', user.id).single();
        if (data && isMounted) setIncome(data.monthly_income || 0);
      } catch (err) {
        console.error('BudgetPlanner fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => { if (isMounted) setIsLoading(false); }, 5000);
    fetchIncome().finally(() => clearTimeout(timeoutId));

    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, []);

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase.from('profiles').update({ monthly_income: income }).eq('id', user.id);
      if (error) throw error;
      alert('Budget baseline saved!');
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-20"><Loader2 className="animate-spin text-black" size={40} /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Budget Planner</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Master the 50/30/20 Rule</p>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden">
        <div className="p-8 space-y-6 grid-bg">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Monthly Take-Home Income (₹)</label>
              <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="h-[52px] px-6 bg-black text-white border-4 border-black neo-brutalism-shadow-xs font-black uppercase text-xs hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={3} />}
              Save
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Needs (50%)', desc: 'Rent, food, utilites, bills', val: needs, color: 'bg-gumroad-pink' },
              { label: 'Wants (30%)', desc: 'Dining out, shopping, hobbies', val: wants, color: 'bg-gumroad-yellow' },
              { label: 'Savings/Debt (20%)', desc: 'Investments, emergency fund', val: savings, color: 'bg-white' },
            ].map((cat, i) => (
              <div key={i} className={cn("p-6 border-4 border-black flex justify-between items-center neo-brutalism-shadow-xs", cat.color)}>
                <div>
                  <p className="font-black font-headline text-xl text-black uppercase">{cat.label}</p>
                  <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-1">{cat.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-black">₹</span>
                  <p className="text-2xl font-black font-headline text-black">{cat.val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
