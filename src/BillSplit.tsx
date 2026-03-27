import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, IndianRupee, CreditCard, ArrowRight, Check, X, Search, Filter, MessageSquare, Clock, ArrowUpRight, ArrowDownLeft, Receipt, ArrowLeft, ChevronRight, UserPlus, PieChart, Loader2, DollarSign, Camera, Sparkles } from 'lucide-react';
import { supabase } from './lib/supabase';
import { cn } from './utils';
import { TabComponentProps } from './constants';
import { GoogleGenAI } from '@google/genai';

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
  
  // OCR & Granular Split State
  const [isScanning, setIsScanning] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['You']);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [customPeople, setCustomPeople] = useState<string[]>([]);

  // LocalStorage Persistence Hook
  useEffect(() => {
    const savedDraft = localStorage.getItem('finflex-billsplit-draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.paidBy) setPaidBy(parsed.paidBy);
        if (parsed.groupName) setGroupName(parsed.groupName);
        if (parsed.selectedParticipants) setSelectedParticipants(parsed.selectedParticipants);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Save Draft on Change
  useEffect(() => {
    const draft = { amount, description, paidBy, groupName, selectedParticipants };
    localStorage.setItem('finflex-billsplit-draft', JSON.stringify(draft));
  }, [amount, description, paidBy, groupName, selectedParticipants]);

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
        group: bs.group_name,
        receiptUrl: d.receiptUrl
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
    })).filter(f => Math.abs(f.balance) > 0.01); 

    const owed = friendsList.filter(f => f.balance > 0).reduce((acc, f) => acc + f.balance, 0);
    const owe = Math.abs(friendsList.filter(f => f.balance < 0).reduce((acc, f) => acc + f.balance, 0));

    return { groups: groupsList, friends: friendsList, expenses: expensesList, totalOwedToYou: owed, totalYouOwe: owe };
  }, [billSplits]);

  const availablePeople = useMemo(() => {
    return Array.from(new Set(['You', ...friends.map(f => f.name), ...customPeople]));
  }, [friends, customPeople]);

  const filteredExpenses = useMemo(() => {
    if (!selectedGroup) return expenses;
    return expenses.filter((e: any) => e.group === selectedGroup);
  }, [expenses, selectedGroup]);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      alert("Gemini API key is missing! Please set VITE_GEMINI_API_KEY.");
      return;
    }

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: [
                {
                   role: 'user',
                   parts: [
                      { text: 'Analyze this receipt image and extract the following details in JSON format.\nJSON structure:\n{\n  "amount": number,\n  "description": string\n}\nRequirements:\n- Amount should be the numeric total.\n- Description should be short (max 5 words) indicating what the receipt is for.\nReply ONLY with the raw JSON, no markdown formatting.' },
                      { inlineData: { data: base64Data, mimeType: file.type } }
                   ]
                }
             ]
          });

          const text = response.text || "";
          const cleanedJson = text.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleanedJson);

          if (parsed.amount) setAmount(parsed.amount.toString());
          if (parsed.description) setDescription(parsed.description);

          if (supabase && user) {
            const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { error: uploadError } = await supabase.storage
              .from('receipts')
              .upload(fileName, file);
              
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                 .from('receipts')
                 .getPublicUrl(fileName);
              setReceiptUrl(publicUrl);
            }
          }
        } catch (err: any) {
           console.error("AI/Upload Error:", err);
           const msg = err.message || "";
           if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
             alert("AI limit reached (Free Tier). Please try again in 30 seconds or enter details manually.");
           } else {
             alert("AI scanning failed. Please enter details manually.");
           }
        } finally {
          setIsScanning(false);
        }
      };
      reader.onerror = () => setIsScanning(false);
      reader.readAsDataURL(file);
    } catch (e) {
      setIsScanning(false);
      console.error(e);
    }
    e.target.value = "";
  };

  const handleSaveExpense = async () => {
    if (!supabase || !user || !description || !amount || selectedParticipants.length === 0) {
      alert("Please fill all fields and select at least one participant.");
      return;
    }

    const total = Number(amount);
    const finalParticipants = Array.from(new Set([...selectedParticipants, paidBy]));
    const splitAmount = total / finalParticipants.length;

    const split_details = {
      description,
      paidBy,
      receiptUrl,
      participants: finalParticipants.map(p => ({
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
      setSelectedParticipants(['You']);
      setPaidBy('You');
      setReceiptUrl(null);
      localStorage.removeItem('finflex-billsplit-draft'); // Clear persistence on success
      alert('Expense added successfully!');
    } else {
      console.error(error);
      alert('Error adding expense: ' + (error?.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setIsAddExpenseOpen(false);
    setDescription('');
    setAmount('');
    setSelectedParticipants(['You']);
    setPaidBy('You');
    setReceiptUrl(null);
    setGroupName('General');
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-black" size={48} /></div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col relative">
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-8 border-gumroad-yellow border-t-gumroad-pink rounded-none mb-8"
            />
            <h2 className="text-4xl font-black font-headline text-white uppercase italic mb-4 flex items-center gap-4">
              <Sparkles size={40} className="text-gumroad-yellow" /> AI Scanning...
            </h2>
            <p className="text-gumroad-yellow font-bold text-lg uppercase tracking-widest animate-pulse">
              EXTRACTING DA VIBES & DATA FROM RECEIPT
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        
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
                <motion.button onClick={() => { setIsAddExpenseOpen(true); }} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="w-full flex items-center gap-4 p-4 bg-white border-4 border-black border-dashed text-black hover:bg-gumroad-pink/10 transition-colors neo-brutalism-shadow-sm cursor-pointer">
                  <div className="w-12 h-12 border-4 border-black bg-white flex items-center justify-center shrink-0">
                    <UserPlus size={24} strokeWidth={3} />
                  </div>
                  <span className="font-black uppercase tracking-widest text-sm">Split an expense</span>
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
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Owes you ₹{friend.balance.toFixed(2)}</p>
                        ) : friend.balance < 0 ? (
                          <p className="text-xs font-black text-rose-600 uppercase tracking-widest">You owe ₹{Math.abs(friend.balance).toFixed(2)}</p>
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

        <div className="lg:col-span-2 bg-white border-4 border-black neo-brutalism-shadow flex flex-col overflow-hidden">
          <div className="p-5 border-b-4 border-black flex justify-between items-center shrink-0 bg-gumroad-pink/10">
            <h3 className="font-black font-headline text-2xl uppercase tracking-tighter text-black">Recent Expenses</h3>
            <button onClick={() => setShowAllExpenses(!showAllExpenses)} className="text-xs font-black uppercase tracking-widest text-black bg-white border-4 border-black px-4 py-2 neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">{showAllExpenses ? 'Show Recent' : 'View All'}</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 grid-bg">
            <div className="space-y-4">
              {(showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 5)).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-sm font-black text-black text-center mb-4 uppercase tracking-widest">
                    {selectedGroup ? `Zero expenses in "${selectedGroup}".` : "Your friends owe you nothing. Are you even social?"}
                  </p>
                  <button 
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="btn-rounded neo-stacked-hover bg-gumroad-yellow text-black border-4 border-black px-6 py-3 text-sm font-headline font-black uppercase inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus size={18} strokeWidth={3} /> Add First Group Expense
                  </button>
                </div>
              )}
              {(showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, 5)).map(expense => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={expense.id} 
                  className="flex items-center justify-between p-5 bg-white border-4 border-black neo-brutalism-shadow-sm hover:bg-gumroad-yellow transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 border-4 border-black bg-gumroad-pink flex items-center justify-center text-black shrink-0 group-hover:bg-white transition-colors overflow-hidden">
                      {expense.receiptUrl ? (
                         <img src={expense.receiptUrl} alt="Receipt" className="w-full h-full object-cover opacity-80" />
                      ) : (
                         <Receipt size={28} strokeWidth={3} />
                      )}
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

      <AnimatePresence>
        {isAddExpenseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-4 border-black max-w-lg w-full max-h-[90vh] flex flex-col neo-brutalism-shadow-lg"
            >
              <div className="flex justify-between items-center p-6 border-b-4 border-black bg-gumroad-yellow shrink-0">
                <h2 className="text-2xl font-black font-headline uppercase tracking-tighter text-black">New Expense</h2>
                <button onClick={resetForm} className="w-10 h-10 border-4 border-black bg-white hover:bg-gumroad-pink flex items-center justify-center text-black cursor-pointer transition-colors">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 grid-bg">
                <div className="flex gap-4">
                  <label htmlFor="receipt-upload" className="flex-1 w-full">
                    <div className={cn("w-full h-16 border-4 border-black border-dashed flex items-center justify-center gap-3 cursor-pointer transition-colors bg-white hover:bg-gumroad-pink/20", receiptUrl ? "bg-emerald-100" : "")}>
                       {isScanning ? <Loader2 className="animate-spin text-black" size={20} strokeWidth={3} /> : <Camera size={20} strokeWidth={3} className="text-black" />}
                       <span className="font-black uppercase tracking-widest text-xs text-black">{isScanning ? 'Scanning (AI)...' : receiptUrl ? 'Receipt Attached ✓' : 'Scan Receipt'}</span>
                    </div>
                    <input id="receipt-upload" type="file" accept="image/*" className="hidden" onChange={handleScanReceipt} disabled={isScanning} />
                  </label>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 border-4 border-black bg-gumroad-pink flex items-center justify-center shrink-0 neo-brutalism-shadow-sm">
                    <Receipt size={32} strokeWidth={3} className="text-black" />
                  </div>
                  <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Description (e.g. Dinner)" 
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

                <div className="space-y-5 bg-white border-4 border-black p-5 neo-brutalism-shadow-sm">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Paid By</label>
                    <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full px-4 py-3 bg-white border-4 border-black outline-none font-bold focus:bg-gumroad-pink/10 transition-all appearance-none cursor-pointer">
                      {availablePeople.map(person => (
                         <option key={person} value={person}>{person}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-2">
                       <label className="block text-xs font-black uppercase tracking-widest text-black">Split With</label>
                       <div className="flex gap-2">
                         <button onClick={() => setSelectedParticipants(availablePeople)} className="text-[10px] font-black uppercase text-black bg-gumroad-yellow px-2 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors">All</button>
                         <button onClick={() => setSelectedParticipants(['You'])} className="text-[10px] font-black uppercase text-black bg-white px-2 py-1 border-2 border-black hover:bg-black hover:text-white transition-colors">Clear</button>
                       </div>
                     </div>
                     <div className="max-h-32 overflow-y-auto border-4 border-black p-3 bg-white grid grid-cols-2 gap-3 mb-3 custom-scrollbar">
                       {availablePeople.map(person => (
                         <label key={person} className="flex items-center gap-3 cursor-pointer group hover:bg-black hover:text-white p-1 transition-colors">
                           <input 
                             type="checkbox" 
                             checked={selectedParticipants.includes(person)} 
                             onChange={(e) => {
                               if (e.target.checked) setSelectedParticipants([...selectedParticipants, person]);
                               else setSelectedParticipants(selectedParticipants.filter(p => p !== person));
                             }} 
                             className="w-4 h-4 accent-black border-2 border-black" 
                           />
                           <span className="font-bold text-xs uppercase truncate">{person}</span>
                         </label>
                       ))}
                     </div>
                     
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={newParticipantName} 
                         onChange={e => setNewParticipantName(e.target.value)} 
                         placeholder="Add friend..." 
                         className="flex-1 border-4 border-black px-3 py-2 text-xs font-bold uppercase focus:bg-gumroad-pink/10 outline-none" 
                       />
                       <button onClick={() => {
                         const name = newParticipantName.trim();
                         if (name && !availablePeople.includes(name)) {
                           setCustomPeople([...customPeople, name]);
                           setSelectedParticipants([...selectedParticipants, name]);
                           setNewParticipantName('');
                         }
                       }} className="bg-black text-white px-4 border-4 border-black font-black uppercase text-xs hover:bg-gumroad-pink hover:text-black transition-colors">
                         Add
                       </button>
                     </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Group (Optional)</label>
                    <input 
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. Goa Trip"
                      className="w-full px-4 py-3 bg-white border-4 border-black outline-none font-bold focus:bg-gumroad-pink/10 transition-all placeholder:text-black/30"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gumroad-yellow border-4 border-black neo-brutalism-shadow-xs">
                    <div className="flex items-center gap-3">
                      <PieChart size={24} strokeWidth={3} className="text-black" />
                      <span className="text-xs font-black uppercase text-black">Split equally among {selectedParticipants.length || 1} people</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t-4 border-black bg-white flex justify-end gap-4 shrink-0">
                <button 
                  onClick={resetForm}
                  className="px-6 py-3 text-sm font-black uppercase tracking-widest text-black bg-white border-4 border-black hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveExpense}
                  className="px-6 py-3 text-sm font-black uppercase tracking-widest text-black bg-gumroad-pink border-4 border-black neo-brutalism-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
