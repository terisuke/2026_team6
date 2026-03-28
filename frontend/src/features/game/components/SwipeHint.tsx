'use client';

import { motion } from 'framer-motion';

interface SwipeHintProps {
  direction: 'left' | 'right' | null;
  intensity: number;
}

export function SwipeHint({ direction, intensity }: SwipeHintProps) {
  return (
    <div className="pointer-events-none flex w-full justify-between px-4">
      <motion.div
        animate={{ opacity: direction === 'left' ? intensity : 0 }}
        transition={{ duration: 0.1 }}
        className="flex items-center gap-1 text-lg font-bold text-red-400"
      >
        <span>←</span>
        <span>スルー</span>
      </motion.div>
      <motion.div
        animate={{ opacity: direction === 'right' ? intensity : 0 }}
        transition={{ duration: 0.1 }}
        className="flex items-center gap-1 text-lg font-bold text-blue-400"
      >
        <span>好き</span>
        <span>→</span>
      </motion.div>
    </div>
  );
}
