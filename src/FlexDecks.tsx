import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Check, X, RefreshCcw, Plus, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

const COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-fuchsia-600",
  "from-rose-500 to-red-600",
  "from-cyan-500 to-blue-600"
];

const INITIAL_DECKS = [
  { title: "The 50/30/20 Rule", content: "A simple budgeting framework: 50% for needs, 30% for wants, and 20% for savings.", front_text: "The 50/30/20 Rule" },
  { title: "Compound Interest", content: "It's the interest you earn on interest. Start early! $100/mo at 7% return over 30 years grows to over $120,000.", front_text: "Compound Interest" },
  { title: "Emergency Fund", content: "Aim to save 3-6 months of living expenses in a high-yield savings account.", front_text: "Emergency Fund" },
  { title: "Index Funds", content: "Picking individual stocks is risky. Index funds let you buy a tiny piece of hundreds of companies at once.", front_text: "Index Funds" }
];

export default function FlexDecks() {
  const [cards, setCards] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [swiped, setSwiped] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', content: '' });

  useEffect(() => {
    const initCards = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      // fetch decks
      let { data: decks } = await supabase.from('flex_decks').select('*').eq('user_id', user.id);
      let deckId: string;

      if (!decks || decks.length === 0) {
        // Create default deck
        const { data: newDeck } = await supabase.from('flex_decks').insert([{ user_id: user.id, title: 'General Finance' }]).select();
        deckId = newDeck![0].id;
        
        // Seed default cards
        const seedCards = INITIAL_DECKS.map(c => ({
          deck_id: deckId, front_text: c.front_text, back_text: c.content
        }));
        await supabase.from('flashcards').insert(seedCards);
      } else {
        deckId = decks[0].id;
      }

      const { data: flashcards } = await supabase.from('flashcards').select('*, flex_decks(title)').eq('flex_decks.user_id', user.id);
      
      if (flashcards) {
        const formatted = flashcards.map((c, i) => ({
          id: c.id,
          title: c.front_text,
          content: c.back_text,
          category: c.flex_decks?.title || 'Finance',
          color: COLORS[i % COLORS.length]
        }));
        setAllCards(formatted);
        setCards(formatted);
      }
      setIsLoading(false);
    };

    initCards();
  }, []);

  const handleSwipe = (id: string, direction: 'left' | 'right') => {
    setSwiped(prev => [...prev, id]);
    setTimeout(() => {
      setCards(prev => prev.filter(c => c.id !== id));
    }, 300);
  };

  const resetDecks = () => {
    setCards(allCards);
    setSwiped([]);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    // get first deck
    const { data: decks } = await supabase.from('flex_decks').select('id, title').eq('user_id', user.id).limit(1);
    const deck = decks?.[0];
    if (!deck) return;

    const { data, error } = await supabase.from('flashcards').insert([{
      deck_id: deck.id,
      front_text: newCard.title,
      back_text: newCard.content
    }]).select();

    if (!error && data) {
      const formattedCard = {
        id: data[0].id,
        title: data[0].front_text,
        content: data[0].back_text,
        category: deck.title,
        color: COLORS[allCards.length % COLORS.length]
      };
      setAllCards([formattedCard, ...allCards]);
      setCards([formattedCard, ...cards]);
      setShowAddModal(false);
      setNewCard({ title: '', content: '' });
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-8 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flex-Decks</h1>
          <p className="text-slate-500 text-sm mt-1">Swipe right to save, left to skip. Master your money in minutes.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus size={16} /> Add Card
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center min-h-[400px]">
        <AnimatePresence>
          {cards.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">You're all caught up!</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">You've reviewed all the Flex-Decks for today. Come back tomorrow for more financial wisdom.</p>
              <button 
                onClick={resetDecks}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCcw size={18} /> Review Again
              </button>
            </motion.div>
          ) : (
            cards.map((card, index) => {
              const isTop = index === cards.length - 1;
              
              return (
                <motion.div
                  key={card.id}
                  className={cn(
                    "absolute w-full max-w-sm aspect-[3/4] rounded-3xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing",
                    isTop ? "z-10" : "z-0 pointer-events-none"
                  )}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 100) {
                      handleSwipe(card.id, 'right');
                    } else if (info.offset.x < -100) {
                      handleSwipe(card.id, 'left');
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isTop ? 1 : 1 - (cards.length - 1 - index) * 0.05,
                    y: isTop ? 0 : (cards.length - 1 - index) * 20
                  }}
                  exit={{ 
                    x: swiped.includes(card.id) ? (Math.random() > 0.5 ? 500 : -500) : 0, 
                    opacity: 0, 
                    rotate: swiped.includes(card.id) ? (Math.random() > 0.5 ? 20 : -20) : 0 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={cn("w-full h-full bg-gradient-to-br p-8 flex flex-col text-white", card.color)}>
                    <div className="flex justify-between items-start mb-auto">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {card.category}
                      </span>
                      <span className="text-white/60 text-sm font-medium">
                        {cards.length - index}/{DECKS.length}
                      </span>
                    </div>
                    
                    <div className="mb-12 overflow-y-auto max-h-[60%] hide-scrollbar">
                      <h2 className="text-3xl font-bold mb-6 leading-tight">{card.title}</h2>
                      <p className="text-lg text-white/90 leading-relaxed">{card.content}</p>
                    </div>

                    <div className="flex justify-between items-center mt-auto">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50">
                        <X size={24} />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50">
                        <Check size={24} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
      
      {cards.length > 0 && (
        <div className="shrink-0 text-center mt-8 text-slate-400 text-sm flex items-center justify-center gap-8">
          <span className="flex items-center gap-2"><X size={16} /> Swipe Left to Skip</span>
          <span className="flex items-center gap-2">Swipe Right to Save <Check size={16} /></span>
        </div>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">New Flashcard</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddCard} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Front Text (Title)</label>
                  <input required type="text" value={newCard.title} onChange={e => setNewCard({...newCard, title: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none" placeholder="e.g. Rule of 72" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Back Text (Content)</label>
                  <textarea required value={newCard.content} onChange={e => setNewCard({...newCard, content: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none min-h-[100px]" placeholder="e.g. Formula to estimate the number of years required to double your investment." />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">Save Flashcard</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
