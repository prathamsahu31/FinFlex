import { useState, useEffect } from 'react';
import { IndianRupee, Repeat, Loader2, AlertCircle } from 'lucide-react';

export default function CurrencyConverter() {
  const [amount, setAmount] = useState(1000);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');

  const [rates, setRates] = useState<Record<string, number>>({
    USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150.4, INR: 83.2, AUD: 1.53, CAD: 1.35
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates) {
          setRates(data.rates);
          setError(null);
        }
      } catch (err) {
        setError('Failed to fetch live rates. Using defaults.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRates();
  }, []);

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
          
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-gumroad-pink font-black font-label tracking-widest uppercase text-xs pt-4">
              <Loader2 size={16} className="animate-spin" strokeWidth={3} /> Fetching Live Rates...
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-500 font-black font-label tracking-widest uppercase text-xs pt-4">
              <AlertCircle size={16} strokeWidth={3} /> {error}
            </div>
          )}

          <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow-xs text-center relative overflow-hidden">
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
