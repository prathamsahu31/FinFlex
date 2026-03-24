/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, CreditCard, TrendingUp, BookOpen, Bot,
  Search, Bell, Menu, X, Wrench, Calendar, LogOut, Users, User as UserIcon, MoreVertical, Pin, PinOff
} from 'lucide-react';
import { cn } from './utils';
import Login from './Login';
import Landing from './Landing';
import Onboarding from './Onboarding';
import PullToRefresh from './PullToRefresh';
import { supabase } from './lib/supabase';

import { TABS, TOOLS_METADATA } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [pinnedToolIds, setPinnedToolIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('finflex_pinned_tools');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('finflex_pinned_tools', JSON.stringify(pinnedToolIds));
  }, [pinnedToolIds]);

  const togglePinTool = (toolId: string) => {
    setPinnedToolIds(prev => 
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

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
    // Safety timeout to ensure we don't get stuck on the loading screen
    const timeout = setTimeout(() => {
      setIsInitializing(false);
    }, 10000);

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
        clearTimeout(timeout);
        setIsInitializing(false);
      }).catch(() => {
        clearTimeout(timeout);
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

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    } else {
      clearTimeout(timeout);
      setIsInitializing(false);
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const handleRefresh = async () => {
    if (session?.user) {
      await loadProfile(session.user.id);
      // Trigger a small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center grid-bg">
        <div className="w-20 h-20 border-4 border-black bg-gumroad-yellow flex items-center justify-center text-black neo-brutalism-shadow-lg">
          <img 
            src="https://lh3.googleusercontent.com/aida/ADBb0ugmnrvLWzVOL6D08TQZVGQwliZk63CMaFypWY-WxxTMWZ4-bzrWw1S4P7qkyTrz6RpiXTS46gK5MgU7YzanAebC1edYRelKK0nyCHFDc0TpfrsO8N7TOGFk5OnBXPzBQXmO0iH-E9HQeJT1wHvO0YYDGixNGo1zGe77jEXizUXG9PbhllqOF3xgikndex24TJPa6A1YBOVUN1p1_MGsjTM691oSq7zkN60lZGzmN0uwDNgb603t6Ux-fNGe" 
            alt="FinFlex" 
            className="w-14 h-14"
          />
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

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || TABS[0].component;
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
            <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center overflow-hidden neo-brutalism-shadow">
              <img 
                src="https://lh3.googleusercontent.com/aida/ADBb0ugmnrvLWzVOL6D08TQZVGQwliZk63CMaFypWY-WxxTMWZ4-bzrWw1S4P7qkyTrz6RpiXTS46gK5MgU7YzanAebC1edYRelKK0nyCHFDc0TpfrsO8N7TOGFk5OnBXPzBQXmO0iH-E9HQeJT1wHvO0YYDGixNGe77jEXizUXG9PbhllqOF3xgikndex24TJPa6A1YBOVUN1p1_MGsjTM691oSq7zkN60lZGzmN0uwDNgb603t6Ux-fNGe" 
                alt="Logo"
                className="w-full h-full object-cover"
              />
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

          {/* Pinned Tools Section */}
          {pinnedToolIds.length > 0 && (
            <div className="pt-6 space-y-3">
              <div className="flex items-center gap-2 px-4 mb-2">
                <Pin size={14} strokeWidth={3} className="text-black/40" />
                <span className="text-[10px] font-black font-label text-black/40 uppercase tracking-widest">Pinned Tools</span>
              </div>
              {pinnedToolIds.map(toolId => {
                const toolMetadata = TOOLS_METADATA.find(t => t.id === toolId);
                if (!toolMetadata) return null;
                const Icon = toolMetadata.icon;

                return (
                  <motion.button
                    key={toolId}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      setActiveTab('tools');
                      setSelectedToolId(toolId);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 border-2 border-black text-[10px] font-black font-headline uppercase tracking-widest transition-all bg-white hover:bg-gumroad-yellow text-black"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={14} strokeWidth={3} />
                      {toolMetadata.title.split(' ')[0]}
                    </div>
                    <Pin size={10} strokeWidth={3} className="text-black/20" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t-4 border-black bg-white relative" ref={profileMenuRef}>
          {/* Profile Menu Popover */}
          {isProfileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-4 right-4 mb-2 bg-white border-4 border-black neo-brutalism-shadow-lg z-50 flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => {
                  setActiveTab('settings');
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gumroad-pink transition-colors font-black font-headline uppercase text-xs border-b-4 border-black text-left"
              >
                <UserIcon size={18} strokeWidth={3} />
                View Profile
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 hover:bg-error hover:text-white transition-colors font-black font-headline uppercase text-xs text-left"
              >
                <LogOut size={18} strokeWidth={3} />
                Sign Out
              </button>
            </motion.div>
          )}

          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={cn(
              "w-full flex items-center gap-3 p-3 border-4 border-black transition-all cursor-pointer neo-brutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
              isProfileMenuOpen ? "bg-gumroad-pink" : "bg-white"
            )}
          >
            <div className="w-10 h-10 border-2 border-black bg-gumroad-yellow flex-shrink-0 overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'Guest'}`} alt="User" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[10px] font-black font-headline uppercase truncate leading-tight text-black">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[8px] font-bold font-label truncate opacity-60 text-black uppercase tracking-widest mt-0.5">
                {user?.email}
              </p>
            </div>
            <MoreVertical size={16} strokeWidth={3} className="text-black/40" />
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

            <div className="flex items-center h-full">
              {/* Profile button removed from topbar as it's now in sidebar */}
            </div>
        </header>

        {/* Scrollable Content Area with Pull to Refresh */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="p-4 lg:p-8 min-h-full flex flex-col">
              <div className="flex-1">
                <ActiveComponent 
                  setActiveTab={setActiveTab} 
                  pinnedToolIds={pinnedToolIds} 
                  togglePinTool={togglePinTool}
                  defaultToolId={selectedToolId}
                  onToolOpen={() => setSelectedToolId(null)}
                />
              </div>
              
              {/* Footer */}
              <footer className="mt-12 py-8 border-t-4 border-black/10 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 font-black font-headline text-black/20 uppercase tracking-tighter text-xl">
                  <TrendingUp size={20} strokeWidth={3} />
                  <span>FinFlex</span>
                </div>
                
                <div className="flex flex-col gap-2 items-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black neo-brutalism-shadow-xs group cursor-default">
                    <span className="text-[10px] font-black font-label uppercase tracking-widest text-black/60">Made with</span>
                    <span className="text-lg animate-bounce inline-block">❤️</span>
                    <span className="text-[10px] font-black font-label uppercase tracking-widest text-black/60">in India</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gumroad-pink border-2 border-black neo-brutalism-shadow-xs group cursor-default">
                    <span className="text-[10px] font-black font-label uppercase tracking-widest text-black italic">Visitor #{localStorage.getItem('finflex_visit_count') || '1'}</span>
                  </div>
                </div>

                <p className="text-[10px] font-black font-label uppercase tracking-[0.2em] text-black/30 text-center max-w-md leading-relaxed px-4">
                  © {new Date().getFullYear()} FinFlex Financial Revolution. All Rights Reserved. 
                  <br className="sm:hidden" /> 
                  Built for the Provocateur. No Jargon. No Limits.
                </p>
                <div className="flex gap-6 mt-2 opacity-20 hover:opacity-100 transition-opacity">
                  {['Security', 'Privacy', 'Legal'].map(item => (
                    <button key={item} onClick={() => alert(`${item} page coming soon!`)} className="text-[9px] font-black font-label uppercase tracking-widest text-black hover:text-gumroad-pink transition-colors cursor-pointer bg-transparent">{item}</button>
                  ))}
                </div>
              </footer>
            </div>
          </PullToRefresh>
        </div>
      </main>
    </div>
  );
}
