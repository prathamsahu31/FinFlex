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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white border-4 border-black neo-brutalism-shadow-lg w-full max-w-md relative flex flex-col overflow-hidden">
        <div className={cn("p-6 border-b-4 border-black flex justify-between items-center shrink-0", type === 'BUY' ? "bg-emerald-400" : "bg-rose-400")}>
          <h2 className="text-2xl font-black font-headline uppercase tracking-tighter text-black flex items-center gap-3">
            {type === 'BUY' ? (
              <TrendingUp className="h-8 w-8 text-black" strokeWidth={3} />
            ) : (
              <TrendingDown className="h-8 w-8 text-black" strokeWidth={3} />
            )}
            {type} {symbol}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 border-4 border-black bg-white hover:bg-black hover:text-white flex items-center justify-center text-black cursor-pointer transition-colors"
          >
            <X className="h-6 w-6" strokeWidth={3} />
          </button>
        </div>

        <div className="p-8 space-y-6 grid-bg">
          <div className="bg-white border-4 border-black p-4 neo-brutalism-shadow-xs flex justify-between items-center group">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Market Price</span>
            <span className="text-2xl font-black text-black">${currentPrice.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-black px-1">
              Number of Shares
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={shares}
              onChange={(e) => setShares(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white border-4 border-black px-4 py-4 text-2xl font-black text-black outline-none focus:bg-gumroad-pink/10 transition-colors neo-brutalism-shadow-xs placeholder:text-black/10"
              placeholder="0"
            />
          </div>

          <div className="bg-white border-4 border-black p-5 neo-brutalism-shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-black/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Total Est.</span>
              <span className="font-black text-xl text-black">${totalAmount.toFixed(2)}</span>
            </div>
            {type === 'BUY' ? (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Available Funds</span>
                <span className={cn("font-black text-sm uppercase px-2 py-0.5 border-2 border-black", balance < totalAmount ? "bg-rose-400" : "bg-emerald-400")}>
                  ${balance.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Your Shares</span>
                <span className={cn("font-black text-sm uppercase px-2 py-0.5 border-2 border-black", ownedShares < (Number(shares) || 0) ? "bg-rose-400" : "bg-white")}>
                  {ownedShares} UNITS
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-400 border-4 border-black text-black p-3 font-black uppercase text-[10px] tracking-widest animate-shake">
              {error}
            </div>
          )}

          <button
            onClick={handleTrade}
            disabled={!shares || Number(shares) <= 0 || (type === 'BUY' ? balance < totalAmount : ownedShares < Number(shares))}
            className={cn(
              "w-full py-5 border-4 border-black font-black uppercase tracking-[0.2em] text-lg neo-brutalism-shadow transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed",
              type === 'BUY' 
                ? "bg-emerald-400 hover:bg-emerald-300" 
                : "bg-rose-400 hover:bg-rose-300",
              "hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2"
            )}
          >
            Confirm {type}
          </button>
        </div>
      </div>
    </div>
  );
}
