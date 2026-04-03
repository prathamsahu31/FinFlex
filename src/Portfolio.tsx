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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-emerald-500" />
          My Portfolio
        </h1>
        <p className="text-slate-400 mt-1">Track your investments and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-slate-400 font-medium">Total Value</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            ${totalValue.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <PieChart className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-slate-400 font-medium">Invested Value</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            ${portfolioValue.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2 rounded-lg", totalProfit >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20")}>
              {totalProfit >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : <TrendingDown className="h-5 w-5 text-rose-500" />}
            </div>
            <h3 className="text-slate-400 font-medium">Total Profit/Loss</h3>
          </div>
          <div className="flex items-end gap-3">
            <div className={cn("text-3xl font-mono font-bold", totalProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
              ${Math.abs(totalProfit).toFixed(2)}
            </div>
            <div className={cn("font-medium mb-1", totalProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {totalProfit >= 0 ? '+' : '-'}{Math.abs(totalProfitPercent).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Holdings</h2>
        </div>
        
        {portfolio.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No stocks yet</h3>
            <p className="text-slate-400">Go to the dashboard to make your first trade.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Symbol</th>
                  <th className="p-4 font-medium text-right">Shares</th>
                  <th className="p-4 font-medium text-right">Avg Price</th>
                  <th className="p-4 font-medium text-right">Current Price</th>
                  <th className="p-4 font-medium text-right">Total Value</th>
                  <th className="p-4 font-medium text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {portfolio.map((item) => {
                  const currentPrice = currentPrices[item.symbol] || item.averagePrice;
                  const totalValue = item.shares * currentPrice;
                  const totalCost = item.shares * item.averagePrice;
                  const profit = totalValue - totalCost;
                  const profitPercent = (profit / totalCost) * 100;
                  const isPositive = profit >= 0;

                  return (
                    <tr key={item.symbol} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-white">{item.symbol}</span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {item.shares}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        ${item.averagePrice.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono text-white">
                        {loading ? '...' : `$${currentPrice.toFixed(2)}`}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-white">
                        ${totalValue.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <div className={cn(
                          "inline-flex items-center gap-1 font-medium px-2 py-1 rounded-md",
                          isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(profitPercent).toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
