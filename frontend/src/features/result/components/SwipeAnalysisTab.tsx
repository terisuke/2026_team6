'use client';

import { ArrowLeftRight, Clock, MousePointer, Zap } from 'lucide-react';
import type { GameDetail, PhaseSummaries } from '../types';
import FeatureScoreBar from './FeatureScoreBar';
import MetricsBarChart from './MetricsBarChart';

type SwipeAnalysisTabProps = {
  detail: GameDetail;
  phaseSummaries: PhaseSummaries;
};

const PHASE_CONFIG = [
  {
    key: 'warmup' as const,
    label: 'ウォームアップ',
    icon: MousePointer,
    color: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100',
  },
  {
    key: 'main' as const,
    label: 'メイン',
    icon: Zap,
    color: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100',
  },
  {
    key: 'pressure' as const,
    label: 'プレッシャー',
    icon: Clock,
    color: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100',
  },
] as const;

const TAB_COLOR = '#8b5cf6';

export default function SwipeAnalysisTab({
  detail,
  phaseSummaries,
}: SwipeAnalysisTabProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 lg:gap-8 h-full animate-in slide-in-from-right duration-500">
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* Feature Scores */}
        <section className="bg-purple-50 border-2 border-purple-100 p-3 rounded-[1.5rem] shadow-sm">
          <h3 className="mb-2 text-[10px] font-black text-purple-600 flex items-center gap-1 opacity-70">
            <ArrowLeftRight className="w-3 h-3" />
            スワイプ行動特徴
          </h3>
          <div className="space-y-1.5">
            {detail.feature_scores.map((fs) => (
              <FeatureScoreBar
                key={fs.axis}
                name={fs.name}
                score={fs.score}
                className="bg-white/40 px-2 py-1 rounded-md border border-purple-50/50"
              />
            ))}
          </div>
        </section>

        {/* Phase Summaries */}
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-black text-gray-500 tracking-wider uppercase">
            フェーズ別分析
          </h3>
          {PHASE_CONFIG.map((phase) => (
            <div
              key={phase.key}
              className={`${phase.color} ${phase.border} border-2 rounded-xl p-3`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`${phase.badge} ${phase.text} text-[10px] font-black px-2 py-0.5 rounded-full`}
                >
                  <phase.icon className="w-3 h-3 inline mr-1" />
                  {phase.label}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-700 leading-relaxed">
                {phaseSummaries[phase.key]}
              </p>
            </div>
          ))}
        </section>
      </div>

      {/* Right: Metrics Chart */}
      <section className="w-full md:w-2/3 flex flex-col pt-2">
        <h3 className="text-center font-black text-xl text-gray-400 mb-6 tracking-widest uppercase">
          スワイプ行動ログ
        </h3>

        <div className="flex-1 min-h-87.5">
          <MetricsBarChart
            metrics={detail.metrics}
            userBarColor={TAB_COLOR}
            averageBarColor="#d1d5db"
          />
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center gap-10 font-black text-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-4 rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: TAB_COLOR }}
            />
            <span style={{ color: TAB_COLOR }}>あなた</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-4 rounded-sm bg-gray-300" />
            <span className="text-gray-400">平均</span>
          </div>
        </div>
      </section>
    </div>
  );
}
