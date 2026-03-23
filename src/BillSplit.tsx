import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Receipt, DollarSign, ArrowRight, ArrowLeft, 
  PieChart, UserPlus, Settings, ChevronRight, X, Loader2
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';

export default function BillSplit() {
  const [activeTab, setActiveTab] = useState<'groups' | 'friends' | 'activity'>('groups');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [billSplits, setBillSplits] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // New Expense State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('You');
  const [groupName, setGroupName] = useState('General');
  const [participantsInput, setParticipantsInput] = useState('Alex, Sarah');

  useEffect(() => {
    const fetchSplits = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);

      const { data } = await supabase.from('bill_splits').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) {
        setBillSplits(data);
      }
      setIsLoading(false);
    };
    fetchSplits();
  }, []);

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
    } else {
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bill Splitting</h1>
          <p className="text-slate-500 text-sm mt-1">Split expenses with friends and groups</p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddExpenseOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Expense
        </motion.button>
      </div>

      {/* Top Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Balance</p>
            <h2 className={cn("text-2xl font-bold", (totalOwedToYou - totalYouOwe) >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {((totalOwedToYou - totalYouOwe) >= 0 ? '+' : '')}${(totalOwedToYou - totalYouOwe).toFixed(2)}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <DollarSign size={24} />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">You are owed</p>
            <h2 className="text-2xl font-bold text-emerald-600">${totalOwedToYou.toFixed(2)}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <ArrowRight size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">You owe</p>
            <h2 className="text-2xl font-bold text-rose-600">${totalYouOwe.toFixed(2)}</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <ArrowLeft size={24} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        
        {/* Left Sidebar - Navigation & Lists */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-100 p-2 shrink-0 bg-slate-50/50 rounded-t-2xl relative">
            {['groups', 'friends'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-colors relative z-10 capitalize", 
                  activeTab === tab ? "text-indigo-700" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabBillSplit" 
                    className="absolute inset-0 bg-white shadow-sm border border-slate-200 rounded-lg -z-10" 
                  />
                )}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'groups' && (
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                <motion.button variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium">Start a new group</span>
                </motion.button>
                {groups.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No groups yet.</p>}
                {groups.map(group => (
                  <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} whileHover={{ x: 4 }} key={group.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{group.name}</p>
                        <p className="text-xs text-slate-500">{group.members} members</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'friends' && (
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-3">
                <motion.button variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <UserPlus size={20} />
                  </div>
                  <span className="font-medium">Add a friend</span>
                </motion.button>
                {friends.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No friends with balances yet.</p>}
                {friends.map(friend => (
                  <motion.div variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} whileHover={{ x: 4 }} key={friend.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold shrink-0">
                        {friend.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{friend.name}</p>
                        {friend.balance > 0 ? (
                          <p className="text-xs text-emerald-600 font-medium">Owes you ${friend.balance.toFixed(2)}</p>
                        ) : friend.balance < 0 ? (
                          <p className="text-xs text-rose-600 font-medium">You owe ${Math.abs(friend.balance).toFixed(2)}</p>
                        ) : (
                          <p className="text-xs text-slate-400">Settled up</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Area - Recent Activity / Expenses */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-lg text-slate-800">Recent Expenses</h3>
            <button className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {expenses.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No expenses yet. Click 'Add Expense' to get started.</p>}
              {expenses.map(expense => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={expense.id} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <Receipt size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{expense.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">{expense.paidBy}</span> paid ${expense.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">{expense.date}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600">
                      {expense.group}
                    </span>
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
              className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Add an expense</h2>
                <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                    <Receipt size={28} className="text-slate-400" />
                  </div>
                  <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Enter a description" 
                        className="w-full text-lg font-medium bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 transition-colors placeholder:text-slate-300"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                      <DollarSign size={28} className="text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full text-3xl font-bold bg-transparent border-b-2 border-slate-200 focus:border-emerald-500 outline-none py-2 transition-colors placeholder:text-slate-300 text-emerald-600"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Who Paid?</label>
                      <input 
                        type="text" 
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                        placeholder="You, Alex, Sarah, etc."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Participants (Comma Separated)</label>
                      <input 
                        type="text" 
                        value={participantsInput}
                        onChange={(e) => setParticipantsInput(e.target.value)}
                        placeholder="Alex, Sarah, Mike"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">You are automatically included.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Group Name</label>
                      <input 
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="General, Bali Trip, etc."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="flex items-center gap-3">
                        <PieChart size={20} className="text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-900">Split equally among participants</span>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveExpense}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
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
