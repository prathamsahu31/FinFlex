/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  BookOpen, 
  Bot,
  Search,
  Bell,
  User,
  Menu,
  X,
  Wrench,
  Calendar
} from 'lucide-react';
import { cn } from './utils';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import AlgoSave from './AlgoSave';
import Portfolio from './Portfolio';
import FlareDecks from './FlareDecks';
import AIAgent from './AIAgent';
import Tools from './Tools';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'transactions', label: 'Transactions', icon: CreditCard, component: Transactions },
  { id: 'algo-save', label: 'Algo-Save', icon: PiggyBank, component: AlgoSave },
  { id: 'portfolio', label: 'Portfolio & FIRE', icon: TrendingUp, component: Portfolio },
  { id: 'flare-decks', label: 'Flare-Decks', icon: BookOpen, component: FlareDecks },
  { id: 'ai-agent', label: 'AI Agent', icon: Bot, component: AIAgent },
  { id: 'tools', label: 'Tools', icon: Wrench, component: Tools },
];

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || Dashboard;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
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
            Spendsin
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
              <button
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
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 text-sm text-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-indigo-600">
              <Bot size={20} />
            </div>
            <p className="font-semibold text-slate-800 mb-1">Help Center</p>
            <p className="text-slate-500 text-xs mb-4">Having trouble in Spendsin? Please contact us for more questions.</p>
            <button className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-xl transition-colors text-xs">
              Go To Help Center
            </button>
          </div>
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
              28 January 2025
            </div>
            
            <button className="text-slate-500 hover:text-slate-700 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 lg:pl-6 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
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
