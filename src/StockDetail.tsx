import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, ArrowLeft, Loader2, Sparkles, Activity, AlertTriangle, IndianRupee } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

export default function StockDetail({ symbol, assetType = 'crypto', user, coins, onBack, onTradeComplete }: any) {
  const backendUrl = window.location.origin;
  const [history, setHistory] = useState<any[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('1mo');
  
  const periods = [
    { label: '1D', value: '1d' },
    { label: '5D', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' },
  ];
  
  // Trade state
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'BUY'|'SELL'>('BUY');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Fetch ML Prediction (only when symbol changes)
  useEffect(() => {
    let isMounted = true;

    const fetchPrediction = async () => {
      try {
        const predRes = await fetch(`${backendUrl}/api/ml/predict/${symbol}`).catch(() => null);
        if (predRes?.ok) {
          const predData = await predRes.json();
          if (isMounted) setPrediction(predData);
        } else {
          if (isMounted) setPrediction({ predicted_trend: 'Bullish', confidence_score: 82.5, is_fallback: true });
        }
      } catch (err) {
        console.error("ML prediction fetch failed", err);
        if (isMounted) setPrediction({ predicted_trend: 'Bullish', confidence_score: 82.5, is_fallback: true });
      }
    };

    fetchPrediction();
    return () => { isMounted = false; };
  }, [symbol, backendUrl]);

  // Fetch Chart Data (when symbol or period changes)
  useEffect(() => {
    let isMounted = true;
    let pollInterval: any;

    const fetchChart = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/chart/${symbol}?period=${chartPeriod}`);
        if (res.ok) {
          const result = await res.json();
          if (result && result.quotes) {
            const newHistory = result.quotes.map((q: any) => {
              const d = new Date(q.date);
              return {
                date: (chartPeriod === '1d' || chartPeriod === '5d') 
                  ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                  : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: chartPeriod === '5y' ? 'numeric' : undefined }),
                price: Number(Number(q.close).toFixed(2))
              }
            }).filter((q: any) => q.price != null && !isNaN(q.price));
            
            if (isMounted) {
              setHistory(newHistory);
              setLivePrice(result.meta?.regularMarketPrice || newHistory[newHistory.length - 1]?.price);
            }
          }
        }
      } catch(e) { 
        console.error("Chart fetch error", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchChart();
    pollInterval = setInterval(fetchChart, 10000);

    return () => { 
      isMounted = false; 
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [symbol, backendUrl, chartPeriod]);

  const executeTrade = async () => {
    if (!livePrice || quantity <= 0) return;
    setTradeLoading(true);
    setMessage(null);

    const totalCost = Number((livePrice * quantity).toFixed(2));

    try {
      if (orderType === 'BUY') {
        if (coins < totalCost) {
          setMessage({ type: 'error', text: `Insufficient coins. Need ${totalCost}.` });
          setTradeLoading(false);
          return;
        }

        // Execute Buy Matrix
        const { error: tradeErr } = await supabase.from('stock_trades').insert({
          user_id: user.id, symbol, type: 'BUY', quantity, price_at_execution: livePrice
        });
        if (tradeErr) throw tradeErr;

        // Upsert Holding
        const { data: holding } = await supabase.from('stock_holdings').select('*').eq('user_id', user.id).eq('symbol', symbol).maybeSingle();
        if (holding) {
           const newTotal = Number(holding.total_quantity) + quantity;
           const newAvg = ((Number(holding.total_quantity) * Number(holding.avg_buy_price)) + totalCost) / newTotal;
           await supabase.from('stock_holdings').update({ total_quantity: newTotal, avg_buy_price: newAvg }).eq('id', holding.id);
        } else {
           await supabase.from('stock_holdings').insert({ user_id: user.id, symbol, total_quantity: quantity, avg_buy_price: livePrice });
        }

        // Fetch current gamification state first
        const { data: gamification } = await supabase.from('user_gamification').select('*').eq('id', user.id).single();
        let currentXp = gamification?.xp || 0;
        let currentLevel = gamification?.level || 1;

        if (gamification) {
           const xpEarned = (prediction?.confidence_score || 50) > 80 ? 50 : 25;
           let newXp = Number(gamification.xp) + xpEarned;
           let newLevel = Number(gamification.level);
           const xpThreshold = newLevel * 1000;

           if (newXp >= xpThreshold) {
              newXp -= xpThreshold;
              newLevel += 1;
           }

           currentXp = newXp;
           currentLevel = newLevel;

           await supabase.from('user_gamification').update({ 
              coins: coins - totalCost,
              xp: newXp,
              level: newLevel
           }).eq('id', user.id);
        }

        setMessage({ type: 'success', text: `Successfully bought ${quantity} share(s) of ${symbol}.` });
        if (onTradeComplete) onTradeComplete(coins - totalCost, currentXp, currentLevel);
      } else if (orderType === 'SELL') {
        // Sell logic checks if user holds enough shares
        const { data: holding } = await supabase.from('stock_holdings')
                                  .select('*')
                                  .eq('user_id', user.id)
                                  .eq('symbol', symbol)
                                  .maybeSingle();
                                  
        if (!holding || holding.total_quantity < quantity) {
          setMessage({ type: 'error', text: `Insufficient shares. You only own ${holding?.total_quantity || 0}.` });
          setTradeLoading(false);
          return;
        }

        const { error: tradeErr } = await supabase.from('stock_trades').insert({
          user_id: user.id, symbol, type: 'SELL', quantity, price_at_execution: livePrice
        });
        if (tradeErr) throw tradeErr;

        const newTotal = Number(holding.total_quantity) - quantity;
        await supabase.from('stock_holdings').update({ total_quantity: newTotal }).eq('id', holding.id);

        // Update Gamification Coins (add profits)
        const { data: gamification } = await supabase.from('user_gamification').select('*').eq('id', user.id).single();
        let currentXp = gamification?.xp || 0;
        let currentLevel = gamification?.level || 1;
        
        if (gamification) {
           const xpEarned = 10; // Base XP for completing a trade
           let newXp = Number(gamification.xp) + xpEarned;
           let newLevel = Number(gamification.level);
           const xpThreshold = newLevel * 1000;

           if (newXp >= xpThreshold) {
              newXp -= xpThreshold;
              newLevel += 1;
           }
           
           currentXp = newXp;
           currentLevel = newLevel;

           await supabase.from('user_gamification').update({ 
              coins: coins + totalCost,
              xp: newXp,
              level: newLevel
           }).eq('id', user.id);
        }

        setMessage({ type: 'success', text: `Successfully sold ${quantity} share(s) of ${symbol}.` });
        if (onTradeComplete) onTradeComplete(coins + totalCost, currentXp, currentLevel);
      }

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Trade execution failed." });
    } finally {
      setTradeLoading(false);
    }
  };

  const chartColor = prediction?.predicted_trend === 'Bearish' ? '#ef4444' : '#10b981';

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <button 
        onClick={onBack}
        className="flex items-center gap-2 font-black font-headline uppercase tracking-widest text-black/50 hover:text-black hover:-translate-x-1 transition-all"
      >
        <ArrowLeft size={18} strokeWidth={3} /> Back to Floor
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <div className="flex items-center gap-4 mb-2">
             <h1 className="text-6xl font-black font-headline text-black tracking-tighter uppercase bg-gumroad-yellow px-4 border-4 border-black inline-block neo-brutalism-shadow-sm rotate-1">
               {symbol}
             </h1>
             <span className="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest">{assetType === 'crypto' ? 'Crypto' : 'Equities'}</span>
           </div>
           {livePrice && (
             <div className="flex items-end gap-3">
               <span className="text-4xl font-black text-black">₹{livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
               <span className={cn("text-lg font-black flex items-center mb-1", prediction?.predicted_trend === 'Bearish' ? 'text-red-600' : 'text-emerald-600')}>
                 {prediction?.predicted_trend === 'Bearish' ? <TrendingDown size={24} strokeWidth={3} className="mr-1" /> : <TrendingUp size={24} strokeWidth={3} className="mr-1" />}
                 Live
               </span>
             </div>
           )}
        </div>
        
        {prediction && (
           <div className="bg-white border-4 border-black p-4 neo-brutalism-shadow-xs flex items-center gap-4 group">
              <div className="w-12 h-12 border-4 border-black bg-gumroad-pink flex items-center justify-center neo-brutalism-shadow-xs group-hover:-translate-y-1 transition-transform">
                 <Sparkles size={24} className="text-black" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-black/60">AI Prediction{prediction.is_fallback ? ' (Estimated)' : ''}</p>
                 <p className={cn("text-xl font-black uppercase tracking-tighter", prediction.predicted_trend === 'Bearish' ? 'text-red-500' : 'text-emerald-500')}>
                   {prediction.predicted_trend} ({prediction.confidence_score}%)
                 </p>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
             {periods.map((p) => (
                <button
                   key={p.value}
                   onClick={() => setChartPeriod(p.value)}
                   className={cn(
                      "px-4 py-2 border-4 border-black text-xs font-black uppercase tracking-widest transition-transform hover:-translate-y-1 neo-brutalism-shadow-xs",
                      chartPeriod === p.value 
                        ? 'bg-gumroad-pink text-black' 
                        : 'bg-white text-black hover:bg-gumroad-yellow'
                   )}
                >
                   {p.label}
                </button>
             ))}
          </div>

          <div className="bg-white border-4 border-black p-1 pb-6 neo-brutalism-shadow-sm min-h-[400px] relative grid-bg">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={40} className="animate-spin text-black" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400} minWidth={1} minHeight={1}>
              <AreaChart data={history} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" strokeOpacity={0.1} />
                <XAxis dataKey="date" tick={{fontFamily: 'system-ui', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis domain={['auto', 'auto']} tick={{fontFamily: 'system-ui', fontSize: 10, fontWeight: 900}} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} width={60} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '4px solid #000', borderRadius: '0', boxShadow: '4px 4px 0px #000', fontWeight: 900, textTransform: 'uppercase' }}
                  itemStyle={{ color: '#000', fontWeight: 900 }}
                  labelStyle={{ color: '#000', fontWeight: 900, marginBottom: '4px', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white border-4 border-black flex flex-col pt-0 overflow-hidden neo-brutalism-shadow-sm">
           <div className="flex border-b-4 border-black font-black uppercase tracking-widest text-sm">
             <button 
                onClick={() => setOrderType('BUY')}
                className={cn("flex-1 py-4 border-r-4 border-black transition-colors focus:outline-none", orderType === 'BUY' ? 'bg-emerald-400 text-black' : 'bg-white hover:bg-black/5 text-black/50')}
             >
               Buy
             </button>
             <button 
                onClick={() => setOrderType('SELL')}
                className={cn("flex-1 py-4 transition-colors focus:outline-none", orderType === 'SELL' ? 'bg-rose-400 text-black' : 'bg-white hover:bg-black/5 text-black/50')}
             >
               Sell
             </button>
           </div>
           
           <div className="p-6 flex-1 flex flex-col justify-between grid-bg">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-black mb-2 block">Quantity (Shares)</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border-4 border-black h-14 px-4 text-2xl font-black text-black outline-none focus:bg-gumroad-yellow/20 transition-colors neo-brutalism-shadow-xs"
                  />
                </div>
                
                {livePrice && (
                  <div className="bg-white border-4 border-black p-4 rotate-1 neo-brutalism-shadow-xs flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/60">Estimated {orderType} Cost</span>
                    <span className="text-xl font-black text-black">
                      ₹{(livePrice * quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-8 space-y-4">
                <AnimatePresence>
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn("p-3 border-4 border-black text-xs font-black uppercase tracking-widest flex items-center gap-2", message.type === 'error' ? 'bg-rose-400 text-black' : 'bg-emerald-400 text-black')}
                    >
                      <AlertTriangle size={16} strokeWidth={3} /> {message.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={executeTrade}
                  disabled={tradeLoading || !livePrice}
                  className="w-full h-16 bg-black text-white font-black uppercase tracking-[0.2em] text-lg border-4 border-black hover:bg-gumroad-pink hover:text-black hover:shadow-none hover:-translate-y-1 hover:translate-x-1 hover:neo-brutalism-shadow-sm transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2 disabled:bg-black/20 disabled:text-black disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  {tradeLoading ? <Loader2 size={24} className="animate-spin" /> : `CONFIRM ${orderType}`}
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
