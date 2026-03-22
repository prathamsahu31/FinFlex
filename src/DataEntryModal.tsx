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
          setError(err.message || 'Failed to process receipt');
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
          className="bg-slate-50 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
        >
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Data Entry & OCR</h2>
              <p className="text-sm text-slate-500">Upload receipts or enter transactions manually.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* OCR Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Scan Receipt
              </h3>
              
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                  <Upload size={24} />
                </div>
                <p className="font-medium text-slate-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500">SVG, PNG, JPG or PDF (max. 5MB)</p>
                
                {file && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                    <CheckCircle2 size={16} />
                    {file.name}
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={processReceipt}
                disabled={!file || isProcessing}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isProcessing ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing with AI...</>
                ) : (
                  'Extract Data'
                )}
              </motion.button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <p>{success}</p>
                </div>
              )}
            </div>

            {/* Manual Entry Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Transaction Details</h3>
              
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Description</label>
                  <input 
                    type="text" 
                    required
                    value={manualEntry.vendor}
                    onChange={e => setManualEntry({...manualEntry, vendor: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="e.g. Amazon, Starbucks"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select 
                      value={manualEntry.type}
                      onChange={e => setManualEntry({...manualEntry, type: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={manualEntry.date}
                      onChange={e => setManualEntry({...manualEntry, date: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={manualEntry.amount}
                      onChange={e => setManualEntry({...manualEntry, amount: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={manualEntry.date}
                      onChange={e => setManualEntry({...manualEntry, date: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    value={manualEntry.category}
                    onChange={e => setManualEntry({...manualEntry, category: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
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
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Detected Items</h4>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {result.items.map((item: any, i: number) => (
                        <li key={i} className="flex justify-between">
                          <span>{item.name}</span>
                          <span className="font-medium">${item.price}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
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
