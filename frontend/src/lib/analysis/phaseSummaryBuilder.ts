import type { SwipeRoundData } from '@/features/game/types';
import type { AggregatedMetrics, PhaseSummaries } from './types';
import { aggregateMetrics } from './scoreCalculator';

/**
 * フェーズ別サマリーテキスト生成
 * warmup / main / pressure それぞれの行動特徴を日本語テキストで返す
 */

function describeVelocity(avg: number): string {
  if (avg > 0.8) return '素早く迷いのないスワイプ';
  if (avg > 0.4) return '適度なペースのスワイプ';
  return 'ゆっくりと慎重なスワイプ';
}

function describeHesitation(avgFirstMove: number): string {
  if (avgFirstMove > 2000) return '画像をじっくり見てから動き出す傾向';
  if (avgFirstMove > 800) return '少し考えてから操作を開始する傾向';
  return '瞬時に反応する傾向';
}

function describeSmoothness(avg: number): string {
  if (avg > 0.7) return '滑らかで一貫した軌跡';
  if (avg > 0.4) return 'やや迷いのある軌跡';
  return '方向転換が多い不安定な軌跡';
}

function describeReversals(avg: number): string {
  if (avg >= 2) return '何度も左右を行き来する迷い行動が顕著';
  if (avg >= 1) return '時折方向を変える場面が見られ';
  return '方向転換はほぼなく一直線に判断';
}

function buildWarmupSummary(metrics: AggregatedMetrics): string {
  const velocity = describeVelocity(metrics.avgSwipeVelocity);
  const hesitation = describeHesitation(metrics.avgTimeToFirstMove);
  const smoothness = describeSmoothness(metrics.avgMovementSmoothness);

  return (
    `ウォームアップでは${velocity}を見せ、${hesitation}がありました。` +
    `操作の軌跡は${smoothness}でした。`
  );
}

function buildMainSummary(metrics: AggregatedMetrics): string {
  const velocity = describeVelocity(metrics.avgSwipeVelocity);
  const reversals = describeReversals(metrics.avgReversalCount);
  const hesitation = describeHesitation(metrics.avgTimeToFirstMove);

  return (
    `メインラウンドでは${velocity}が続き、${reversals}ました。` +
    `${hesitation}が見られます。`
  );
}

function buildPressureSummary(
  pressureMetrics: AggregatedMetrics,
  mainMetrics: AggregatedMetrics
): string {
  const timeoutNote =
    pressureMetrics.timeoutCount > 0
      ? `${pressureMetrics.timeoutCount}回のタイムアウトが発生し、`
      : '';

  const velocityDiff =
    pressureMetrics.avgSwipeVelocity - mainMetrics.avgSwipeVelocity;
  const velocityChange =
    velocityDiff > 0.1
      ? 'スワイプ速度が上がり焦りが見られました'
      : velocityDiff < -0.1
        ? 'スワイプ速度が低下し慎重になりました'
        : 'スワイプ速度はメインフェーズと同程度を維持しました';

  const smoothnessDiff =
    pressureMetrics.avgMovementSmoothness -
    mainMetrics.avgMovementSmoothness;
  const smoothnessChange =
    smoothnessDiff < -0.15
      ? '操作の安定性が大きく低下しました。'
      : smoothnessDiff < -0.05
        ? '操作がやや不安定になりました。'
        : '操作の安定性を保ちました。';

  return `時間制限ラウンドでは${timeoutNote}${velocityChange}。${smoothnessChange}`;
}

export function buildPhaseSummaries(
  rounds: readonly SwipeRoundData[]
): PhaseSummaries {
  const warmupRounds = rounds.filter(
    (r) => r.roundNumber >= 1 && r.roundNumber <= 3
  );
  const mainRounds = rounds.filter(
    (r) => r.roundNumber >= 4 && r.roundNumber <= 8
  );
  const pressureRounds = rounds.filter(
    (r) => r.roundNumber >= 9 && r.roundNumber <= 10
  );

  const warmupMetrics = aggregateMetrics(warmupRounds);
  const mainMetrics = aggregateMetrics(mainRounds);
  const pressureMetrics = aggregateMetrics(pressureRounds);

  return {
    warmup:
      warmupRounds.length > 0
        ? buildWarmupSummary(warmupMetrics)
        : 'ウォームアップのデータがありません。',
    main:
      mainRounds.length > 0
        ? buildMainSummary(mainMetrics)
        : 'メインラウンドのデータがありません。',
    pressure:
      pressureRounds.length > 0
        ? buildPressureSummary(pressureMetrics, mainMetrics)
        : 'プレッシャーラウンドのデータがありません。',
  };
}
