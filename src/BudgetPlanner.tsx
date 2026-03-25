import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { cn } from './utils';

export default function BudgetPlanner() {
  const [income, setIncome] = useState(50000);

  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Budget Planner</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Master the 50/30/20 Rule</p>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden">
        <div className="p-8 space-y-6 grid-bg">
          <div>
            <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Monthly Take-Home Income (₹)</label>
            <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-yellow/10 transition-colors" />
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
