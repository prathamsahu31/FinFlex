import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { LineChart, Wallet, Trophy, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

export function Navbar() {
  const balance = useStore(state => state.balance);
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: LineChart },
    { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <LineChart className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">TradeSim</span>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-8">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-slate-800 text-emerald-400" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span className="font-mono font-medium text-emerald-400">
                ${balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
