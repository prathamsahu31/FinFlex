import { motion } from 'motion/react';

export default function GlobalLoader() {
  return (
    <div className="flex-1 min-h-[500px] flex items-center justify-center p-8 bg-zinc-50/50 backdrop-blur-sm z-50 overflow-hidden relative">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full"
      >
        <div className="relative mb-8">
           {/* Neo-brutalism spinning squares */}
           <div className="relative w-24 h-24">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gumroad-pink border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 bg-gumroad-yellow border-4 border-black"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-4 h-4 bg-black rounded-full animate-ping" />
              </div>
           </div>
           
           {/* Floating Tag */}
           <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-12 -top-6 bg-white border-2 border-black px-2 py-1 rotate-12 neo-brutalism-shadow-xs z-20"
           >
              <span className="text-[10px] font-black uppercase text-black font-label tracking-widest leading-none">
                 HODL...
              </span>
           </motion.div>
        </div>

        <h3 className="font-headline font-black text-2xl uppercase tracking-tighter text-black mb-2 flex items-center gap-2">
           Loading Tool <span className="flex gap-1">
             <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
             <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
             <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
           </span>
        </h3>
        
        <div className="w-full h-1 bg-black/10 mt-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-full bg-black"
          />
        </div>
      </motion.div>
    </div>
  );
}
