import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorStr: error.toString() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-8 bg-zinc-50 relative overflow-hidden">
           <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 10 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="bg-white border-4 border-black p-8 neo-brutalism-shadow-lg max-w-lg w-full relative z-10"
           >
              <div className="flex items-center gap-4 border-b-4 border-black pb-6 mb-6">
                 <div className="bg-rose-500 p-3 border-4 border-black shrink-0">
                    <AlertOctagon size={32} className="text-white" strokeWidth={3} />
                 </div>
                 <div>
                    <h2 className="font-headline font-black text-2xl uppercase tracking-tighter text-black leading-none">System Malfunction</h2>
                    <p className="font-label font-bold text-[10px] uppercase tracking-widest text-black/50 mt-1">Component Crash Detected</p>
                 </div>
              </div>
              
              <div className="bg-zinc-900 border-4 border-black p-4 mb-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse" />
                 <p className="font-mono text-xs text-rose-400 font-bold whitespace-pre-wrap break-words">
                    {this.state.errorStr || "Unknown runtime error occurred."}
                 </p>
              </div>

              <p className="text-sm font-bold text-black/70 mb-8 italic">
                 Don't panic. The core system is still operational, but this specific module experienced a catastrophic failure.
              </p>

              <button 
                 onClick={() => window.location.reload()}
                 className="w-full bg-gumroad-yellow hover:bg-gumroad-pink border-4 border-black p-4 font-headline font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 transition-colors active:translate-y-1 neo-brutalism-shadow-sm active:shadow-none"
              >
                 <RefreshCw size={20} strokeWidth={3} /> Reboot System
              </button>
           </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
