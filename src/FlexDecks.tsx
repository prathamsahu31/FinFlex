import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, BookOpen, Brain, Sparkles, X, Check, ArrowRight, RotateCcw, Loader2, RefreshCcw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';

const COLORS = [
  "bg-gumroad-pink",
  "bg-gumroad-yellow",
  "bg-black text-white",
  "bg-white text-black",
  "bg-gumroad-pink",
  "bg-gumroad-yellow"
];

const INITIAL_DECKS = [
  { title: "The 50/30/20 Rule", content: "A simple budgeting framework: 50% for needs, 30% for wants, and 20% for savings.", front_text: "The 50/30/20 Rule" },
  { title: "Compound Interest", content: "It's the interest you earn on interest. Start early! ₹10,000/mo at 12% return over 20 years grows to over ₹1 Crore.", front_text: "Compound Interest" },
  { title: "Emergency Fund", content: "Aim to save 3-6 months of living expenses in a high-yield savings account.", front_text: "Emergency Fund" },
  { title: "Index Funds", content: "Picking individual stocks is risky. Index funds let you buy a tiny piece of hundreds of companies at once.", front_text: "Index Funds" }
];

export default function FlexDecks({ setActiveTab, user }: TabComponentProps & { user: any }) {
  const [cards, setCards] = useState<any[]>([]);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [swiped, setSwiped] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', content: '' });

  useEffect(() => {
    let isMounted = true;
    const initCards = async () => {
      if (!supabase || !user) {
        if (!user && isMounted) setIsLoading(false);
        return;
      }

      try {
        // fetch decks
        let { data: decks } = await supabase.from('flex_decks').select('*').eq('user_id', user.id);
        let deckId: string;

        if (!decks || decks.length === 0) {
          const { data: newDeck } = await supabase.from('flex_decks').insert([{ user_id: user.id, title: 'General Finance' }]).select();
          if (newDeck) deckId = newDeck[0].id;
          const seedCards = INITIAL_DECKS.map(c => ({ deck_id: deckId!, front_text: c.front_text, back_text: c.content }));
          await supabase.from('flashcards').insert(seedCards);
        }

        // Fetch all user's deck IDs first, then cards for those decks
        const { data: userDecks } = await supabase.from('flex_decks').select('id, title').eq('user_id', user.id);
        const deckIds = userDecks?.map(d => d.id) || [];
        const deckTitleMap = new Map(userDecks?.map(d => [d.id, d.title]) || []);

        let allFlashcards: any[] = [];
        if (deckIds.length > 0) {
          const { data: flashcards } = await supabase.from('flashcards').select('*').in('deck_id', deckIds);
          allFlashcards = flashcards || [];
        }

        const { data: progress } = await supabase.from('flashcard_progress').select('card_id').eq('user_id', user.id).eq('is_mastered', true);
        
        const masteredIds = new Set(progress?.map(p => p.card_id) || []);

        if (allFlashcards.length > 0) {
          const all = allFlashcards.map((c, i) => ({
            id: c.id,
            title: c.front_text,
            content: c.back_text,
            category: deckTitleMap.get(c.deck_id) || 'Finance',
            color: COLORS[i % COLORS.length]
          }));
          if (isMounted) {
            setAllCards(all);
            setCards(all.filter(c => !masteredIds.has(c.id)));
          }
        }
      } catch (err) {
        console.error('FlexDecks init error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Circuit breaker
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 5000);

    initCards().finally(() => clearTimeout(timeoutId));

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user]);

  const handleSwipe = async (id: string, direction: 'left' | 'right') => {
    if (direction === 'right' && supabase && user) {
      await supabase.from('flashcard_progress').upsert({ user_id: user.id, card_id: id, is_mastered: true });
    }
    
    setSwiped(prev => [...prev, id]);
    setTimeout(() => {
      setCards(prev => prev.filter(c => c.id !== id));
    }, 300);
  };

  const resetDecks = async () => {
    if (supabase && user) {
      await supabase.from('flashcard_progress').delete().eq('user_id', user.id);
    }
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
      <div className="mb-12 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Flex-Decks</h1>
          <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Swipe right to save, left to skip. Master your money in minutes.</p>
        </div>
        <motion.button 
          whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gumroad-pink text-black px-8 py-4 border-4 border-black neo-brutalism-shadow font-headline font-black uppercase tracking-widest cursor-pointer transition-all"
        >
          <Plus size={20} strokeWidth={3} /> Add Card
        </motion.button>
      </div>

      <div className="flex-1 relative flex items-center justify-center min-h-[400px]">
        <AnimatePresence>
          {cards.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 border-4 border-black bg-gumroad-yellow text-black flex items-center justify-center mx-auto mb-8 neo-brutalism-shadow">
                <BookOpen size={40} strokeWidth={3} />
              </div>
              <h3 className="text-4xl font-black font-headline text-black mb-4 uppercase tracking-tighter">You're all caught up!</h3>
              <p className="text-black font-bold mb-10 max-w-sm mx-auto uppercase tracking-tighter opacity-60">You've reviewed all the Flex-Decks for today. Come back tomorrow for more financial wisdom.</p>
              <motion.button 
                whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
                onClick={resetDecks}
                className="bg-black text-white px-8 py-4 border-4 border-black neo-brutalism-shadow font-headline font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-3 mx-auto"
              >
                <RefreshCcw size={20} strokeWidth={3} /> Review Again
              </motion.button>
            </motion.div>
          ) : (
            cards.map((card, index) => {
              const isTop = index === cards.length - 1;
              
              return (
                <motion.div
                  key={card.id}
                  className={cn(
                    "absolute w-full max-w-sm aspect-[3/4] border-4 border-black neo-brutalism-shadow-lg overflow-hidden cursor-grab active:cursor-grabbing",
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
                  <div className={cn("w-full h-full p-10 flex flex-col grid-bg", card.color)}>
                    <div className="flex justify-between items-start mb-auto">
                      <span className="bg-white border-4 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black neo-brutalism-shadow-xs">
                        {card.category}
                      </span>
                      <span className="text-black font-black text-xs uppercase tracking-tighter opacity-60">
                        {cards.length - index}/{allCards.length}
                      </span>
                    </div>
                    
                    <div className="mb-12 overflow-y-auto max-h-[65%] hide-scrollbar">
                      <h2 className="text-3xl font-black font-headline mb-8 leading-tight uppercase tracking-tighter border-b-4 border-black pb-4">{card.title}</h2>
                      <p className="text-lg font-bold text-black leading-tight uppercase tracking-tight">{card.content}</p>
                    </div>
 
                    <div className="flex justify-between items-center mt-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSwipe(card.id, 'left'); }}
                        className="w-14 h-14 border-4 border-black bg-white flex items-center justify-center text-black neo-brutalism-shadow-sm hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <X size={28} strokeWidth={4} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSwipe(card.id, 'right'); }}
                        className="w-14 h-14 border-4 border-black bg-white flex items-center justify-center text-black neo-brutalism-shadow-sm hover:bg-green-100 transition-colors cursor-pointer"
                      >
                        <Check size={28} strokeWidth={4} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
      
      {cards.length > 0 && (
        <div className="shrink-0 text-center mt-12 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-12">
          <span className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white neo-brutalism-shadow-xs"><X size={16} strokeWidth={3} /> Left to Skip</span>
          <span className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-gumroad-yellow neo-brutalism-shadow-xs">Right to Save <Check size={16} strokeWidth={3} /></span>
        </div>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-black max-w-md w-full neo-brutalism-shadow-lg overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gumroad-yellow">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tighter text-black">New Flashcard</h2>
                <button onClick={() => setShowAddModal(false)} className="w-10 h-10 border-4 border-black bg-white hover:bg-gumroad-pink flex items-center justify-center text-black cursor-pointer transition-colors">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              <form onSubmit={handleAddCard} className="p-8 space-y-6 grid-bg">
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Front Text (Title)</label>
                  <input required type="text" value={newCard.title} onChange={e => setNewCard({...newCard, title: e.target.value})} className="w-full px-4 py-3 border-4 border-black bg-white focus:bg-gumroad-pink/10 font-bold outline-none transition-all placeholder:text-black/30" placeholder="e.g. Rule of 72" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-2">Back Text (Content)</label>
                  <textarea required value={newCard.content} onChange={e => setNewCard({...newCard, content: e.target.value})} className="w-full px-4 py-3 border-4 border-black bg-white focus:bg-gumroad-pink/10 font-bold outline-none min-h-[120px] transition-all placeholder:text-black/30" placeholder="e.g. Formula to estimate the number of years required to double your investment." />
                </div>
                <button type="submit" className="w-full py-4 bg-gumroad-pink text-black font-black uppercase tracking-widest text-xs border-4 border-black neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">Save Flashcard</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
