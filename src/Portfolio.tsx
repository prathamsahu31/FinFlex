import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { cn } from './utils';

export default function Portfolio({ setActiveTab, user, profile }: any) {
  const { balance, portfolio, checkAchievements } = useStore();
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async (isBackground = false) => {
      if (portfolio.length === 0) {
        if (!isBackground) setLoading(false);
        return;
      }

      if (!isBackground) setLoading(true);
      const prices: Record<string, number> = {};

      try {
        await Promise.all(
          portfolio.map(async (item) => {
            const res = await fetch(`/api/stock/quote/${item.symbol}`);
            if (res.ok) {
              const data = await res.json();
              prices[item.symbol] = data.regularMarketPrice;
            }
          })
        );
        setCurrentPrices(prices);
      } catch (err) {
        console.error('Failed to fetch portfolio prices', err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchPrices();

    // Poll for real-time updates every 10 seconds
    const interval = setInterval(() => {
      fetchPrices(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [portfolio]);

  const portfolioValue = portfolio.reduce((total, item) => {
    const currentPrice = currentPrices[item.symbol] || item.averagePrice;
    return total + (item.shares * currentPrice);
  }, 0);

  const totalValue = balance + portfolioValue;
  const totalProfit = totalValue - 1000; // Initial balance is 1000
  const totalProfitPercent = (totalProfit / 1000) * 100;

  useEffect(() => {
    if (!loading) {
      checkAchievements(portfolioValue);
    }
  }, [portfolioValue, loading, checkAchievements]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col relative grid-bg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 border-4 border-black bg-gumroad-pink flex items-center justify-center neo-brutalism-shadow-xs italic">
              <Briefcase className="h-8 w-8 text-black" strokeWidth={3} />
            </div>
            My Portfolio
          </h1>
          <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter italic">Track your investments and performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-black text-[10px] font-black uppercase tracking-widest mb-1 border-b-2 border-black pb-1 inline-block">Total Value</p>
            <h2 className="text-3xl font-black font-headline mt-2 text-black">
              ${totalValue.toFixed(2)}
            </h2>
          </div>
          <div className="w-14 h-14 border-4 border-black bg-gumroad-yellow flex items-center justify-center text-black neo-brutalism-shadow-sm group-hover:rotate-12 transition-transform">
            <DollarSign className="h-8 w-8 text-black" strokeWidth={3} />
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-black text-[10px] font-black uppercase tracking-widest mb-1 border-b-2 border-black pb-1 inline-block">Invested Value</p>
            <h2 className="text-3xl font-black font-headline mt-2 text-black">
              ${portfolioValue.toFixed(2)}
            </h2>
          </div>
          <div className="w-14 h-14 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black neo-brutalism-shadow-sm group-hover:rotate-12 transition-transform">
            <PieChart className="h-8 w-8 text-black" strokeWidth={3} />
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-black text-[10px] font-black uppercase tracking-widest mb-1 border-b-2 border-black pb-1 inline-block">Total Profit/Loss</p>
            <div className="flex items-center gap-3 mt-2">
              <h2 className={cn("text-3xl font-black font-headline", totalProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                ${Math.abs(totalProfit).toFixed(2)}
              </h2>
              <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black", totalProfit >= 0 ? "bg-emerald-400" : "bg-rose-400")}>
                {totalProfit >= 0 ? '+' : '-'}{Math.abs(totalProfitPercent).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className={cn("w-14 h-14 border-4 border-black flex items-center justify-center text-black neo-brutalism-shadow-sm group-hover:rotate-12 transition-transform", totalProfit >= 0 ? "bg-emerald-400" : "bg-rose-400")}>
            {totalProfit >= 0 ? <TrendingUp className="h-8 w-8" strokeWidth={3} /> : <TrendingDown className="h-8 w-8" strokeWidth={3} />}
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow flex flex-col overflow-hidden flex-1 min-h-0">
        <div className="p-6 border-b-4 border-black bg-gumroad-pink/10 shrink-0">
          <h2 className="text-2xl font-black font-headline uppercase text-black">Holdings</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 grid-bg">
          {portfolio.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
              <div className="w-20 h-20 border-4 border-black bg-white flex items-center justify-center mb-6 neo-brutalism-shadow-xs rotate-3">
                <Briefcase className="h-10 w-10 text-black/20" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-black font-headline uppercase text-black mb-2">No stocks yet</h3>
              <p className="text-black/60 font-bold text-sm uppercase tracking-tighter mb-8 italic">Go to the dashboard to make your first trade.</p>
              <button 
                onClick={() => setActiveTab?.('trading')}
                className="bg-gumroad-yellow text-black border-4 border-black px-8 py-4 text-sm font-black font-headline uppercase tracking-widest neo-brutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
              >
                Go to Trading Floor
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item) => {
                const currentPrice = currentPrices[item.symbol] || item.averagePrice;
                const totalVal = item.shares * currentPrice;
                const totalCost = item.shares * item.averagePrice;
                const profit = totalVal - totalCost;
                const profitPercent = (profit / totalCost) * 100;
                const isPositive = profit >= 0;

                return (
                  <div key={item.symbol} className="bg-white border-4 border-black p-5 neo-brutalism-shadow-sm hover:bg-gumroad-yellow/5 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black shrink-0 font-black text-2xl font-headline group-hover:rotate-3 transition-transform italic">
                        {item.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black font-headline text-2xl uppercase text-black">{item.symbol}</p>
                        <p className="text-[10px] font-black text-black uppercase tracking-widest mt-1">
                          <span className="bg-black text-white px-2 py-0.5">{item.shares} SHARES</span> @ ${item.averagePrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 sm:text-right sm:justify-end">
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Current Price</p>
                        <p className="text-xl font-black text-black">
                          {loading ? '...' : `$${currentPrice.toFixed(2)}`}
                        </p>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Total Value</p>
                        <p className="text-xl font-black text-black">${totalVal.toFixed(2)}</p>
                      </div>
                      <div className="flex-1 min-w-[120px] sm:w-auto">
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Return</p>
                        <div className={cn(
                          "inline-flex items-center gap-2 font-black px-3 py-1 border-2 border-black text-[10px] uppercase",
                          isPositive ? "bg-emerald-400" : "bg-rose-400"
                        )}>
                          {isPositive ? <TrendingUp className="h-4 w-4" strokeWidth={3} /> : <TrendingDown className="h-4 w-4" strokeWidth={3} />}
                          {Math.abs(profitPercent).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
