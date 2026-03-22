import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

export default function CountUp({ 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  duration = 1.5 
}: { 
  value: number, 
  prefix?: string, 
  suffix?: string, 
  decimals?: number,
  duration?: number
}) {
  const count = useMotionValue(0);
  
  const rounded = useTransform(count, (latest) => {
    return prefix + Number(latest).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
  });

  useEffect(() => {
    const controls = animate(count, value, { 
      duration: duration, 
      ease: "easeOut" 
    });
    return controls.stop;
  }, [value, duration]);

  return <motion.span>{rounded}</motion.span>;
}
