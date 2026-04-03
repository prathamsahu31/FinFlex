/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, CreditCard, TrendingUp, BookOpen, Bot,
  Search, Bell, Menu, X, Wrench, Calendar, LogOut, Users, User as UserIcon, MoreVertical, Pin, PinOff, Sun, Moon, ChevronLeft
} from 'lucide-react';
import { cn } from './utils';
import Login from './Login';
import Landing from './Landing';
import Onboarding from './Onboarding';
import FloatingAIChat from './FloatingAIChat';
import GlobalLoader from './components/GlobalLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import logoImg from './logo.png';

import { TABS, TOOLS_METADATA, ProfileSettings } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || TABS[0].id;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash || TABS[0].id);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

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

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('finflex_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('finflex_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
        console.error('Error loading profile:', error.message);
        return;
      }
      // If no profile found, we'll set an empty object with onboarding_completed: false
      // This will trigger the onboarding flow
      setProfile(data || { onboarding_completed: false });
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
      try {
        // Optimistically clear local state
        setSession(null);
        setProfile(null);
        
        await supabase.auth.signOut();
        
        // Clear all persistent storage
        localStorage.clear(); 
        sessionStorage.clear();
        
        // Force a hard reload to the home page to ensure all state is wiped
        window.location.replace(window.location.origin);
      } catch (err) {
        console.error("Critical logout failure:", err);
        // Fallback: still attempt to clear and redirect
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace(window.location.origin);
      }
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
    const SPLASH_VIDEO_URL = "https://github.com/prathamsahu31/FinFlex/raw/main/src/Splash%20Screen%20FinFlex%20(1).mp4";

    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
        {/* Background Video Splash */}
        {SPLASH_VIDEO_URL ? (
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80 z-0 bg-black"
          >
            <source src={SPLASH_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 grid-bg opacity-30 z-0 bg-zinc-950" />
        )}

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
             <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-gumroad-pink animate-bounce shadow-[0_0_15px_rgba(255,144,232,0.5)]" style={{ animationDelay: '0ms' }} />
               <div className="w-3 h-3 bg-gumroad-yellow animate-bounce shadow-[0_0_15px_rgba(255,189,3,0.5)]" style={{ animationDelay: '150ms' }} />
               <div className="w-3 h-3 bg-white animate-bounce shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ animationDelay: '300ms' }} />
             </div>
             <div className="flex flex-col items-center">
               <h2 className="font-headline font-black uppercase text-4xl text-white tracking-[0.2em] relative">
                 FINFLEX
                 <span className="absolute -right-12 -top-4 text-[10px] bg-gumroad-pink text-black px-2 py-1 border-2 border-white neo-brutalism-shadow-xs rotate-12">LOADING</span>
               </h2>
               <p className="mt-2 text-white/70 font-black text-xs uppercase tracking-[0.5em] animate-pulse">
                 Synchronizing Revolution
               </p>
             </div>
          </div>
          
        </motion.div>
        
        {/* Bottom Corner Label */}
        <div className="absolute bottom-10 right-10 z-20">
           <div className="bg-gumroad-pink border-4 border-black px-4 py-2 neo-brutalism-shadow-sm font-black text-xs uppercase tracking-widest text-black flex items-center gap-2">
              <div className="w-2 h-2 bg-black rounded-full animate-ping" />
              Establishing Revolution
           </div>
        </div>
      </div>
    );
  }

  if (!session) {
    if (showLanding) {
      return <Landing onGetStarted={() => setShowLanding(false)} />;
    }
    return <Login onBack={() => setShowLanding(true)} />;
  }

  if (profile?.onboarding_completed === false) {
    return <Onboarding user={session.user} onComplete={() => loadProfile(session.user.id)} />;
  }

  let ActiveComponent: any = TABS.find(t => t.id === activeTab)?.component;
  if (!ActiveComponent) {
    if (activeTab === 'settings') {
      ActiveComponent = ProfileSettings;
    } else {
      const toolMeta = TOOLS_METADATA.find(t => t.id === activeTab);
      if (toolMeta?.component) {
        ActiveComponent = toolMeta.component;
      } else if (toolMeta) {
        ActiveComponent = TABS.find(t => t.id === 'tools')?.component; // Fallback to tools directory viewer
      } else {
        ActiveComponent = TABS[0].component;
      }
    }
  }

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
          <div 
            className="flex items-center gap-3 font-black text-xl tracking-tight text-black cursor-pointer group"
            onClick={() => handleTabChange(TABS[0].id)}
          >
            <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center overflow-hidden neo-brutalism-shadow group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:neo-brutalism-shadow-lg transition-all">
              <img 
                src={logoImg}
                alt="FinFlex Logo"
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
                  handleTabChange(tab.id);
                  setIsSidebarOpen(false);
                }}
                transition={{ duration: 0.1 }}
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

          {/* Pinned Tools merged into Main Navigation */}
          {pinnedToolIds.map(toolId => {
            const toolMetadata = TOOLS_METADATA.find(t => t.id === toolId);
            if (!toolMetadata) return null;
            const Icon = toolMetadata.icon;
            const isActive = activeTab === toolId;

            return (
              <motion.button
                key={toolId}
                onClick={() => {
                  handleTabChange(toolId);
                  setIsSidebarOpen(false);
                }}
                transition={{ duration: 0.1 }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 border-4 text-sm font-black font-headline uppercase tracking-widest transition-all cursor-pointer",
                  isActive 
                    ? "bg-gumroad-pink border-black neo-brutalism-shadow text-black translate-x-1 translate-y-1" 
                    : "bg-white border-black text-black hover:bg-gumroad-yellow hover:neo-brutalism-shadow hover:-translate-y-1 hover:-translate-x-1"
                )}
              >
                <div className="flex-1 flex items-center gap-4 text-left">
                  <Icon size={20} strokeWidth={isActive ? 3 : 2} className="text-black" />
                  {toolMetadata.title}
                </div>
                <PinOff size={14} strokeWidth={2} className="text-black/30 hover:text-black transition-colors" onClick={(e) => { e.stopPropagation(); togglePinTool(toolId); }} />
              </motion.button>
            );
          })}
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
                  handleTabChange('settings');
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gumroad-pink transition-colors font-black font-headline uppercase text-xs border-b-4 border-black text-left"
              >
                <UserIcon size={18} strokeWidth={3} />
                View Profile
              </button>
              <button 
                onClick={async () => {
                  await handleLogout();
                  setIsProfileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-red-500 hover:text-white transition-colors font-black font-headline uppercase text-xs text-left"
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
              {activeTab === 'settings' ? 'Profile & Settings' : (TABS.find(t => t.id === activeTab)?.label || TOOLS_METADATA.find(t => t.id === activeTab)?.title)}
            </div>
          </div>

            <div className="flex items-center h-full gap-4">
              <button 
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                className={cn(
                  "w-12 h-12 border-4 border-black flex items-center justify-center neo-brutalism-shadow cursor-pointer transition-transform hover:-translate-y-1 hover:translate-x-1 group",
                  theme === 'light' ? "bg-black text-white hover:bg-gumroad-yellow hover:text-black" : "bg-white text-black hover:bg-gumroad-pink"
                )}
              >
                {theme === 'light' ? (
                  <Moon size={24} strokeWidth={3} className="group-hover:-rotate-12 transition-transform" />
                ) : (
                  <Sun size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                )}
              </button>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-background relative">
          <div className="p-4 lg:p-8 min-h-full flex flex-col">
            {/* Tool Back Button */}
            {!TABS.find(t => t.id === activeTab) && activeTab !== 'settings' && (
              <button 
                onClick={() => handleTabChange('tools')}
                className="mb-8 flex items-center gap-2 font-black font-headline uppercase tracking-widest text-black/50 hover:text-gumroad-pink transition-colors w-fit group"
              >
                <ChevronLeft size={20} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                Back to Tools
              </button>
            )}
            
            <div className="flex-1">
              <Suspense fallback={<GlobalLoader />}>
                <ErrorBoundary>
                  <ActiveComponent 
                    setActiveTab={handleTabChange} 
                    pinnedToolIds={pinnedToolIds} 
                    togglePinTool={togglePinTool}
                    defaultToolId={selectedToolId || (!TABS.find(t => t.id === activeTab) && activeTab !== 'settings' ? activeTab : null)}
                    onToolOpen={() => setSelectedToolId(null)}
                    onLogout={handleLogout}
                    user={user}
                    profile={profile}
                  />
                </ErrorBoundary>
              </Suspense>
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
        </div>
      </main>
      <FloatingAIChat user={user} profile={profile} />
    </div>
  );
}
