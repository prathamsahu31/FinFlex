import { useState } from 'react';
import { IndianRupee, Repeat } from 'lucide-react';

export default function CurrencyConverter() {
  const [amount, setAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');

  // Mock exchange rates relative to USD
  const rates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.4,
    INR: 83.2,
    AUD: 1.53,
    CAD: 1.35,
  };

  const convertedAmount = (amount / rates[fromCurrency]) * rates[toCurrency];

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Currency Converter</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Real-time exchange rates for global markets</p>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden">
        <div className="p-8 space-y-6 grid-bg">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">From</label>
              <select value={fromCurrency} onChange={e => setFromCurrency(e.target.value)} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors appearance-none">
                {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="relative">
               <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">To</label>
               <select value={toCurrency} onChange={e => setToCurrency(e.target.value)} className="w-full bg-white border-4 border-black px-4 py-3 font-bold outline-none focus:bg-gumroad-pink/10 transition-colors appearance-none">
                {Object.keys(rates).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow-xs text-center">
            <p className="text-xs font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1 inline-block">Converted Value</p>
            <h3 className="text-4xl font-black font-headline text-black tracking-tighter">
              {convertedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} {toCurrency}
            </h3>
            <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mt-4">1 {fromCurrency} = {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
