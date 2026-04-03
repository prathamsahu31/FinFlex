import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { StockChart } from './components/StockChart';
import { TradeModal } from './components/TradeModal';
import StockAnalysis from './components/StockAnalysis';
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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col relative grid-bg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Market Dashboard</h1>
          <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter italic">Simulate trades with real-time market data</p>
        </div>
        
        <form onSubmit={handleSearch} className="w-full md:w-auto relative z-20" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black" strokeWidth={3} />
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
              placeholder="SEARCH SYMBOL..."
              className="w-full md:w-80 bg-white border-4 border-black px-4 py-3 pl-12 text-black font-black uppercase tracking-widest placeholder-black/20 focus:outline-none focus:bg-gumroad-pink/5 transition-colors neo-brutalism-shadow-xs"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-black neo-brutalism-shadow flex flex-col z-50 max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    type="button"
                    onClick={() => handleSelectResult(result.symbol)}
                    className="w-full text-left px-4 py-4 hover:bg-gumroad-yellow transition-colors border-b-2 border-black last:border-0 group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-black font-headline text-lg text-black group-hover:scale-105 transition-transform">{result.symbol}</div>
                    </div>
                    <div className="text-[10px] font-black text-black/60 uppercase tracking-widest truncate">{result.name || result.shortName || result.longName}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-rose-400 border-4 border-black text-black p-4 neo-brutalism-shadow-xs flex items-center gap-3 mb-8 font-black uppercase text-xs">
          <AlertCircle className="h-5 w-5" strokeWidth={3} />
          {error}
        </div>
      )}

      {currentStock && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h2 className="text-5xl font-black font-headline text-black tracking-tighter uppercase bg-gumroad-yellow px-4 border-4 border-black inline-block -rotate-1">
                    {currentStock.shortName}
                  </h2>
                  <p className="text-black font-black text-lg mt-2 font-mono bg-black text-white px-2 w-fit">{currentStock.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-black">
                    ${currentStock.regularMarketPrice?.toFixed(2)}
                  </div>
                  <div className={cn(
                    "flex items-center justify-end gap-1 font-black mt-2 text-sm uppercase px-2 py-1 border-2 border-black rotate-1",
                    currentStock.regularMarketChangePercent >= 0 ? "bg-emerald-400" : "bg-rose-400"
                  )}>
                    {currentStock.regularMarketChangePercent >= 0 ? <TrendingUp className="h-4 w-4" strokeWidth={3} /> : <TrendingDown className="h-4 w-4" strokeWidth={3} />}
                    {Math.abs(currentStock.regularMarketChangePercent || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide shrink-0 relative z-10">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setChartPeriod(p.value)}
                    className={cn(
                      "px-4 py-2 border-4 border-black text-xs font-black uppercase tracking-widest transition-transform hover:-translate-y-1 neo-brutalism-shadow-xs",
                      chartPeriod === p.value 
                        ? "bg-gumroad-pink text-black" 
                        : "bg-white text-black hover:bg-gumroad-yellow"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="bg-white border-4 border-black p-1 pb-6 neo-brutalism-shadow-sm min-h-[300px] relative grid-bg">
                <StockChart symbol={currentStock.symbol} period={chartPeriod} />
              </div>

              {/* AI Gemini Analysis */}
              <StockAnalysis stock={currentStock} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 flex flex-col justify-between group">
              <h3 className="text-xl font-black font-headline uppercase text-black mb-6 flex items-center gap-3">
                <div className="w-10 h-10 border-4 border-black bg-gumroad-pink flex items-center justify-center neo-brutalism-shadow-xs group-hover:-rotate-3 transition-transform">
                  <Activity className="h-6 w-6 text-black" strokeWidth={3} />
                </div>
                Trade {currentStock.symbol}
              </h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => setTradeModal({ isOpen: true, type: 'BUY' })}
                  className="w-full bg-emerald-400 hover:bg-emerald-300 text-black border-4 border-black neo-brutalism-shadow font-black uppercase tracking-widest py-4 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
                >
                  Buy Shares
                </button>
                <button
                  onClick={() => setTradeModal({ isOpen: true, type: 'SELL' })}
                  className="w-full bg-white hover:bg-black hover:text-white text-black border-4 border-black neo-brutalism-shadow font-black uppercase tracking-widest py-4 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
                >
                  Sell Shares
                </button>
              </div>
            </div>

            <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 flex flex-col shrink-0">
              <h3 className="text-xs font-black uppercase tracking-widest text-black mb-6 border-b-2 border-black pb-1 inline-block w-fit">Market Info</h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Status</span>
                  <span className="bg-emerald-400 border-2 border-black px-2 py-0.5 text-xs font-black uppercase">Market Open</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Data Source</span>
                  <span className="font-black text-xs uppercase underline decoration-gumroad-pink decoration-4">Yahoo Finance</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/50">Currency</span>
                  <span className="font-black text-xs uppercase px-2 py-0.5 border-2 border-black bg-gumroad-yellow">USD</span>
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
