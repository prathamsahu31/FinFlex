import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PiggyBank, ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from './utils';

const DUMMY_TRANSACTIONS = [
  { id: 1, merchant: 'Starbucks', amount: 4.50, roundUp: 0.50 },
  { id: 2, merchant: 'Uber', amount: 12.30, roundUp: 0.70 },
  { id: 3, merchant: 'Spotify', amount: 9.99, roundUp: 0.01 },
  { id: 4, merchant: 'Whole Foods', amount: 45.20, roundUp: 0.80 },
  { id: 5, merchant: 'Netflix', amount: 15.49, roundUp: 0.51 },
];

export default function AlgoSave() {
  const [vaultBalance, setVaultBalance] = useState(124.50);
  const [recentSweeps, setRecentSweeps] = useState(DUMMY_TRANSACTIONS);
  const [isSweeping, setIsSweeping] = useState(false);

  const handleManualSweep = () => {
    setIsSweeping(true);
    setTimeout(() => {
      const newSweep = {
        id: Date.now(),
        merchant: 'Target (Manual Sync)',
        amount: 34.10,
        roundUp: 0.90
      };
      setRecentSweeps([newSweep, ...recentSweeps]);
      setVaultBalance(prev => prev + newSweep.roundUp);
      setIsSweeping(false);
    }, 1500);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Algo-Save</h1>
        <p className="text-slate-500 text-sm mt-1">Spare change round-ups from your linked accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vault Visualization */}
        <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 text-white flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 relative z-10"
          >
            <PiggyBank size={48} className="text-white drop-shadow-md" />
          </motion.div>
          
          <p className="text-emerald-100 font-medium mb-2 relative z-10">Vault Balance</p>
          <motion.h2 
            key={vaultBalance}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-bold tracking-tight mb-8 relative z-10"
          >
            ${vaultBalance.toFixed(2)}
          </motion.h2>

          <button 
            onClick={handleManualSweep}
            disabled={isSweeping}
            className="w-full bg-white text-emerald-700 hover:bg-emerald-50 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 relative z-10 disabled:opacity-80"
          >
            {isSweeping ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            {isSweeping ? 'Sweeping...' : 'Sync Plaid Accounts'}
          </button>
        </div>

        {/* Recent Sweeps */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Round-ups</h3>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Active</span>
          </div>

          <div className="space-y-4">
            {recentSweeps.map((sweep, index) => (
              <motion.div 
                key={sweep.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{sweep.merchant}</p>
                    <p className="text-sm text-slate-500">Spent ${sweep.amount.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ArrowRight size={16} className="text-slate-300" />
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">+${sweep.roundUp.toFixed(2)}</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Swept</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
