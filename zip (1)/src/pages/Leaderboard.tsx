import { Trophy, Medal, Award, Star } from 'lucide-react';
import { useStore } from '../store';

export function Leaderboard() {
  const { balance, portfolio, achievements } = useStore();
  
  // Calculate current user's total value (using average price as a fallback for simplicity in leaderboard)
  // In a real app, this would be calculated server-side with live prices
  const portfolioValue = portfolio.reduce((total, item) => total + (item.shares * item.averagePrice), 0);
  const totalValue = balance + portfolioValue;

  // Mock users for the leaderboard
  const mockUsers = [
    { id: '1', name: 'Warren Buffet', value: 15420.50, isCurrentUser: false },
    { id: '2', name: 'Diamond Hands', value: 8930.20, isCurrentUser: false },
    { id: '3', name: 'Stonk Master', value: 5240.10, isCurrentUser: false },
    { id: '4', name: 'Paper Trader', value: 1200.00, isCurrentUser: false },
    { id: '5', name: 'Buy High Sell Low', value: 420.69, isCurrentUser: false },
    { id: 'me', name: 'You', value: totalValue, isCurrentUser: true }
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard & Achievements
        </h1>
        <p className="text-slate-400 mt-1">See how you stack up against other traders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-800/30">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Medal className="h-5 w-5 text-emerald-500" />
                Global Rankings
              </h2>
            </div>
            
            <div className="divide-y divide-slate-800">
              {mockUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className={`p-6 flex items-center justify-between transition-colors ${
                    user.isCurrentUser ? 'bg-emerald-900/20 border-l-4 border-emerald-500' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                        index === 1 ? 'bg-slate-300/20 text-slate-300' : 
                        index === 2 ? 'bg-amber-700/20 text-amber-600' : 
                        'bg-slate-800 text-slate-400'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className={`font-bold ${user.isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                        {user.name}
                      </h3>
                      <p className="text-sm text-slate-400">Trader</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg text-white">
                      ${user.value.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Your Achievements
            </h2>
            
            {achievements.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400">Make trades to unlock achievements!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex gap-4">
                    <div className="bg-purple-500/20 p-3 rounded-lg h-fit">
                      <Star className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{achievement.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{achievement.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
