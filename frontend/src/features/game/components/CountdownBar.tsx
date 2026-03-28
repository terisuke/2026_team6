'use client';

import { motion } from 'framer-motion';

interface Props {
  durationSec: number;
  running: boolean;
}

export default function CountdownBar({ durationSec, running }: Props) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
        initial={{ width: '100%' }}
        animate={running ? { width: '0%' } : { width: '100%' }}
        transition={
          running
            ? { duration: durationSec, ease: 'linear' }
            : { duration: 0.3 }
        }
      />
    </div>
  );
}
