import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, Sparkles, Trophy, Star, ArrowUpRight, ArrowDownRight, Loader2, Coins as CoinsIcon, Activity } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';
import StockDetail from './StockDetail';

export default function Trading({ user, proxyUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000' }: TabComponentProps & { user: any, proxyUrl?: string }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const [activeStock, setActiveStock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gamification, setGamification] = useState({ coins: 10000, xp: 0, level: 1 });
  
  // ML States
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [riskProfile, setRiskProfile] = useState<any>({ category: 'Analyzing...', risk_score: 50 });
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Gamification Data
    const fetchGamification = async () => {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) setGamification(data);
      if (error && error.code !== 'PGRST116') console.error('Error fetching gamification:', error);
    };

    // 2. Fetch ML Recommendations (FastAPI)
    const fetchML = async () => {
      setIsLoadingRecs(true);
      try {
        // We catch errors to elegantly fallback if Python isn't running
        const recRes = await fetch(`${proxyUrl}/api/ml/recommendations/${user.id}`).catch(() => null);
        if (recRes?.ok) {
          const recData = await recRes.json();
          setRecommendations(recData.recommendations || []);
        } else {
          setRecommendations([]);
        }

        const riskRes = await fetch(`${proxyUrl}/api/ml/risk-profile/${user.id}`).catch(() => null);
        if (riskRes?.ok) {
          const riskData = await riskRes.json();
          setRiskProfile(riskData);
        } else {
          setRiskProfile({ category: 'Unavailable', risk_score: 0 });
        }
      } catch (err) {
        console.error("ML Fetch failed", err);
      } finally {
        setIsLoadingRecs(false);
      }
    };

    fetchGamification();
    fetchML();
  }, [user, proxyUrl]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayFn = setTimeout(async () => {
      try {
        const yahooUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`);
        
        if (res.ok) {
          const rawData = await res.json();
          const mapped = (rawData.quotes || [])
            .filter((quote: any) => ['EQUITY', 'CRYPTOCURRENCY', 'ETF'].includes(quote.quoteType))
            .slice(0, 5)
            .map((quote: any) => ({
              symbol: quote.symbol,
              name: quote.shortname || quote.longname || quote.symbol
            }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error("Search failed");
      }
    }, 300);
    return () => clearTimeout(delayFn);
  }, [searchQuery, backendUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveStock(searchQuery.toUpperCase().trim());
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  const calculateStandardXp = (level: number) => level * 1000;
  const xpPercent = Math.min((gamification.xp / calculateStandardXp(gamification.level)) * 100, 100);

  // If a stock is selected, render the detail view
  if (activeStock) {
    return <StockDetail 
             symbol={activeStock} 
             user={user} 
             onBack={() => setActiveStock(null)} 
             coins={gamification.coins}
             onTradeComplete={(newCoins: number, newXp: number, newLevel: number) => {
                setGamification(prev => ({...prev, coins: newCoins, xp: newXp, level: newLevel}));
             }}
           />;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & HUD */}
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Trading Floor</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">AI-Powered Gamified Market Simulator</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Virtual Account HUD */}
        <div className="md:col-span-2 flex flex-col justify-between bg-gumroad-yellow border-4 border-black neo-brutalism-shadow p-6">
          <div className="flex justify-between items-start mb-6">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">Available Capital</p>
                <div className="flex items-center gap-3">
                  <CoinsIcon size={32} strokeWidth={3} className="text-black" />
                  <h2 className="text-5xl font-black font-headline tracking-tighter text-black">
                    {gamification.coins.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
             </div>
             <div className="bg-white border-4 border-black px-4 py-2 neo-brutalism-shadow-xs rotate-3 flex items-center gap-2">
                <Trophy size={18} className="text-gumroad-pink" />
                <span className="font-black text-black">LVL {gamification.level}</span>
             </div>
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-black">Trader XP</span>
              <span className="text-xs font-bold text-black">{gamification.xp} / {calculateStandardXp(gamification.level)}</span>
            </div>
            <div className="w-full bg-white border-4 border-black h-4 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full border-r-4 border-black bg-gumroad-pink"
              />
            </div>
          </div>
        </div>

        {/* Risk Profile Card */}
        <div className="bg-white border-4 border-black neo-brutalism-shadow p-6 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -right-4 -top-4 opacity-10">
               <Activity size={120} strokeWidth={3} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-black mb-4 flex items-center gap-2 relative z-10">
              <Sparkles size={14} className="text-gumroad-pink" /> AI Risk Profile
            </h3>
            <p className="text-3xl font-black font-headline text-black tracking-tighter relative z-10">{riskProfile.category}</p>
            <p className="text-sm font-bold text-black/60 relative z-10 mt-1">Score: {riskProfile.risk_score} / 100</p>
        </div>
      </div>

      {/* Search Bar with Autocomplete Dropdown */}
      <form onSubmit={handleSearch} className="relative z-20">
        <div className="flex items-center">
          <div className="relative flex-1">
            <Search size={24} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="ENTER STOCK SYMBOL (e.g., TSLA, AAPL)..." 
              className="w-full h-16 bg-white border-4 border-black pl-14 pr-6 font-black text-xl uppercase tracking-widest placeholder:text-black/20 focus:outline-none focus:bg-gumroad-pink/5 transition-colors neo-brutalism-shadow-sm"
            />
            {showDropdown && searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-black neo-brutalism-shadow-sm flex flex-col z-30">
                {searchResults.map((stock: any) => (
                  <div 
                    key={stock.symbol}
                    onMouseDown={(e) => {
                       e.preventDefault(); // Prevent onBlur from firing before click
                       setActiveStock(stock.symbol);
                       setSearchQuery('');
                       setShowDropdown(false);
                    }}
                    className="flex justify-between items-center p-4 border-b-2 border-black/10 hover:bg-gumroad-yellow cursor-pointer transition-colors"
                  >
                     <span className="font-black font-headline text-lg text-black">{stock.symbol}</span>
                     <span className="font-bold text-xs uppercase tracking-widest text-black/60">{stock.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="h-16 px-8 bg-black text-white border-4 border-black font-black uppercase tracking-widest hover:bg-gumroad-pink hover:text-black transition-colors neo-brutalism-shadow-sm -ml-4 cursor-pointer hover:-translate-y-1 z-10">
            Trade
          </button>
        </div>
      </form>

      {/* ML Recommendations */}
      <div>
        <h3 className="text-2xl font-black font-headline uppercase tracking-tighter text-black mb-6 flex items-center gap-3">
          <Sparkles size={24} className="text-gumroad-pink" /> Recommended For You
        </h3>

        {isLoadingRecs ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={40} className="animate-spin text-black" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((rec, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -4, x: -4, boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)' }}
                className="bg-white border-4 border-black neo-brutalism-shadow-sm p-5 cursor-pointer flex flex-col justify-between transition-all"
                onClick={() => setActiveStock(rec.symbol)}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl font-black font-headline tracking-tight bg-gumroad-yellow px-2 border-2 border-black inline-block -rotate-2">
                       {rec.symbol}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-1">
                      {rec.confidence}% Match
                    </span>
                  </div>
                  <p className="text-sm font-bold text-black/70 mb-4 line-clamp-2">{rec.reason}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gumroad-pink group-hover:text-black transition-colors">
                  Trade Now <ArrowUpRight size={14} strokeWidth={3} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
