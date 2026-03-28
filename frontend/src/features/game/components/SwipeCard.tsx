'use client';

import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useCallback } from 'react';

const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  leftImage: { path: string; label: string };
  rightImage: { path: string; label: string };
  onSwipe: (direction: 'left' | 'right') => void;
  onDragMove?: (x: number, y: number) => void;
  disabled?: boolean;
}

export function SwipeCard({
  leftImage,
  rightImage,
  onSwipe,
  onDragMove,
  disabled = false,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const leftIndicatorOpacity = useTransform(x, [-200, -50, 0], [1, 0.3, 0]);
  const rightIndicatorOpacity = useTransform(x, [0, 50, 200], [0, 0.3, 1]);

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      onDragMove?.(info.point.x, info.point.y);
    },
    [onDragMove],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const offset = info.offset.x;
      if (Math.abs(offset) > SWIPE_THRESHOLD) {
        onSwipe(offset > 0 ? 'right' : 'left');
      }
    },
    [onSwipe],
  );

  return (
    <motion.div
      style={{ x, rotate }}
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="relative w-[320px] max-w-[480px] cursor-grab rounded-2xl bg-white shadow-xl active:cursor-grabbing sm:w-[420px] md:w-[480px]"
    >
      {/* Left swipe indicator */}
      <motion.div
        style={{ opacity: leftIndicatorOpacity }}
        className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-1"
      >
        <span className="text-sm font-bold text-red-500">スルー</span>
      </motion.div>

      {/* Right swipe indicator */}
      <motion.div
        style={{ opacity: rightIndicatorOpacity }}
        className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg border-2 border-blue-400 bg-blue-50 px-3 py-1"
      >
        <span className="text-sm font-bold text-blue-500">好き</span>
      </motion.div>

      {/* Image pair */}
      <div className="flex gap-2 p-4">
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <Image
              src={leftImage.path}
              alt={leftImage.label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 140px, 200px"
            />
          </div>
          <span className="text-xs font-medium text-slate-600">
            {leftImage.label}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <Image
              src={rightImage.path}
              alt={rightImage.label}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 140px, 200px"
            />
          </div>
          <span className="text-xs font-medium text-slate-600">
            {rightImage.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
