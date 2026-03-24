/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  BookOpen, 
  Bot,
  Search,
  Bell,
  Menu,
  X,
  Wrench,
  Calendar,
  LogOut,
  Users,
  User as UserIcon
} from 'lucide-react';
import { cn } from './utils';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import Portfolio from './Portfolio';
import FlexDecks from './FlexDecks';
import AIAgent from './AIAgent';
import Tools from './Tools';
import BillSplit from './BillSplit';
import Login from './Login';
import Onboarding from './Onboarding';
import ProfileSettings from './ProfileSettings';
import { supabase } from './lib/supabase';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'transactions', label: 'Transactions', icon: CreditCard, component: Transactions },
  { id: 'bill-split', label: 'Bill Split', icon: Users, component: BillSplit },
  { id: 'portfolio', label: 'Portfolio & FIRE', icon: TrendingUp, component: Portfolio },
  { id: 'flex-decks', label: 'Flex-Decks', icon: BookOpen, component: FlexDecks },
  { id: 'ai-agent', label: 'AI Agent', icon: Bot, component: AIAgent },
  { id: 'tools', label: 'Tools', icon: Wrench, component: Tools },
  { id: 'settings', label: 'Settings', icon: UserIcon, component: ProfileSettings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const loadProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.error('Error loading profile:', error.message);
        return;
      }
      if (data) setProfile(data);
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  };

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          try {
            await loadProfile(session.user.id);
          } catch (err) {
            console.error('Failed to load profile during init:', err);
          }
        }
        setIsInitializing(false);
      }).catch(() => {
        setIsInitializing(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session?.user) {
          try {
            await loadProfile(session.user.id);
          } catch (err) {
            console.error('Failed to load profile on auth change:', err);
          }
        } else {
          setProfile(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setIsInitializing(false);
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white animate-pulse">
          <TrendingUp size={32} strokeWidth={3} />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (profile && profile.onboarding_completed === false) {
    return <Onboarding user={session.user} onComplete={() => loadProfile(session.user.id)} />;
  }

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || Dashboard;
  const user = session?.user;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <TrendingUp size={20} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">FinFlex</span>
              <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-widest mt-0.5">Flex Financial Discipline</span>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={18} className={cn(isActive ? "text-indigo-600" : "text-slate-400")} />
                {tab.label}
              </motion.button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-lg font-bold text-slate-900">
              {TABS.find(t => t.id === activeTab)?.label}
            </div>
          </div>

          <div className="flex-1 max-w-xl px-8 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <Calendar size={14} />
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            
            <button className="text-slate-500 hover:text-slate-700 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 lg:pl-6 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Guest'}`} alt="User" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}
