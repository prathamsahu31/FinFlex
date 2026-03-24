import { useState } from 'react';
import { motion, useMotionValue, useTransform, useScroll } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { cn } from './utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const pullThreshold = 100;

  const handleDrag = (_: any, info: any) => {
    if (isRefreshing) return;
    const progress = Math.min(Math.max(info.point.y / pullThreshold, 0), 1);
    setPullProgress(progress);
  };

  const handleDragEnd = async (_: any, info: any) => {
    if (isRefreshing) return;
    if (info.point.y > pullThreshold) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullProgress(0);
  };

  return (
    <div className="relative w-full h-full">
      {/* Pull Indicator (Squircle) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        style={{ transform: `translateX(-50%) translateY(${pullProgress * 50 - 40}px)` }}
      >
        <motion.div 
          animate={isRefreshing ? { rotate: 360 } : { rotate: pullProgress * 180 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "spring" }}
          className={cn(
            "w-12 h-12 border-4 border-black bg-gumroad-yellow flex items-center justify-center neo-brutalism-shadow-xs transition-all",
            pullProgress > 0 || isRefreshing ? "opacity-100 scale-100" : "opacity-0 scale-50",
            "rounded-[1.2rem]" // Squircle-ish
          )}
        >
          <RefreshCw size={24} strokeWidth={3} className="text-black" />
        </motion.div>
      </div>

      {/* Draggable Content Wrapper */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={isRefreshing ? { y: 60 } : { y: 0 }}
        className="w-full h-full overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}
