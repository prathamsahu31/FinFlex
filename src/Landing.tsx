import React, { useState, useEffect } from 'react';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  const [stats, setStats] = useState({
    rebels: '40k+',
    money: '$2M+',
    rating: '4.9/5',
    support: '24/7',
    visits: 0
  });

  useEffect(() => {
    // Get and increment visit count from localStorage
    const savedVisits = localStorage.getItem('finflex_visit_count');
    const visitCount = savedVisits ? parseInt(savedVisits, 10) + 1 : 1;
    localStorage.setItem('finflex_visit_count', visitCount.toString());

    // Calculate dynamic stats based on visit count
    const rebelsBase = 40000;
    const moneyBase = 2.0;
    
    setStats({
      rebels: (rebelsBase + visitCount).toLocaleString() + '+',
      money: '$' + (moneyBase + (visitCount * 0.01)).toFixed(2) + 'M+',
      rating: '4.9/5',
      support: '24/7',
      visits: visitCount
    });
  }, []);

  return (
    <div className="bg-background text-on-background font-body antialiased min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b-4 border-black">
        <div className="flex justify-between items-center px-6 py-3 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <img 
              alt="Finflex Logo" 
              className="h-16"
              src="https://lh3.googleusercontent.com/aida/ADBb0ugmnrvLWzVOL6D08TQZVGQwliZk63CMaFypWY-WxxTMWZ4-bzrWw1S4P7qkyTrz6RpiXTS46gK5MgU7YzanAebC1edYRelKK0nyCHFDc0TpfrsO8N7TOGFk5OnBXPzBQXmO0iH-E9HQeJT1wHvO0YYDGixNGo1zGe77jEXizUXG9PbhllqOF3xgikndex24TJPa6A1YBOVUN1p1_MGsjTM691oSq7zkN60lZGzmN0uwDNgb603t6Ux-fNGe" 
            />
          </div>
          <div className="hidden md:flex items-center space-x-0 border-x-4 border-black h-full">
            <a className="px-6 py-3 bg-gumroad-pink text-black border-r-4 border-black font-headline font-bold uppercase tracking-tight hover:bg-white transition-colors" href="#">Dashboard</a>
            <a className="px-6 py-3 text-black border-r-4 border-black font-headline font-bold uppercase tracking-tight hover:bg-gumroad-yellow transition-colors" href="#">Flex-O-Meter</a>
            <a className="px-6 py-3 text-black border-r-4 border-black font-headline font-bold uppercase tracking-tight hover:bg-gumroad-pink transition-colors" href="#">Insights</a>
            <a className="px-6 py-3 text-black font-headline font-bold uppercase tracking-tight hover:bg-gumroad-yellow transition-colors" href="#">Community</a>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-gumroad-black text-white px-6 py-3 border-2 border-black neo-brutalism-shadow font-headline font-bold uppercase tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
            Join Now
          </button>
        </div>
      </nav>
      
      <main className="pt-28 px-4 md:px-8 pb-12 max-w-[1440px] mx-auto">
        {/* Hero Section Container */}
        <section className="border-4 border-black bg-white mb-12 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-7 p-8 md:p-16 border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-gumroad-yellow/10">
              <span className="inline-block bg-gumroad-yellow border-2 border-black text-black font-label text-xs uppercase font-black tracking-widest px-4 py-2 mb-8 neo-brutalism-shadow">
                Financial Revolution 2.0
              </span>
              <h1 className="font-headline font-black text-5xl md:text-8xl leading-[0.85] tracking-tight text-black mb-8">
                MASTER YOUR <span className="bg-gumroad-pink px-2">MONEY,</span><br />
                FLEX YOUR <span className="underline decoration-8 underline-offset-4">DISCIPLINE</span>
              </h1>
              <p className="text-xl md:text-2xl text-black font-medium max-w-xl mb-12 leading-tight border-l-8 border-black pl-6">
                The finance app that speaks your language. No jargon, just pure financial empowerment for the provocateur in you.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <button
                  onClick={onGetStarted}
                  className="bg-gumroad-pink text-black border-4 border-black px-10 py-6 text-xl font-headline font-black uppercase neo-brutalism-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                  Join the Movement
                </button>
                <button
                  onClick={onGetStarted}
                  className="bg-white text-black border-4 border-black px-10 py-6 text-xl font-headline font-black uppercase neo-brutalism-shadow-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
                  Watch Manifesto
                </button>
              </div>
              <div className="mt-16 flex items-center gap-6 border-t-4 border-black pt-8">
                <div className="flex -space-x-2">
                  <img alt="User" className="w-14 h-14 border-4 border-black object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-xsRJL_wC1eYMKGeMouQ-tSrF_a4ffZ1b58ezN8iQZhddftefZf0FKewzkdqJ6rb7LBgbBbS_31nppWBhnbBeapYo8wZ-0Jh3EKClJLF7ObWNSq3YdPz30WyCe3H-22EffJCErBYceIWyOiWhb9InX6bNIqs6ILekx7OXlp6IS75uOrJarj77QQmb42kkPpTmtVbBmb8i6syaZuDXMz13NR9O1x7hp80sc2ewjWBQNvGUr-jYPOHU5zLkUHQLwKWLlT9euD6BBZSs" />
                  <img alt="User" className="w-14 h-14 border-4 border-black object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYiI9IZTBMP_Toq0alCYsR8A0dv2ArwYDIb7bfHqSG9pBO05G4SoCHG15KUG7uosLZUPYzk7Hz6s-feAYgEEbKCf7K6C3DrgCvaEB9dkg9eXeNF7O0ouYx3jLFsxrUOsZz8-W2okdvvjD6oJjI7vVrnBmjJiHy_EJnag9eRrK7S1BNhjy9fsS9NZvHrZOusYQHCjPmpxXFDJ8hAdO-rUnep0AdbP3q3p0cmFvEQUdTvwmJelVUUOuewe6ViKtmnI76fNNFizv9YJfT" />
                  <div className="w-14 h-14 border-4 border-black flex items-center justify-center bg-gumroad-pink text-black font-black text-sm">
                    +40k
                  </div>
                </div>
                <p className="font-label text-sm uppercase font-black tracking-widest">
                  Growing faster than <span className="bg-gumroad-yellow px-1">inflation</span>
                </p>
              </div>
            </div>
            {/* Right Visuals */}
            <div className="lg:col-span-5 relative bg-white grid-bg flex items-center justify-center p-8 overflow-hidden min-h-[400px]">
              {/* Neobrutalist Cards Container */}
              <div className="relative w-full max-w-sm mx-auto mt-12 mb-12">
                {/* Main Balance Card */}
                <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow-lg mb-8 relative z-20">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-black text-5xl font-black" data-icon="account_balance_wallet">account_balance_wallet</span>
                    <span className="font-black text-xs bg-gumroad-yellow border-2 border-black px-3 py-1 neo-brutalism-shadow">TOTAL BALANCE</span>
                  </div>
                  <h2 className="font-headline font-black text-5xl mb-2">$14,582.00</h2>
                  <p className="text-black bg-gumroad-pink border-2 border-black inline-flex items-center gap-2 px-3 py-1 font-black text-sm">
                    <span className="material-symbols-outlined font-black" data-icon="trending_up">trending_up</span> +12.4% THIS MONTH
                  </p>
                </div>
                {/* Flex-O-Meter Card */}
                <div className="bg-gumroad-pink border-4 border-black p-6 neo-brutalism-shadow absolute -bottom-16 -left-4 md:-left-12 z-30 w-full max-w-[105%]">
                  <h3 className="font-headline font-black text-2xl mb-4">FLEX-O-METER</h3>
                  <div className="h-10 w-full bg-white border-4 border-black overflow-hidden mb-2">
                    <div className="h-full bg-black w-3/4"></div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-black text-xs uppercase">Spending Alert</span>
                    <span className="font-black text-xs uppercase">75% OF GOAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Why Finflex Section */}
        <section className="border-4 border-black bg-black overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-8 p-12 bg-white border-b-4 md:border-b-0 md:border-r-4 border-black">
              <h2 className="font-headline font-black text-5xl md:text-8xl tracking-tighter mb-6 uppercase">Why Finflex?</h2>
              <p className="text-2xl font-bold max-w-2xl text-black">We stripped away the boring bits of banking and replaced them with raw power and visual clarity.</p>
            </div>
            <div className="md:col-span-4 bg-gumroad-yellow flex items-center justify-center p-8 border-b-4 md:border-b-0 border-black">
              <span className="material-symbols-outlined text-[120px] text-black font-black" data-icon="bolt">bolt</span>
            </div>
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 border-t-4 border-black">
              <div className="p-10 border-b-4 md:border-b-0 md:border-r-4 border-black bg-white hover:bg-gumroad-pink transition-colors group cursor-default">
                <span className="material-symbols-outlined text-6xl text-black mb-8 block font-black group-hover:scale-110 transition-transform" data-icon="speed">speed</span>
                <h3 className="font-headline font-black text-3xl mb-4 uppercase">Lightning Fast</h3>
                <p className="text-lg font-bold">Our AI engine analyzes your spending in real-time, giving you the edge you need to stay ahead.</p>
              </div>
              <div className="p-10 border-b-4 md:border-b-0 md:border-r-4 border-black bg-gumroad-yellow hover:bg-white transition-colors group cursor-default">
                <span className="material-symbols-outlined text-6xl text-black mb-8 block font-black group-hover:scale-110 transition-transform" data-icon="shield_person">shield_person</span>
                <h3 className="font-headline font-black text-3xl mb-4 uppercase">You-Centric</h3>
                <p className="text-lg font-bold">Your data is your property. We use editorial-grade encryption to keep your flex secure.</p>
              </div>
              <div className="p-10 bg-gumroad-pink hover:bg-gumroad-yellow transition-colors group cursor-default">
                <span className="material-symbols-outlined text-6xl text-black mb-8 block font-black group-hover:scale-110 transition-transform" data-icon="group_add">group_add</span>
                <h3 className="font-headline font-black text-3xl mb-4 uppercase">The Collective</h3>
                <p className="text-lg font-bold">Connect with others, share your wins, and join community challenges to level up together.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Numbers Section */}
        <section className="border-4 border-black bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="text-center p-8 md:p-12 border-b-4 md:border-b-0 border-r-4 border-black hover:bg-gumroad-pink transition-colors">
              <p className="font-headline font-black text-4xl md:text-6xl text-black mb-2">{stats.rebels}</p>
              <p className="font-label uppercase font-black tracking-widest text-xs md:text-sm">Active Rebels</p>
            </div>
            <div className="text-center p-8 md:p-12 border-b-4 md:border-b-0 md:border-r-4 border-black hover:bg-gumroad-yellow transition-colors">
              <p className="font-headline font-black text-4xl md:text-6xl text-black mb-2">{stats.money}</p>
              <p className="font-label uppercase font-black tracking-widest text-xs md:text-sm">Money Tracked</p>
            </div>
            <div className="text-center p-8 md:p-12 border-r-4 border-black hover:bg-gumroad-pink transition-colors">
              <p className="font-headline font-black text-4xl md:text-6xl text-black mb-2">{stats.rating}</p>
              <p className="font-label uppercase font-black tracking-widest text-xs md:text-sm">App Rating</p>
            </div>
            <div className="text-center p-8 md:p-12 hover:bg-gumroad-yellow transition-colors">
              <p className="font-headline font-black text-4xl md:text-6xl text-black mb-2">{stats.support}</p>
              <p className="font-label uppercase font-black tracking-widest text-xs md:text-sm">Live Support</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 px-8 bg-black border-t-4 border-black mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-12 max-w-[1440px] mx-auto">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="flex items-center gap-4">
              <img alt="Finflex" className="h-12" src="https://lh3.googleusercontent.com/aida/ADBb0ugmnrvLWzVOL6D08TQZVGQwliZk63CMaFypWY-WxxTMWZ4-bzrWw1S4P7qkyTrz6RpiXTS46gK5MgU7YzanAebC1edYRelKK0nyCHFDc0TpfrsO8N7TOGFk5OnBXPzBQXmO0iH-E9HQeJT1wHvO0YYDGixNGo1zGe77jEXizUXG9PbhllqOF3xgikndex24TJPa6A1YBOVUN1p1_MGsjTM691oSq7zkN60lZGzmN0uwDNgb603t6Ux-fNGe" />
              <div className="text-white font-black text-4xl font-headline italic tracking-tighter">FINFLEX</div>
            </div>
            <p className="text-white/60 font-black uppercase tracking-widest text-sm text-center md:text-left max-w-xs">
              © 2024 Finflex. No-line finance for the provocateur.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black neo-brutalism-shadow-xs group cursor-default">
                <span className="text-[10px] font-black font-label uppercase tracking-widest text-black">Made with</span>
                <span className="text-lg animate-bounce inline-block">❤️</span>
                <span className="text-[10px] font-black font-label uppercase tracking-widest text-black">in India</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gumroad-pink border-2 border-black neo-brutalism-shadow-xs group cursor-default">
                <span className="text-[10px] font-black font-label uppercase tracking-widest text-black italic">Visitor #{stats.visits}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            <a className="text-white hover:text-gumroad-pink transition-colors font-black uppercase tracking-widest text-sm border-b-2 border-transparent hover:border-gumroad-pink pb-1" href="#">Terms</a>
            <a className="text-white hover:text-gumroad-yellow transition-colors font-black uppercase tracking-widest text-sm border-b-2 border-transparent hover:border-gumroad-yellow pb-1" href="#">Privacy</a>
            <a className="text-white hover:text-gumroad-pink transition-colors font-black uppercase tracking-widest text-sm border-b-2 border-transparent hover:border-gumroad-pink pb-1" href="#">Manifesto</a>
            <a className="text-white hover:text-gumroad-yellow transition-colors font-black uppercase tracking-widest text-sm border-b-2 border-transparent hover:border-gumroad-yellow pb-1" href="#">Support</a>
          </div>
          <div className="flex gap-6">
            <div className="w-14 h-14 border-4 border-white flex items-center justify-center text-white hover:bg-gumroad-pink hover:text-black hover:border-black transition-all cursor-pointer neo-brutalism-shadow bg-transparent">
              <span className="material-symbols-outlined text-2xl font-black" data-icon="public">public</span>
            </div>
            <div className="w-14 h-14 border-4 border-white flex items-center justify-center text-white hover:bg-gumroad-yellow hover:text-black hover:border-black transition-all cursor-pointer neo-brutalism-shadow bg-transparent">
              <span className="material-symbols-outlined text-2xl font-black" data-icon="podcasts">podcasts</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
