'use client';

import type { RoundPhase } from '../types';

interface RoundIndicatorProps {
  currentRound: number;
  totalRounds: number;
  phase: RoundPhase;
}

const PHASE_CONFIG: Record<RoundPhase, { label: string; color: string }> = {
  warmup: { label: 'ウォームアップ', color: 'bg-blue-100 text-blue-700' },
  main: { label: '本番', color: 'bg-green-100 text-green-700' },
  pressure: { label: 'プレッシャー', color: 'bg-red-100 text-red-700' },
};

export function RoundIndicator({
  currentRound,
  totalRounds,
  phase,
}: RoundIndicatorProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold text-slate-700">
        {currentRound} / {totalRounds}
      </span>
      <span
        className={`rounded-full px-3 py-0.5 text-xs font-semibold ${config.color}`}
      >
        {config.label}
      </span>
    </div>
  );
}
