import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';
import { Bell, Camera, CreditCard, IndianRupee, Loader2, LogOut, Mail, Save, Shield, TrendingUp, Trash2, User, Wallet } from 'lucide-react';

export default function ProfileSettings({ setActiveTab, user: initialUser, profile: initialProfile, onLogout }: TabComponentProps & { user: any, profile: any }) {
  const [user, setUser] = useState<any>(initialUser);
  const [profile, setProfile] = useState<any>(initialProfile);
  const [isLoading, setIsLoading] = useState(!initialUser || !initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    monthly_income: '',
    household_income: '',
    current_savings: '',
    monthly_expenses: '',
    fire_target: '',
    risk_tolerance: 'medium'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (initialUser && initialProfile) {
        setUser(initialUser);
        setProfile(initialProfile);
        setFormData({
          age: initialProfile.age?.toString() || '',
          monthly_income: initialProfile.monthly_income?.toString() || '',
          household_income: initialProfile.household_income?.toString() || '',
          current_savings: initialProfile.current_savings?.toString() || '',
          monthly_expenses: initialProfile.monthly_expenses?.toString() || '',
          fire_target: initialProfile.fire_target?.toString() || '',
          risk_tolerance: initialProfile.risk_tolerance || 'medium'
        });
        setIsLoading(false);
        return;
      }

      if (!supabase) return;
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      if (currentProfile) {
        setProfile(currentProfile);
        setFormData({
          age: currentProfile.age?.toString() || '',
          monthly_income: currentProfile.monthly_income?.toString() || '',
          household_income: currentProfile.household_income?.toString() || '',
          current_savings: currentProfile.current_savings?.toString() || '',
          monthly_expenses: currentProfile.monthly_expenses?.toString() || '',
          fire_target: currentProfile.fire_target?.toString() || '',
          risk_tolerance: currentProfile.risk_tolerance || 'medium'
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [initialUser, initialProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase.from('profiles').update({
        age: parseInt(formData.age) || null,
        monthly_income: parseFloat(formData.monthly_income) || 0,
        household_income: parseFloat(formData.household_income) || 0,
        current_savings: parseFloat(formData.current_savings) || 0,
        monthly_expenses: parseFloat(formData.monthly_expenses) || 0,
        fire_target: parseFloat(formData.fire_target) || 10000000,
        risk_tolerance: formData.risk_tolerance
      }).eq('id', user.id);
      
      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Profile & Settings</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Manage your financial baselines and preferences</p>
      </div>

      <div className="bg-white border-4 border-black neo-brutalism-shadow overflow-hidden flex flex-col">
        <div className="p-8 sm:p-10 border-b-4 border-black flex items-center gap-8 bg-gumroad-yellow">
          <div className="w-24 h-24 border-4 border-black bg-white flex items-center justify-center overflow-hidden neo-brutalism-shadow-sm shrink-0">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} strokeWidth={3} className="text-black" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black font-headline text-black uppercase tracking-tighter">{user?.email}</h2>
            <span className="inline-block mt-2 px-4 py-1.5 border-4 border-black bg-white text-black text-xs font-black uppercase tracking-widest neo-brutalism-shadow-xs">
              Onboarding Complete
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 sm:p-10 space-y-12 grid-bg">
          <div>
            <h3 className="text-xl font-black font-headline text-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-2 inline-block">Financial Baseline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-5 py-4 bg-white border-4 border-black font-bold outline-none focus:bg-gumroad-pink/10 transition-all" />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Monthly Income (₹)</label>
                <div className="relative">
                  <IndianRupee size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                  <input type="number" name="monthly_income" value={formData.monthly_income} onChange={handleChange} className="w-full pl-10 pr-5 py-4 bg-white border-4 border-black font-bold outline-none focus:bg-gumroad-pink/10 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Household Income (₹)</label>
                <div className="relative">
                  <IndianRupee size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                  <input type="number" name="household_income" value={formData.household_income} onChange={handleChange} className="w-full pl-10 pr-5 py-4 bg-white border-4 border-black font-bold outline-none focus:bg-gumroad-pink/10 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Current Savings (₹)</label>
                <div className="relative">
                  <IndianRupee size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                  <input type="number" name="current_savings" value={formData.current_savings} onChange={handleChange} className="w-full pl-10 pr-5 py-4 bg-white border-4 border-black font-bold outline-none focus:bg-gumroad-pink/10 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Monthly Expenses (₹)</label>
                <div className="relative">
                  <IndianRupee size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                  <input type="number" name="monthly_expenses" value={formData.monthly_expenses} onChange={handleChange} className="w-full pl-10 pr-5 py-4 bg-white border-4 border-black font-bold outline-none focus:bg-gumroad-pink/10 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">FIRE Target (₹)</label>
                <div className="relative">
                  <IndianRupee size={18} strokeWidth={3} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
                  <input type="number" name="fire_target" value={formData.fire_target} onChange={handleChange} className="w-full pl-10 pr-5 py-4 bg-gumroad-yellow/10 border-4 border-black font-black text-black outline-none focus:bg-gumroad-yellow/20 transition-all" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Risk Tolerance</label>
                <select name="risk_tolerance" value={formData.risk_tolerance} onChange={handleChange} className="w-full px-5 py-4 bg-white border-4 border-black font-bold outline-none appearance-none focus:bg-gumroad-pink/10 transition-all">
                  <option value="low">Low (Prefer FDs, PPF, Bonds)</option>
                  <option value="medium">Medium (Balanced Mutual Funds, Index Funds)</option>
                  <option value="high">High (Direct Equity, Crypto)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-10 border-t-4 border-black">
            <motion.button 
              whileHover={{ x: -2, y: 2, boxShadow: 'none' }}
              type="button" 
              onClick={onLogout} 
              className="flex items-center gap-2 px-6 py-3 text-black bg-white border-4 border-black font-black uppercase tracking-widest text-xs neo-brutalism-shadow-xs cursor-pointer transition-all hover:bg-gumroad-pink"
            >
              <LogOut size={18} strokeWidth={3} /> Sign Out
            </motion.button>

            <motion.button 
              whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
              type="submit" 
              disabled={isSaving} 
              className="flex items-center gap-2 px-8 py-3 bg-gumroad-yellow text-black border-4 border-black font-black uppercase tracking-widest text-xs neo-brutalism-shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} strokeWidth={3} />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
