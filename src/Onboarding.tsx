import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { User, Briefcase, Target, ArrowRight, ArrowLeft, Loader2, IndianRupee } from 'lucide-react';
import { cn } from './utils';

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
    setIsLoading(true);
    try {
      // Create user avatar using initial of email
      const initial = user?.email?.charAt(0).toUpperCase() || 'U';
      const dicebearUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${initial}&backgroundColor=4f46e5&textColor=ffffff`;
      
      // Update Auth Metadata (Avatar)
      await supabase.auth.updateUser({
        data: { avatar_url: dicebearUrl }
      });

      // Update public.profiles table
      const { error } = await supabase.from('profiles').update({
        age: parseInt(formData.age) || null,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        household_income: parseFloat(formData.household_income) || 0,
        current_savings: parseFloat(formData.current_savings) || 0,
        monthly_expenses: parseFloat(formData.monthly_expenses) || 0,
        risk_tolerance: formData.risk_tolerance,
        fire_target: parseFloat(formData.fire_target) || 10000000,
        onboarding_completed: true
      }).eq('id', user.id);

      if (error) throw error;
      
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Failed to save profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white max-w-xl w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100"
      >
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 flex">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {step === 1 && "Flex Financial Discipline"}
              {step === 2 && "The Basics"}
              {step === 3 && "Your Safety Net"}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              {step === 1 && "Let's set up your profile and start your journey towards total financial discipline."}
              {step === 2 && "Tell us a bit about your income so we can calculate your potential."}
              {step === 3 && "Let's calculate your exact FIRE number and emergency targets."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shadow-inner">
                    <User size={40} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Age</label>
                  <input type="number" value={formData.age} onChange={e => updateForm('age', e.target.value)} placeholder="e.g. 24" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all outline-none" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monthly Income (In-Hand)</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={formData.monthly_income} onChange={e => updateForm('monthly_income', e.target.value)} placeholder="e.g. 50000" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Household Average Income (Optional)</label>
                  <p className="text-xs text-slate-500 mb-2">If you share expenses with a partner.</p>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={formData.household_income} onChange={e => updateForm('household_income', e.target.value)} placeholder="e.g. 120000" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all outline-none" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Savings</label>
                    <div className="relative">
                      <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" value={formData.current_savings} onChange={e => updateForm('current_savings', e.target.value)} placeholder="0" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monthly Expenses</label>
                    <div className="relative">
                      <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" value={formData.monthly_expenses} onChange={e => updateForm('monthly_expenses', e.target.value)} placeholder="30000" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">FIRE Target Number</label>
                  <p className="text-xs text-slate-500 mb-2">Typically 30x your annual expenses.</p>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" value={formData.fire_target} onChange={e => updateForm('fire_target', e.target.value)} placeholder="10000000" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none font-bold text-slate-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Risk Tolerance</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateForm('risk_tolerance', level)}
                        className={cn(
                          "py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-colors",
                          formData.risk_tolerance === level 
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
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
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm">
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium text-sm shadow-sm">
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                onClick={handleFinish} 
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-900 text-white rounded-xl transition-colors font-medium text-sm shadow-sm"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />} 
                {isLoading ? 'Saving...' : 'Finish Setup'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
