import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { User, Briefcase, Target, ArrowRight, ArrowLeft, Loader2, IndianRupee } from 'lucide-react';
import { cn } from './utils';
import logoImg from './logo.png';

export default function Onboarding({ user, onComplete }: { user: any, onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    monthly_income: '',
    household_income: '',
    current_savings: '',
    monthly_expenses: '',
    risk_tolerance: 'medium',
    fire_target: '10000000' // 1 Crore default
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = async () => {
    console.log('Finishing onboarding...', formData);
    setIsLoading(true);
    try {
      // Removed auth.updateUser as it causes an infinite lock queue in Supabase JS client when fired synchronously with the upsert.
      // DiceBear avatar is generated dynamically in App.tsx as a fallback anyway.


      console.log('Upserting profile data...');
      // Upsert into public.profiles table
      const profileData = {
        id: user.id,
        age: parseInt(formData.age) || null,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        household_income: parseFloat(formData.household_income) || 0,
        current_savings: parseFloat(formData.current_savings) || 0,
        monthly_expenses: parseFloat(formData.monthly_expenses) || 0,
        risk_tolerance: formData.risk_tolerance,
        fire_target: parseFloat(formData.fire_target) || 10000000,
        onboarding_completed: true
      };
      
      console.log('Profile data to save:', profileData);
      const { error } = await supabase.from('profiles').upsert(profileData);

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }
      
      console.log('Onboarding complete, calling onComplete...');
      onComplete();
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      alert(`Failed to save profile data: ${error.message || 'Unknown error'}. Please check your Supabase connection and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white grid-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white max-w-xl w-full border-4 border-black neo-brutalism-shadow-lg overflow-hidden flex flex-col"
      >
        {/* Progress Bar */}
        <div className="w-full h-4 bg-white border-b-4 border-black overflow-hidden relative">
          <motion.div 
            className="h-full bg-gumroad-yellow border-r-4 border-black"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tighter">
              {step === 1 && "Flex Financial Discipline"}
              {step === 2 && "The Basics"}
              {step === 3 && "Your Safety Net"}
            </h1>
            <p className="text-black font-bold mt-4 text-xs uppercase tracking-widest opacity-60">
              {step === 1 && "Let's set up your profile and start your journey towards total financial discipline."}
              {step === 2 && "Tell us a bit about your income so we can calculate your potential."}
              {step === 3 && "Let's calculate your exact FIRE number and emergency targets."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex justify-center mb-8">
                  <div className="w-28 h-28 border-4 border-black bg-gumroad-pink text-black flex items-center justify-center neo-brutalism-shadow-sm overflow-hidden p-3">
                    <img 
                      src={logoImg} 
                      alt="FinFlex Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Your Age</label>
                  <input type="number" value={formData.age} onChange={e => updateForm('age', e.target.value)} placeholder="e.g. 24" className="w-full px-4 py-4 bg-white border-4 border-black font-black text-xl outline-none focus:bg-gumroad-pink/10 transition-all placeholder:text-black/20" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Monthly Income (In-Hand)</label>
                  <div className="relative">
                    <IndianRupee size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                    <input type="number" value={formData.monthly_income} onChange={e => updateForm('monthly_income', e.target.value)} placeholder="e.g. 50000" className="w-full pl-12 pr-4 py-4 bg-white border-4 border-black font-black text-xl outline-none focus:bg-gumroad-yellow/10 transition-all placeholder:text-black/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Household Average Income (Optional)</label>
                  <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2 border-l-2 border-black pl-2">If you share expenses with a partner.</p>
                  <div className="relative">
                    <IndianRupee size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                    <input type="number" value={formData.household_income} onChange={e => updateForm('household_income', e.target.value)} placeholder="e.g. 120000" className="w-full pl-12 pr-4 py-4 bg-white border-4 border-black font-black text-xl outline-none focus:bg-gumroad-yellow/10 transition-all placeholder:text-black/20" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Savings</label>
                    <div className="relative">
                      <IndianRupee size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                      <input type="number" value={formData.current_savings} onChange={e => updateForm('current_savings', e.target.value)} placeholder="0" className="w-full pl-10 pr-4 py-3 bg-white border-4 border-black font-bold outline-none text-sm focus:bg-gumroad-pink/10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Expenses</label>
                    <div className="relative">
                      <IndianRupee size={16} strokeWidth={3} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" />
                      <input type="number" value={formData.monthly_expenses} onChange={e => updateForm('monthly_expenses', e.target.value)} placeholder="30000" className="w-full pl-10 pr-4 py-3 bg-white border-4 border-black font-bold outline-none text-sm focus:bg-gumroad-pink/10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">FIRE Target Number</label>
                  <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2 border-l-2 border-black pl-2">Typically 30x your annual expenses.</p>
                  <div className="relative">
                    <IndianRupee size={20} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                    <input type="number" value={formData.fire_target} onChange={e => updateForm('fire_target', e.target.value)} placeholder="10000000" className="w-full pl-12 pr-4 py-4 bg-gumroad-yellow/10 border-4 border-black font-black text-2xl text-black outline-none focus:bg-gumroad-yellow/20 transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Risk Tolerance</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['low', 'medium', 'high'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateForm('risk_tolerance', level)}
                        className={cn(
                          "py-3 px-3 border-4 font-black uppercase tracking-widest text-[10px] transition-all",
                          formData.risk_tolerance === level 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-black border-black hover:bg-gumroad-pink"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="mt-12 flex items-center justify-between pt-8 border-t-4 border-black">
            {step > 1 ? (
              <motion.button 
                whileHover={{ x: -2, y: 2, boxShadow: 'none' }}
                onClick={prevStep} 
                className="flex items-center gap-2 px-6 py-3 border-4 border-black bg-white text-black font-black uppercase tracking-widest text-xs neo-brutalism-shadow-xs cursor-pointer transition-all"
              >
                <ArrowLeft size={16} strokeWidth={3} /> Back
              </motion.button>
            ) : <div />}

            {step < 3 ? (
              <motion.button 
                whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
                onClick={nextStep} 
                className="flex items-center gap-2 px-8 py-3 bg-gumroad-pink text-black border-4 border-black font-black uppercase tracking-widest text-xs neo-brutalism-shadow-sm cursor-pointer transition-all"
              >
                Continue <ArrowRight size={16} strokeWidth={3} />
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
                onClick={handleFinish} 
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-3 bg-black text-white border-4 border-black font-black uppercase tracking-widest text-xs neo-brutalism-shadow-sm cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} strokeWidth={3} />} 
                {isLoading ? 'Saving...' : 'Finish Setup'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
