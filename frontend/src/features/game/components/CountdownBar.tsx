'use client';

interface CountdownBarProps {
  timeRemaining: number;
  totalTime: number;
}

function getBarColor(ratio: number): string {
  if (ratio > 0.5) return 'bg-green-500';
  if (ratio > 0.25) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function CountdownBar({ timeRemaining, totalTime }: CountdownBarProps) {
  const ratio = totalTime > 0 ? timeRemaining / totalTime : 0;
  const percentage = Math.max(0, Math.min(100, ratio * 100));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full rounded-full transition-all duration-300 ease-linear ${getBarColor(ratio)}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
