/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, CreditCard, TrendingUp, BookOpen, Bot,
  Search, Bell, Menu, X, Wrench, Calendar, LogOut, Users, User as UserIcon
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
import Landing from './Landing';
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
  const [showLanding, setShowLanding] = useState(true);

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center grid-bg">
        <div className="w-20 h-20 border-4 border-black bg-gumroad-yellow flex items-center justify-center text-black neo-brutalism-shadow-lg animate-pulse">
          <TrendingUp size={40} strokeWidth={3} />
        </div>
        <p className="mt-6 font-headline font-black uppercase text-xl text-black">Loading FinFlex...</p>
      </div>
    );
  }

  if (!session) {
    if (showLanding) {
      return <Landing onGetStarted={() => setShowLanding(false)} />;
    }
    return <Login onBack={() => setShowLanding(true)} />;
  }

  if (profile && profile.onboarding_completed === false) {
    return <Onboarding user={session.user} onComplete={() => loadProfile(session.user.id)} />;
  }

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || Dashboard;
  const user = session?.user;

  return (
    <div className="flex h-screen bg-background font-body text-on-background overflow-hidden selection:bg-gumroad-pink selection:text-black">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r-4 border-black transition-transform duration-300 ease-in-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-20 px-6 border-b-4 border-black bg-gumroad-yellow">
          <div className="flex items-center gap-3 font-black text-xl tracking-tight text-black">
            <div className="w-10 h-10 border-2 border-black bg-gumroad-pink flex items-center justify-center text-black neo-brutalism-shadow">
              <TrendingUp size={24} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black font-headline uppercase tracking-tight text-black leading-none">FinFlex</span>
              <span className="text-[10px] font-black font-label text-black uppercase tracking-widest mt-1">Financial Revolution</span>
            </div>
          </div>
          <button className="lg:hidden text-black hover:text-gumroad-pink transition-colors cursor-pointer" onClick={() => setIsSidebarOpen(false)}>
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto grid-bg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 border-4 text-sm font-black font-headline uppercase tracking-widest transition-all cursor-pointer",
                  isActive 
                    ? "bg-gumroad-pink border-black neo-brutalism-shadow text-black translate-x-1 translate-y-1" 
                    : "bg-white border-black text-black hover:bg-gumroad-yellow hover:neo-brutalism-shadow hover:-translate-y-1 hover:-translate-x-1"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 3 : 2} className="text-black" />
                {tab.label}
              </motion.button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t-4 border-black bg-white">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 border-4 border-black text-sm font-black font-headline uppercase text-black bg-white hover:bg-error hover:text-white neo-brutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
          >
            <LogOut size={20} strokeWidth={3} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Topbar */}
        <header className="h-20 bg-white border-b-4 border-black flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-black hover:text-gumroad-pink transition-colors cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={28} strokeWidth={3} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-3xl font-black font-headline uppercase text-black tracking-tight">
              {TABS.find(t => t.id === activeTab)?.label}
            </div>
          </div>

          <div className="flex-1 max-w-xl px-8 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} strokeWidth={3} />
              <input 
                type="text" 
                placeholder="SEARCH FOR TRANSACTIONS, DECKS..." 
                className="w-full pl-12 pr-4 py-3 bg-white border-4 border-black focus:bg-gumroad-pink/10 focus:outline-none font-bold font-label tracking-widest text-sm placeholder-black/50 text-black transition-colors neo-brutalism-shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8 h-full">
            <div className="hidden md:flex items-center gap-2 text-xs font-black font-label tracking-widest uppercase text-black bg-gumroad-yellow px-4 py-2 border-2 border-black neo-brutalism-shadow">
              <Calendar size={16} strokeWidth={3} />
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            
            <button className="text-black hover:text-gumroad-pink relative transition-colors cursor-pointer">
              <Bell size={28} strokeWidth={3} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error border-2 border-black rounded-none animate-pulse"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 lg:pl-8 border-l-4 border-black h-full">
              <div className="w-12 h-12 border-2 border-black bg-gumroad-pink flex items-center justify-center text-black font-black overflow-hidden neo-brutalism-shadow">
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
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}
