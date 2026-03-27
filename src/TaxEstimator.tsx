import { useState } from 'react';
import { IndianRupee } from 'lucide-react';
import { cn } from './utils';

export default function TaxEstimator() {
  const [income, setIncome] = useState(1200000);
  const [regime, setRegime] = useState('new');

  // Official Indian Income Tax Estimation (FY 2025-26 / Budget 2025)
  const calculateTax = () => {
    let tax = 0;
    if (regime === 'new') {
      // 1. Standard Deduction
      const standardDeduction = 75000;
      const netTaxableIncome = Math.max(0, income - standardDeduction);
      
      // 2. Progressive Slabs (FY 2025-26)
      if (netTaxableIncome <= 400000) tax = 0;
      else if (netTaxableIncome <= 800000) tax = (netTaxableIncome - 400000) * 0.05;
      else if (netTaxableIncome <= 1200000) tax = 20000 + (netTaxableIncome - 800000) * 0.10;
      else if (netTaxableIncome <= 1500000) tax = 60000 + (netTaxableIncome - 1200000) * 0.15;
      else if (netTaxableIncome <= 2000000) tax = 105000 + (netTaxableIncome - 1500000) * 0.20;
      else if (netTaxableIncome <= 2400000) tax = 205000 + (netTaxableIncome - 2000000) * 0.25;
      else tax = 305000 + (netTaxableIncome - 2400000) * 0.30;
      
      // 3. Rebate under Section 87A (New Regime)
      // If net taxable income <= 12,00,000, tax is Nil
      if (netTaxableIncome <= 1200000) tax = 0;
      
    } else {
      // Old Tax Regime (Approximate FY 25-26)
      const standardDeduction = 50000;
      const taxable = Math.max(0, income - standardDeduction - 150000); // 1.5L 80C assumption
      if (taxable <= 250000) tax = 0;
      else if (taxable <= 500000) tax = (taxable - 250000) * 0.05;
      else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
      else tax = 112500 + (taxable - 1000000) * 0.30;
    }
    return tax + (tax * 0.04); // Including 4% Cess
  };

  const estimatedTax = calculateTax();
  const takeHome = income - estimatedTax;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Tax Estimator</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Estimate your Indian Income Tax balance (FY 2024-25)</p>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden">
        <div className="p-8 space-y-6 grid-bg">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Annual Gross Income (₹)</label>
              <input type="number" value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Tax Regime</label>
              <select value={regime} onChange={e => setRegime(e.target.value)} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors appearance-none">
                <option value="new">New Regime (Default)</option>
                <option value="old">Old Regime</option>
              </select>
            </div>
          </div>
          
          <div className="bg-gumroad-pink border-4 border-black p-8 neo-brutalism-shadow-xs text-center">
            <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Estimated Tax</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-black">₹</span>
              <h3 className="text-4xl font-black font-headline text-black tracking-tighter">{estimatedTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow-xs text-center">
            <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Monthly Take-Home</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-black">₹</span>
              <h3 className="text-3xl font-black font-headline text-black tracking-tighter">{(takeHome / 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest text-center italic leading-relaxed">Calculations include 4% Health & Education Cess. <br/> This is an estimation. Consult a CA for official filing.</p>
    </div>
  );
}
