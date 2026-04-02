import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Gavel, Coins, Target, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

export default function PunishmentContract() {
  const [pledge, setPledge] = useState(1000);
  const [goal, setGoal] = useState('No takeouts this week');
  const [antiCharity, setAntiCharity] = useState('The Association for Slower Internet');
  const [isContractSigned, setIsContractSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchContract = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('punishment_contracts').select('*').eq('user_id', user.id).eq('is_active', true).single();
      if (data) {
        setGoal(data.goal);
        setPledge(data.pledge_amount);
        setAntiCharity(data.anti_charity);
        setIsContractSigned(true);
      }
      setIsLoading(false);
    };
    fetchContract();
  }, []);

  const handleSign = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('punishment_contracts').insert([{
      user_id: user.id,
      goal,
      pledge_amount: pledge,
      anti_charity: antiCharity,
      is_active: true
    }]);

    if (!error) setIsContractSigned(true);
  };

  const handleDeactivate = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('punishment_contracts').update({ is_active: false }).eq('user_id', user.id);
    setIsContractSigned(false);
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center py-20"><Loader2 className="animate-spin text-black" size={40} /></div>;
  }

  if (isContractSigned) {
    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-black text-white border-8 border-gumroad-pink p-12 neo-brutalism-shadow"
        >
          <ShieldAlert size={80} className="mx-auto mb-6 text-gumroad-pink" strokeWidth={3} />
          <h2 className="text-4xl font-black font-headline uppercase mb-4 italic">Contract Sealed</h2>
          <p className="text-xl font-bold mb-8">
            You have pledged <span className="text-gumroad-yellow">₹{pledge.toLocaleString()}</span> to <br />
            <span className="bg-white text-black px-2 mt-2 inline-block font-black uppercase">"{antiCharity}"</span> <br />
            if you fail to: <br />
            <span className="bg-gumroad-pink text-white px-2 mt-2 inline-block font-black uppercase">"{goal}"</span>
          </p>
          <div className="border-t-4 border-white pt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">LEGAL STAMP OF SHAME</p>
            <div className="w-32 h-32 border-4 border-gumroad-pink mx-auto flex items-center justify-center rotate-12 mb-8">
              <p className="text-xs font-black uppercase">FINFLEX CERTIFIED</p>
            </div>
            <button 
              onClick={handleDeactivate}
              className="text-white hover:text-gumroad-pink font-black uppercase tracking-widest text-[10px] border-b-2 border-white/20 hover:border-gumroad-pink pb-1 cursor-pointer transition-colors"
            >
              I accomplished my goal. Deactivate contract.
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-12 flex items-center gap-6">
        <div className="w-16 h-16 border-4 border-black bg-gumroad-yellow flex items-center justify-center text-black neo-brutalism-shadow">
          <Gavel size={32} strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">
            Punishment Contracts
          </h1>
          <p className="text-black font-bold text-sm border-l-4 border-black pl-3 uppercase tracking-tighter">
            Accountability through financial fear
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow">
            <h3 className="text-xl font-black font-headline uppercase mb-6 flex items-center gap-3">
              <Target size={24} strokeWidth={3} /> 1. Define the Goal
            </h3>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-white border-4 border-black p-4 font-bold outline-none focus:bg-gumroad-yellow/10"
              placeholder="e.g., Save ₹5,000 this month"
            />
          </div>

          <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow">
            <h3 className="text-xl font-black font-headline uppercase mb-6 flex items-center gap-3">
              <Coins size={24} strokeWidth={3} /> 2. Set the Penalty
            </h3>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={pledge}
              onChange={(e) => setPledge(Number(e.target.value))}
              className="w-full h-8 bg-white border-4 border-black appearance-none cursor-pointer accent-black mb-4"
            />
            <div className="flex justify-between items-center">
              <span className="font-black text-2xl font-headline">₹{pledge.toLocaleString()}</span>
              <span className="text-[10px] font-black uppercase bg-gumroad-pink text-white px-2 py-1 border-2 border-black">PENALTY AMOUNT</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow">
            <h3 className="text-xl font-black font-headline uppercase mb-6 flex items-center gap-3">
              <ShieldAlert size={24} strokeWidth={3} /> 3. Pick Anti-Charity
            </h3>
            <div className="space-y-4">
              {[
                'The Association for Slower Internet',
                'Do not eat your favorite food for a week',
                'The Global Committee for Unskippable Ads',
                'Organization for Lukewarm Coffee'
              ].map((charity) => (
                <button
                  key={charity}
                  onClick={() => setAntiCharity(charity)}
                  className={cn(
                    "w-full text-left p-4 border-4 border-black font-black uppercase text-xs transition-all",
                    antiCharity === charity ? "bg-black text-white translate-x-1 translate-y-1 shadow-none" : "bg-white text-black neo-brutalism-shadow-sm hover:translate-y-[-2px]"
                  )}
                >
                  {charity}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSign}
            className="w-full bg-gumroad-pink border-4 border-black p-6 text-2xl font-black font-headline uppercase text-white neo-brutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
          >
            SIGN SHAME CONTRACT
          </button>
        </div>
      </div>
    </div>
  );
}
