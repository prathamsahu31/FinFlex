import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, ArrowLeft, Loader2, Sparkles, Activity, AlertTriangle, IndianRupee } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { io } from 'socket.io-client';

export default function StockDetail({ symbol, user, coins, onBack, onTradeComplete, proxyUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000' }: any) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  const [history, setHistory] = useState<any[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Trade state
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'BUY'|'SELL'>('BUY');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // 1. Fetch ML Prediction
        const predRes = await fetch(`${proxyUrl}/api/ml/predict/${symbol}`).catch(() => null);
        if (predRes?.ok) {
           const predData = await predRes.json();
           if (isMounted) {
             setPrediction(predData);
             setLivePrice(predData.current_price);
           }
        } else {
           // Mock data if service offline
           if (isMounted) {
             setPrediction({ predicted_trend: 'Bullish', confidence_score: 82.5, current_price: 150.25 });
             setLivePrice(150.25);
           }
        }

        // 2. Fetch History for Chart
        const histRes = await fetch(`${backendUrl}/api/stock/history/${symbol}?range=1mo`).catch(() => null);
        if (histRes?.ok) {
           const histData = await histRes.json();
           if (isMounted && Array.isArray(histData)) {
              setHistory(histData.map(d => ({ date: new Date(d.date).toLocaleDateString(), price: d.close })));
           }
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchData();

    // 3. Socket.io Real-Time Connection
    const socket = io(backendUrl);
    socket.on('connect', () => {
       socket.emit('subscribe', symbol);
    });

    socket.on('marketUpdate', (data: any[]) => {
       if (!isMounted) return;
       const quote = data.find(q => q.symbol === symbol);
       if (quote && quote.price) {
          setLivePrice(quote.price);
       }
    });

    return () => { 
      isMounted = false; 
      socket.disconnect();
    }
  }, [symbol, proxyUrl, backendUrl]);

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
             <span className="bg-black text-white px-3 py-1 font-black text-xs uppercase tracking-widest">Equities</span>
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
                 <p className="text-[10px] font-black uppercase tracking-widest text-black/60">AI Prediction</p>
                 <p className={cn("text-xl font-black uppercase tracking-tighter", prediction.predicted_trend === 'Bearish' ? 'text-red-500' : 'text-emerald-500')}>
                   {prediction.predicted_trend} ({prediction.confidence_score}%)
                 </p>
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white border-4 border-black p-1 pb-6 neo-brutalism-shadow-sm min-h-[400px] relative grid-bg">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={40} className="animate-spin text-black" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
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
