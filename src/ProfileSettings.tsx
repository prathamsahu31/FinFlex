import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from './lib/supabase';
import { User, IndianRupee, Loader2, Save, LogOut } from 'lucide-react';

export default function ProfileSettings() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setFormData({
          age: data.age?.toString() || '',
          monthly_income: data.monthly_income?.toString() || '',
          household_income: data.household_income?.toString() || '',
          current_savings: data.current_savings?.toString() || '',
          monthly_expenses: data.monthly_expenses?.toString() || '',
          fire_target: data.fire_target?.toString() || '',
          risk_tolerance: data.risk_tolerance || 'medium'
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

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

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile & Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your financial baselines and preferences</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm shrink-0">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-indigo-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.email}</h2>
            <span className="inline-block mt-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              Onboarding Complete
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Financial Baseline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Income (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" name="monthly_income" value={formData.monthly_income} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Household Income (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" name="household_income" value={formData.household_income} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Savings (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" name="current_savings" value={formData.current_savings} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Expenses (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" name="monthly_expenses" value={formData.monthly_expenses} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">FIRE Target (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" name="fire_target" value={formData.fire_target} onChange={handleChange} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Risk Tolerance</label>
                <select name="risk_tolerance" value={formData.risk_tolerance} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-all">
                  <option value="low">Low (Prefer FDs, PPF, Bonds)</option>
                  <option value="medium">Medium (Balanced Mutual Funds, Index Funds)</option>
                  <option value="high">High (Direct Equity, Crypto)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors">
              <LogOut size={16} /> Sign Out
            </button>

            <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
