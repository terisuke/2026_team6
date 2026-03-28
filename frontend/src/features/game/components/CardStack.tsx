'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { SwipeRoundConfig } from '../data/rounds';
import { SwipeCard } from './SwipeCard';

interface CardStackProps {
  currentRound: SwipeRoundConfig;
  nextRound?: SwipeRoundConfig;
  onSwipe: (direction: 'left' | 'right') => void;
  onDragMove?: (x: number, y: number) => void;
}

export function CardStack({
  currentRound,
  nextRound,
  onSwipe,
  onDragMove,
}: CardStackProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Next card (behind) */}
      {nextRound && (
        <div className="absolute">
          <motion.div
            initial={{ scale: 0.92, opacity: 0.5 }}
            animate={{ scale: 0.92, opacity: 0.5 }}
            className="pointer-events-none"
          >
            <SwipeCard
              leftImage={nextRound.leftImage}
              rightImage={nextRound.rightImage}
              onSwipe={() => {}}
              disabled
            />
          </motion.div>
        </div>
      )}

      {/* Current card (on top) */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentRound.roundNumber}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <SwipeCard
            leftImage={currentRound.leftImage}
            rightImage={currentRound.rightImage}
            onSwipe={onSwipe}
            onDragMove={onDragMove}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
