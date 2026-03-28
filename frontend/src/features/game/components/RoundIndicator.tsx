'use client';

interface Props {
  current: number;
  total: number;
}

export default function RoundIndicator({ current, total }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current
              ? 'w-2 bg-white'
              : i === current
                ? 'w-6 bg-white'
                : 'w-2 bg-white/30'
          }`}
        />
      ))}
    </div>
  );
}
