import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { StockChart } from './components/StockChart';
import { TradeModal } from './components/TradeModal';
import { Stock } from './types';
import { cn } from './utils';

export default function Trading({ setActiveTab, user, profile }: any) {
  const [searchQuery, setSearchQuery] = useState('AAPL');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentStock, setCurrentStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tradeModal, setTradeModal] = useState<{ isOpen: boolean, type: 'BUY'|'SELL' }>({ isOpen: false, type: 'BUY' });
  const [chartPeriod, setChartPeriod] = useState('1mo');
  const searchRef = useRef<HTMLFormElement>(null);

  const fetchQuote = async (symbol: string, isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      setError('');
    }
    try {
      const res = await fetch(`/api/stock/quote/${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch quote');
      const data = await res.json();
      setCurrentStock({
        symbol: data.symbol,
        shortName: data.shortName || data.longName || data.symbol,
        regularMarketPrice: data.regularMarketPrice,
        regularMarketChangePercent: data.regularMarketChangePercent,
      });
    } catch (err) {
      if (!isBackground) {
        setError('Could not find stock symbol. Try searching by company name.');
      }
      console.error(err);
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQuote('AAPL');
  }, []);

  // Poll for real-time updates every 10 seconds
  useEffect(() => {
    if (!currentStock?.symbol) return;
    
    const interval = setInterval(() => {
      fetchQuote(currentStock.symbol, true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentStock?.symbol]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2 && showResults) {
        try {
          const res = await fetch(`/api/stock/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      fetchQuote(searchQuery.toUpperCase());
    }
  };

  const handleSelectResult = (symbol: string) => {
    setSearchQuery(symbol);
    setShowResults(false);
    fetchQuote(symbol);
  };

  const periods = [
    { label: '1D', value: '1d' },
    { label: '5D', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Market Dashboard</h1>
          <p className="text-slate-400 mt-1">Simulate trades with real-time market data</p>
        </div>
        
        <form onSubmit={handleSearch} className="w-full md:w-auto relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) setShowResults(true);
              }}
              placeholder="Search company or symbol..."
              className="w-full md:w-80 bg-slate-800 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    type="button"
                    onClick={() => handleSelectResult(result.symbol)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-white">{result.symbol}</div>
                    </div>
                    <div className="text-sm text-slate-400 truncate">{result.name || result.shortName || result.longName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl flex items-center gap-3 mb-8">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {currentStock && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{currentStock.shortName}</h2>
                  <p className="text-slate-400 font-mono">{currentStock.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-white">
                    ${currentStock.regularMarketPrice?.toFixed(2)}
                  </div>
                  <div className={cn(
                    "flex items-center justify-end gap-1 font-medium mt-1",
                    currentStock.regularMarketChangePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {currentStock.regularMarketChangePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(currentStock.regularMarketChangePercent || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setChartPeriod(p.value)}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                      chartPeriod === p.value 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <StockChart symbol={currentStock.symbol} period={chartPeriod} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Trade {currentStock.symbol}
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setTradeModal({ isOpen: true, type: 'BUY' })}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Buy Shares
                </button>
                <button
                  onClick={() => setTradeModal({ isOpen: true, type: 'SELL' })}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition-colors"
                >
                  Sell Shares
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Market Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 font-medium">Market Open</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Data Source</span>
                  <span className="text-white">Yahoo Finance</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-400">Currency</span>
                  <span className="text-white">USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStock && (
        <TradeModal
          isOpen={tradeModal.isOpen}
          onClose={() => setTradeModal({ ...tradeModal, isOpen: false })}
          symbol={currentStock.symbol}
          currentPrice={currentStock.regularMarketPrice}
          type={tradeModal.type}
        />
      )}
    </div>
  );
}
