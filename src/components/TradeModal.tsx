import { useState } from 'react';
import { useStore } from '../store';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../utils';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  type: 'BUY' | 'SELL';
}

export function TradeModal({ isOpen, onClose, symbol, currentPrice, type }: TradeModalProps) {
  const [shares, setShares] = useState<number | ''>('');
  const [error, setError] = useState('');
  
  const balance = useStore(state => state.balance);
  const portfolio = useStore(state => state.portfolio);
  const buyStock = useStore(state => state.buyStock);
  const sellStock = useStore(state => state.sellStock);

  if (!isOpen) return null;

  const totalAmount = (Number(shares) || 0) * currentPrice;
  const ownedShares = portfolio.find(p => p.symbol === symbol)?.shares || 0;

  const handleTrade = () => {
    setError('');
    const numShares = Number(shares);
    
    if (!numShares || numShares <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    try {
      if (type === 'BUY') {
        buyStock(symbol, numShares, currentPrice);
      } else {
        sellStock(symbol, numShares, currentPrice);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Trade failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          {type === 'BUY' ? (
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          ) : (
            <TrendingDown className="h-6 w-6 text-rose-500" />
          )}
          {type} {symbol}
        </h2>

        <div className="space-y-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
            <span className="text-slate-400">Current Price</span>
            <span className="text-xl font-mono font-bold text-white">${currentPrice.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Shares
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={shares}
              onChange={(e) => setShares(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              placeholder="0"
            />
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Estimated Total</span>
              <span className="font-mono text-white">${totalAmount.toFixed(2)}</span>
            </div>
            {type === 'BUY' ? (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Available Balance</span>
                <span className={cn("font-mono", balance < totalAmount ? "text-rose-400" : "text-emerald-400")}>
                  ${balance.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shares Owned</span>
                <span className={cn("font-mono", ownedShares < (Number(shares) || 0) ? "text-rose-400" : "text-white")}>
                  {ownedShares}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleTrade}
            disabled={!shares || Number(shares) <= 0 || (type === 'BUY' ? balance < totalAmount : ownedShares < Number(shares))}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-white transition-all",
              type === 'BUY' 
                ? "bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50" 
                : "bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50",
              "disabled:cursor-not-allowed"
            )}
          >
            Confirm {type}
          </button>
        </div>
      </div>
    </div>
  );
}
