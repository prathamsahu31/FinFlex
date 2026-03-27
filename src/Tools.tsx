import { motion } from 'motion/react';
import { cn } from './utils';
import { TOOLS_METADATA } from './constants';

interface ToolsProps {
  pinnedToolIds?: string[];
  togglePinTool?: (id: string) => void;
  setActiveTab?: (tab: string) => void;
}

export default function Tools({ pinnedToolIds = [], togglePinTool, setActiveTab }: ToolsProps) {
  const isPinned = (id: string) => pinnedToolIds.includes(id);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black font-headline text-black uppercase tracking-tight">Financial Tools</h1>
        <p className="text-black font-bold text-sm mt-1 border-l-4 border-black pl-3 uppercase tracking-tighter">Calculators and trackers to manage your wealth</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
        {TOOLS_METADATA.map(tool => (
          <motion.div
            key={tool.id}
            whileHover={{ x: 4, y: 4, boxShadow: 'none' }}
            transition={{ duration: 0.1 }}
            className="bg-white p-8 border-4 border-black neo-brutalism-shadow text-left group transition-all relative flex flex-col min-h-[320px]"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("w-16 h-16 border-4 border-black flex items-center justify-center neo-brutalism-shadow-sm", tool.color)}>
                <tool.icon size={32} strokeWidth={3} />
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Pin Tool</span>
                <div 
                  className={cn("minecraft-switch", isPinned(tool.id) && "active")}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinTool?.(tool.id);
                  }}
                >
                  <div className="minecraft-switch-handle" />
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-black font-headline text-black mb-2 uppercase">{tool.title}</h3>
            <p className="text-xs font-bold text-black uppercase tracking-tighter opacity-60 mb-8">{tool.description}</p>
            
            <button 
              onClick={() => setActiveTab?.(tool.id)}
              className="mt-auto w-full py-3 bg-black text-white font-black uppercase tracking-widest text-xs hover:bg-gumroad-pink hover:text-black transition-colors border-4 border-black neo-brutalism-shadow-xs cursor-pointer"
            >
              Open {tool.title}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
