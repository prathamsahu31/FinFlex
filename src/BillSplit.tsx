import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, IndianRupee, CreditCard, ArrowRight, Check, X, Search, Filter, MessageSquare, Clock, ArrowUpRight, ArrowDownLeft, Receipt, ArrowLeft, ChevronRight, UserPlus, PieChart, Loader2, DollarSign } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';

export default function BillSplit({ setActiveTab: setAppActiveTab, user }: TabComponentProps & { user: any }) {
  const [billSplitTab, setBillSplitTab] = useState<'groups' | 'friends' | 'activity'>('groups');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!user);
  const [billSplits, setBillSplits] = useState<any[]>([]);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // New Expense State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('You');
  const [groupName, setGroupName] = useState('General');
  const [participantsInput, setParticipantsInput] = useState('Alex, Sarah');

  useEffect(() => {
    const fetchSplits = async () => {
      if (!supabase || !user) {
        setIsLoading(!user);
        return;
      }

      const { data } = await supabase.from('bill_splits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) {
        setBillSplits(data);
      }
      setIsLoading(false);
    };
    fetchSplits();
  }, [user]);

  const { groups, friends, expenses, totalOwedToYou, totalYouOwe } = useMemo(() => {
    let friendsMap = new Map<string, number>();
    let groupsMap = new Map<string, { members: Set<string>, total: number }>();
    let expensesList: any[] = [];

    billSplits.forEach(bs => {
      const d = bs.split_details;
      if (!d) return;

      expensesList.push({
        id: bs.id,
        description: d.description,
        amount: Number(bs.total_amount),
        paidBy: d.paidBy,
        date: new Date(bs.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        group: bs.group_name
      });

      if (!groupsMap.has(bs.group_name)) groupsMap.set(bs.group_name, { members: new Set(), total: 0 });
      groupsMap.get(bs.group_name)!.total += Number(bs.total_amount);

      d.participants.forEach((p: any) => {
        groupsMap.get(bs.group_name)!.members.add(p.name);
        
        if (p.name !== 'You') {
          if (!friendsMap.has(p.name)) friendsMap.set(p.name, 0);
          
          if (d.paidBy === 'You') {
            friendsMap.set(p.name, friendsMap.get(p.name)! + p.owes);
          } else if (d.paidBy === p.name) {
            const myShare = d.participants.find((x: any) => x.name === 'You')?.owes || 0;
            // Only subtract once per bill, handled by assuming 1 payer
            friendsMap.set(p.name, friendsMap.get(p.name)! - myShare);
          }
        }
      });
    });

    const groupsList = Array.from(groupsMap.entries()).map(([name, data], i) => ({
      id: i, name, members: data.members.size, totalExpenses: data.total
    }));

    const friendsList = Array.from(friendsMap.entries()).map(([name, balance], i) => ({
      id: i, name, avatar: name.charAt(0).toUpperCase(), balance
    })).filter(f => Math.abs(f.balance) > 0.01); // Filter out zero balance

    const owed = friendsList.filter(f => f.balance > 0).reduce((acc, f) => acc + f.balance, 0);
    const owe = Math.abs(friendsList.filter(f => f.balance < 0).reduce((acc, f) => acc + f.balance, 0));

    return { groups: groupsList, friends: friendsList, expenses: expensesList, totalOwedToYou: owed, totalYouOwe: owe };
  }, [billSplits]);

  const filteredExpenses = useMemo(() => {
    if (!selectedGroup) return expenses;
    return expenses.filter((e: any) => e.group === selectedGroup);
  }, [expenses, selectedGroup]);

  const handleSaveExpense = async () => {
    if (!supabase || !user || !description || !amount) return;

    const total = Number(amount);
    let partsSet = new Set(participantsInput.split(',').map(p => p.trim()).filter(Boolean));
    if (paidBy !== 'You') partsSet.add(paidBy);
    partsSet.add('You'); // 'You' is always involved automatically

    const allPeople = Array.from(partsSet);
    const splitAmount = total / allPeople.length;

    const split_details = {
      description,
      paidBy,
      participants: allPeople.map(p => ({
        name: p,
        owes: splitAmount,
        paid: p === paidBy ? total : 0
      }))
    };

    const newRecord = {
      user_id: user.id,
      group_name: groupName || 'General',
      total_amount: total,
      split_details
    };

    const { data, error } = await supabase.from('bill_splits').insert([newRecord]).select();
    if (!error && data) {
      setBillSplits([data[0], ...billSplits]);
      setIsAddExpenseOpen(false);
      setDescription('');
      setAmount('');
      setParticipantsInput('Alex, Sarah');
      setPaidBy('You');
      alert('Expense added successfully!');
    } else {
      console.error(error);
      alert('Error adding expense: ' + (error?.message || 'Unknown error'));
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Bill Splitting</h1>
          <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Split expenses with friends and groups</p>
        </div>
        
        <motion.button 
          whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center justify-center gap-2 bg-gumroad-pink text-black px-6 py-3 border-4 border-black neo-brutalism-shadow font-headline font-black uppercase tracking-widest cursor-pointer transition-all"
        >
          <Plus size={18} strokeWidth={3} />
          Add Expense
        </motion.button>
      </div>

      {/* Top Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-black text-xs font-black uppercase tracking-widest mb-1 border-b-2 border-black pb-1 inline-block">Total Balance</p>
            <h2 className={cn("text-3xl font-black font-headline mt-2", (totalOwedToYou - totalYouOwe) >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {((totalOwedToYou - totalYouOwe) >= 0 ? '+' : '')}₹{(totalOwedToYou - totalYouOwe).toFixed(2)}
            </h2>
          </div>
          <div className="w-14 h-14 border-4 border-black bg-gumroad-yellow flex items-center justify-center text-black neo-brutalism-shadow-sm group-hover:rotate-12 transition-transform">
            <IndianRupee size={28} strokeWidth={3} />
          </div>
        </div>
        
        <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-black text-xs font-black uppercase tracking-widest mb-1 border-b-2 border-black pb-1 inline-block">You are owed</p>
            <h2 className="text-3xl font-black font-headline mt-2 text-emerald-600">₹{totalOwedToYou.toFixed(2)}</h2>
          </div>
          <div className="w-14 h-14 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black neo-brutalism-shadow-sm group-hover:rotate-12 transition-transform">
            <ArrowRight size={28} strokeWidth={3} />
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 neo-brutalism-shadow flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-black text-xs font-black uppercase tracking-widest mb-1 border-b-2 border-black pb-1 inline-block">You owe</p>
            <h2 className="text-3xl font-black font-headline mt-2 text-rose-600">₹{totalYouOwe.toFixed(2)}</h2>
          </div>
          <div className="w-14 h-14 border-4 border-black bg-black flex items-center justify-center text-white neo-brutalism-shadow-sm group-hover:-rotate-12 transition-transform">
            <ArrowLeft size={28} strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        
        {/* Left Sidebar - Navigation & Lists */}
        <div className="lg:col-span-1 bg-white border-4 border-black neo-brutalism-shadow flex flex-col overflow-hidden">
          <div className="flex bg-black p-1 border-4 border-black neo-brutalism-shadow-sm">
            {[
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'friends', label: 'Friends', icon: UserPlus },
              { id: 'activity', label: 'Activity', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setBillSplitTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                  billSplitTab === tab.id 
                    ? "bg-gumroad-pink text-black" 
                    : "bg-transparent text-white hover:bg-white/10"
                )}
              >
                <tab.icon size={14} strokeWidth={3} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
          {billSplitTab === 'groups' && (
            <div className="h-full flex flex-col">
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-4 p-4 grid-bg overflow-y-auto">
                <motion.button onClick={() => { setIsAddExpenseOpen(true); setGroupName(''); }} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="w-full flex items-center gap-4 p-4 bg-white border-4 border-black border-dashed text-black hover:bg-gumroad-pink/10 transition-colors neo-brutalism-shadow-sm cursor-pointer">
                  <div className="w-12 h-12 border-4 border-black bg-white flex items-center justify-center shrink-0">
                    <Plus size={24} strokeWidth={3} />
                  </div>
                  <span className="font-black uppercase tracking-widest text-sm">Start a new group</span>
                </motion.button>
                {groups.length === 0 && <p className="text-black font-bold text-sm text-center py-6">No groups yet.</p>}
                {groups.map(group => (
                  <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} whileHover={{ x: 4 }} key={group.name} onClick={() => setSelectedGroup(selectedGroup === group.name ? null : group.name)} className={cn("flex items-center justify-between p-4 bg-white border-4 border-black neo-brutalism-shadow-sm cursor-pointer hover:bg-gumroad-pink transition-all group", selectedGroup === group.name && "bg-gumroad-pink")}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border-4 border-black bg-gumroad-yellow text-black flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                        <Users size={24} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="font-black font-headline text-lg uppercase text-black">{group.name}</p>
                        <p className="text-xs font-bold text-black uppercase tracking-tighter">{group.members} members</p>
                      </div>
                    </div>
                    <ChevronRight size={20} strokeWidth={3} className="text-black" />
                  </motion.div>
                ))}
              </motion.div>
            </div>
            )}

            {billSplitTab === 'friends' && (
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-4 p-4 grid-bg overflow-y-auto">
                <motion.button onClick={() => alert('Friends are automatically added when you create expenses. Add an expense with their name to get started!')} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="w-full flex items-center gap-4 p-4 bg-white border-4 border-black border-dashed text-black hover:bg-gumroad-pink/10 transition-colors neo-brutalism-shadow-sm cursor-pointer">
                  <div className="w-12 h-12 border-4 border-black bg-white flex items-center justify-center shrink-0">
                    <UserPlus size={24} strokeWidth={3} />
                  </div>
                  <span className="font-black uppercase tracking-widest text-sm">Add a friend</span>
                </motion.button>
                {friends.length === 0 && <p className="text-black font-bold text-sm text-center py-6">No friends with balances yet.</p>}
                {friends.map(friend => (
                  <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} whileHover={{ x: 4 }} key={friend.name} className="flex items-center justify-between p-4 bg-white border-4 border-black neo-brutalism-shadow-sm cursor-pointer hover:bg-gumroad-yellow transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 border-4 border-black bg-gumroad-pink text-black flex items-center justify-center font-black text-xl shrink-0 group-hover:bg-white transition-colors">
                        {friend.avatar}
                      </div>
                      <div>
                        <p className="font-black font-headline text-lg uppercase text-black">{friend.name}</p>
                        {friend.balance > 0 ? (
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Owes you ${friend.balance.toFixed(2)}</p>
                        ) : friend.balance < 0 ? (
                          <p className="text-xs font-black text-rose-600 uppercase tracking-widest">You owe ${Math.abs(friend.balance).toFixed(2)}</p>
                        ) : (
                          <p className="text-xs font-black text-black/40 uppercase tracking-widest">Settled up</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {billSplitTab === 'activity' && (
              <div className="h-full p-6 grid-bg overflow-y-auto flex flex-col items-center justify-center text-center space-y-4">
                <Clock size={48} strokeWidth={2} className="text-black/50" />
                <p className="text-black font-bold text-lg">Activity feed coming soon!</p>
                <p className="text-black/70 text-sm">This section will show a detailed history of all your bill splits and payments.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Recent Activity / Expenses */}
        <div className="lg:col-span-2 bg-white border-4 border-black neo-brutalism-shadow flex flex-col overflow-hidden">
          <div className="p-5 border-b-4 border-black flex justify-between items-center shrink-0 bg-gumroad-pink/10">
            <h3 className="font-black font-headline text-2xl uppercase tracking-tighter text-black">Recent Expenses</h3>
            <button onClick={() => setShowAllExpenses(!showAllExpenses)} className="text-xs font-black uppercase tracking-widest text-black bg-white border-4 border-black px-4 py-2 neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">{showAllExpenses ? 'Show Recent' : 'View All'}</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 grid-bg">
            <div className="space-y-4">
              {(showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 5)).length === 0 && <p className="text-black font-bold text-sm text-center py-8">{selectedGroup ? `No expenses in group "${selectedGroup}".` : "No expenses yet. Click 'Add Expense' to get started."}</p>}
              {(showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 5)).map(expense => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={expense.id} 
                  className="flex items-center justify-between p-5 bg-white border-4 border-black neo-brutalism-shadow-sm hover:bg-gumroad-yellow transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black shrink-0 group-hover:bg-white transition-colors">
                      <Receipt size={28} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-black font-headline text-xl uppercase text-black">{expense.description}</p>
                      <p className="text-xs font-bold text-black mt-1 uppercase tracking-tighter">
                        <span className="font-black border-b-2 border-black bg-gumroad-yellow/30 px-1">{expense.paidBy}</span> paid <span className="font-black">₹{expense.amount.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-black uppercase tracking-widest mb-2 pb-1 border-b-2 border-black inline-block">{expense.date}</p>
                    <div className="block mt-1">
                      <span className="inline-flex items-center px-3 py-1 border-2 border-black bg-white text-[10px] font-black uppercase tracking-widest text-black">
                        {expense.group}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddExpenseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-4 border-black max-w-lg w-full neo-brutalism-shadow-lg overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gumroad-yellow">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tighter text-black">Add an expense</h2>
                <button onClick={() => setIsAddExpenseOpen(false)} className="w-10 h-10 border-4 border-black bg-white hover:bg-gumroad-pink flex items-center justify-center text-black cursor-pointer transition-colors">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              
              <div className="p-8 space-y-6 grid-bg">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 border-4 border-black bg-gumroad-pink flex items-center justify-center shrink-0 neo-brutalism-shadow-sm">
                    <Receipt size={32} strokeWidth={3} className="text-black" />
                  </div>
                  <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Enter a description" 
                        className="w-full text-xl font-black font-headline uppercase bg-white border-4 border-black outline-none px-4 py-3 focus:bg-gumroad-pink/10 transition-colors placeholder:text-black/30"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 border-4 border-black bg-gumroad-yellow flex items-center justify-center shrink-0 neo-brutalism-shadow-sm">
                      <IndianRupee size={32} strokeWidth={3} className="text-black" />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full text-4xl font-black font-headline bg-white border-4 border-black outline-none px-4 py-3 focus:bg-gumroad-yellow/10 transition-colors placeholder:text-black/30 text-black"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Who Paid?</label>
                      <input 
                        type="text" 
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                        placeholder="You, Alex, Sarah, etc."
                        className="w-full px-4 py-3 bg-white border-4 border-black outline-none font-bold focus:bg-gumroad-pink/10 transition-all placeholder:text-black/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Participants (Comma Separated)</label>
                      <input 
                        type="text" 
                        value={participantsInput}
                        onChange={(e) => setParticipantsInput(e.target.value)}
                        placeholder="Alex, Sarah, Mike"
                        className="w-full px-4 py-3 bg-white border-4 border-black outline-none font-bold focus:bg-gumroad-pink/10 transition-all placeholder:text-black/30"
                      />
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mt-2">You are automatically included.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Group Name</label>
                      <input 
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="General, Bali Trip, etc."
                        className="w-full px-4 py-3 bg-white border-4 border-black outline-none font-bold focus:bg-gumroad-pink/10 transition-all placeholder:text-black/30"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gumroad-yellow border-4 border-black neo-brutalism-shadow-sm">
                      <div className="flex items-center gap-3">
                        <PieChart size={24} strokeWidth={3} className="text-black" />
                        <span className="text-sm font-black uppercase tracking-widest text-black">Split equally among participants</span>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="p-6 border-t-4 border-black bg-white flex justify-end gap-4">
                <button 
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-6 py-3 text-sm font-black uppercase tracking-widest text-black bg-white border-4 border-black hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveExpense}
                  className="px-6 py-3 text-sm font-black uppercase tracking-widest text-black bg-gumroad-pink border-4 border-black neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
