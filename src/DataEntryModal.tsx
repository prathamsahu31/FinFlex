import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './lib/supabase';

interface DataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DataEntryModal({ isOpen, onClose, onSuccess }: DataEntryModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
      });
    }
  }, []);

  const [manualEntry, setManualEntry] = useState({
    amount: '',
    date: '',
    vendor: '',
    category: 'Shopping',
    type: 'expense'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
      setSuccess(null);
    }
  };

  const processReceipt = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
          
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                  },
                },
                {
                  text: 'Extract the following from this receipt/invoice. Return ONLY valid JSON.',
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  vendor: { type: Type.STRING, description: 'Name of the store or vendor' },
                  amount: { type: Type.NUMBER, description: 'Total amount of the receipt' },
                  date: { type: Type.STRING, description: 'Date of the transaction in YYYY-MM-DD format' },
                  category: { 
                    type: Type.STRING, 
                    description: 'One of: Shopping, Transport, Food & Dining, Rent & Bills, Entertainment, Other' 
                  },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                required: ['vendor', 'amount', 'date', 'category']
              }
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            setResult(parsed);
            setManualEntry({
              amount: parsed.amount?.toString() || '',
              date: parsed.date || '',
              vendor: parsed.vendor || '',
              category: parsed.category || 'Shopping',
              type: 'expense'
            });
          }
        } catch (err: any) {
          console.error(err);
          let friendlyError = err.message || 'Failed to process receipt';
          if (friendlyError.includes('quota') || friendlyError.includes('429') || friendlyError.includes('RESOURCE_EXHAUSTED')) {
            friendlyError = "AI limit reached (Free Tier). Please try again in 30 seconds or enter the details manually below.";
          }
          setError(friendlyError);
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessing(false);
      };
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabase) {
      setError('Supabase is not configured. Cannot save transaction.');
      return;
    }

    if (!user) {
      setError('You must be logged in to save transactions.');
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: user.id,
            vendor: manualEntry.vendor,
            amount: parseFloat(manualEntry.amount),
            date: manualEntry.date,
            category: manualEntry.category,
            type: manualEntry.type,
            custom_tag: 'New'
          }
        ]);

      if (dbError) throw dbError;

      setSuccess('Transaction saved successfully!');
      setManualEntry({ amount: '', date: '', vendor: '', category: 'Shopping', type: 'expense' });
      setFile(null);
      setResult(null);
      
      // Call onSuccess to refresh parent list, then close modal
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save transaction');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white border-4 border-black max-w-5xl w-full max-h-[90vh] overflow-y-auto neo-brutalism-shadow-lg relative flex flex-col"
        >
          <div className="sticky top-0 bg-gumroad-yellow border-b-4 border-black px-8 py-5 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-black font-headline text-black uppercase tracking-tight">Data Entry & OCR</h2>
              <p className="text-black font-bold text-xs uppercase tracking-widest opacity-70">Upload receipts or enter transactions manually.</p>
            </div>
            <motion.button 
              whileHover={{ rotate: 90 }}
              onClick={onClose} 
              className="text-black bg-white border-4 border-black p-2 neo-brutalism-shadow-xs cursor-pointer"
            >
              <X size={20} strokeWidth={3} />
            </motion.button>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 grid-bg">
            {/* OCR Section */}
            <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow-sm flex flex-col">
              <h3 className="text-xl font-black font-headline text-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                <FileText size={24} strokeWidth={3} className="text-black" />
                Scan Receipt
              </h3>
              
              <div 
                className="border-4 border-dashed border-black bg-slate-50 p-10 text-center hover:bg-gumroad-pink transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 bg-white border-4 border-black flex items-center justify-center mx-auto mb-6 text-black neo-brutalism-shadow-xs group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0px_#000] transition-all">
                  <Upload size={32} strokeWidth={3} />
                </div>
                <p className="text-sm font-black text-black uppercase tracking-widest mb-1">Click to upload or drag and drop</p>
                <p className="text-[10px] font-bold text-black opacity-50 uppercase tracking-[0.2em]">SVG, PNG, JPG or PDF (max. 5MB)</p>
                
                {file && (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 border-4 border-black bg-white text-black text-xs font-black uppercase tracking-widest neo-brutalism-shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CheckCircle2 size={16} strokeWidth={3} />
                    {file.name}
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
                onClick={processReceipt}
                disabled={!file || isProcessing}
                className="w-full mt-8 py-4 bg-gumroad-yellow text-black border-4 border-black font-black uppercase tracking-widest text-sm neo-brutalism-shadow cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing with AI...</>
                ) : (
                  'Extract Data'
                )}
              </motion.button>

              {error && (
                <div className="mt-6 p-4 border-4 border-black bg-red-50 text-black font-bold text-xs uppercase tracking-widest flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 text-red-600" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-6 p-4 border-4 border-black bg-emerald-50 text-black font-bold text-xs uppercase tracking-widest flex items-start gap-3">
                  <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                  <p>{success}</p>
                </div>
              )}
            </div>

            {/* Manual Entry Form */}
            <div className="bg-white border-4 border-black p-8 neo-brutalism-shadow-sm flex flex-col">
              <h3 className="text-xl font-black font-headline text-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-2 inline-block self-start">Transaction Details</h3>
              
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Vendor / Description</label>
                  <input 
                    type="text" 
                    required
                    value={manualEntry.vendor}
                    onChange={e => setManualEntry({...manualEntry, vendor: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-4 border-black font-bold outline-none focus:bg-gumroad-pink/10 transition-all placeholder:text-black/20"
                    placeholder="e.g. Amazon, Starbucks"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Type</label>
                    <select 
                      value={manualEntry.type}
                      onChange={e => setManualEntry({...manualEntry, type: e.target.value})}
                      className="w-full px-4 py-3 bg-white border-4 border-black font-bold outline-none appearance-none focus:bg-gumroad-pink/10 transition-all"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest">Date</label>
                    <input 
                      type="date" 
                      required
                      value={manualEntry.date}
                      onChange={e => setManualEntry({...manualEntry, date: e.target.value})}
                      className="w-full px-4 py-3 bg-white border-4 border-black font-bold outline-none focus:bg-gumroad-pink/10 transition-all"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={manualEntry.amount}
                    onChange={e => setManualEntry({...manualEntry, amount: e.target.value})}
                    className="w-full px-4 py-3 bg-gumroad-yellow/10 border-4 border-black font-black text-2xl text-black outline-none focus:bg-gumroad-yellow/20 transition-all placeholder:text-black/20"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-black uppercase tracking-widest">Category</label>
                  <select 
                    value={manualEntry.category}
                    onChange={e => setManualEntry({...manualEntry, category: e.target.value})}
                    className="w-full px-4 py-3 bg-white border-4 border-black font-bold outline-none appearance-none focus:bg-gumroad-pink/10 transition-all"
                  >
                    <option>Shopping</option>
                    <option>Transport</option>
                    <option>Food & Dining</option>
                    <option>Rent & Bills</option>
                    <option>Entertainment</option>
                    <option>Other</option>
                  </select>
                </div>

                {result?.items && result.items.length > 0 && (
                  <div className="mt-6 p-6 bg-slate-50 border-4 border-black neo-brutalism-shadow-xs">
                    <h4 className="text-xs font-black text-black uppercase tracking-widest mb-4 border-b-2 border-black pb-1 inline-block">Detected Items</h4>
                    <ul className="space-y-2 text-xs font-bold text-black uppercase tracking-tighter">
                      {result.items.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between border-b border-black/10 pb-1">
                          <span>{item.name}</span>
                          <span className="font-black">₹{item.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <motion.button
                  whileHover={{ x: 2, y: 2, boxShadow: 'none' }}
                  type="submit"
                  className="w-full mt-8 py-4 bg-black text-white border-4 border-black font-black uppercase tracking-widest text-sm neo-brutalism-shadow cursor-pointer transition-all"
                >
                  Save Transaction
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
