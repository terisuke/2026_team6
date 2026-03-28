'use client';

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useRef, type PointerEvent } from 'react';

const SWIPE_THRESHOLD = 120;

interface Props {
  imageUrl: string;
  imageAlt: string;
  onSwipe: (direction: 'left' | 'right') => void;
  onPointerMove: (x: number, y: number) => void;
  active: boolean;
}

export default function SwipeCard({
  imageUrl,
  imageAlt,
  onSwipe,
  onPointerMove,
  active,
}: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);

  const leftOpacity = useTransform(x, [-150, -50, 0], [1, 0.4, 0]);
  const rightOpacity = useTransform(x, [0, 50, 150], [0, 0.4, 1]);

  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!active) return;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      onPointerMove(e.clientX - rect.left, e.clientY - rect.top);
    },
    [active, onPointerMove],
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | globalThis.PointerEvent, info: PanInfo) => {
      if (info.offset.x > SWIPE_THRESHOLD) {
        onSwipe('right');
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        onSwipe('left');
      }
    },
    [onSwipe],
  );

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      onPointerMove={handlePointerMove}
      whileTap={{ scale: 1.02 }}
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* カード画像 */}
        <div className="relative h-full w-full">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 90vw, 400px"
            priority
          />
        </div>

        {/* スワイプ方向ヒント */}
        <motion.div
          className="absolute left-6 top-6 rounded-xl border-4 border-red-400 px-4 py-2"
          style={{ opacity: leftOpacity }}
        >
          <span className="text-2xl font-bold text-red-400">NOPE</span>
        </motion.div>
        <motion.div
          className="absolute right-6 top-6 rounded-xl border-4 border-green-400 px-4 py-2"
          style={{ opacity: rightOpacity }}
        >
          <span className="text-2xl font-bold text-green-400">LIKE</span>
        </motion.div>

        {/* 画像説明 */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <p className="text-lg font-medium text-white drop-shadow-lg">{imageAlt}</p>
        </div>
      </div>
    </motion.div>
  );
}
