/**
 * スワイプゲーム 5軸スコア算出エンジン
 *
 * Input:  SwipeRoundData[] (10ラウンド分)
 * Output: BaselineScores { caution, calmness, logic, cooperativeness, positivity } (0-100)
 *
 * 各軸の重み付け:
 *   caution       = 30% timeToFirstMove + 25% hoverDuration + 25% reversalCount + 20% maxDeviation
 *   calmness      = 30% (1-jitterCount) + 25% movementSmoothness + 20% (1-velocityVariance) + 25% pressureStability
 *   logic         = 40% selectionConsistency + 30% (1-reversalCount) + 30% trajectoryDirectness
 *   cooperativeness = 60% socialImageRightSwipeRate + 40% socialImageHoverRatio
 *   positivity    = 25% swipeVelocity + 30% decisionSpeed + 25% timeToFirstMove_inv + 20% (1-timeoutRate)
 */

import type { SwipeRoundData } from '@/features/game/types';
import type { AggregatedMetrics, BaselineScores } from './types';
import { ROUNDS } from '@/features/game/data/rounds';

// ========================================
// Normalization helpers
// ========================================

export function normalizeToScore(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

function invertedNormalize(
  value: number,
  min: number,
  max: number
): number {
  return normalizeToScore(max - (value - min), min, max);
}

const safeScore = (v: number): number =>
  Math.min(100, Math.max(0, Math.round(v)));

// ========================================
// Metric Aggregation
// ========================================

export function aggregateMetrics(
  rounds: readonly SwipeRoundData[]
): AggregatedMetrics {
  if (rounds.length === 0) {
    return {
      avgTimeToFirstMove: 0,
      avgSwipeVelocity: 0,
      avgMaxDeviation: 0,
      avgJitterCount: 0,
      avgReversalCount: 0,
      avgVelocityVariance: 0,
      avgMovementSmoothness: 0,
      avgHoverDuration: 0,
      avgTotalSwipeTime: 0,
      totalRounds: 0,
      timeoutCount: 0,
    };
  }

  const activeRounds = rounds.filter((r) => r.direction !== 'timeout');
  const count = activeRounds.length || 1;
  const timeoutCount = rounds.filter((r) => r.direction === 'timeout').length;

  const sum = activeRounds.reduce(
    (acc, r) => ({
      timeToFirstMove: acc.timeToFirstMove + r.metrics.timeToFirstMove,
      swipeVelocity: acc.swipeVelocity + r.metrics.swipeVelocity,
      maxDeviation: acc.maxDeviation + r.metrics.maxDeviation,
      jitterCount: acc.jitterCount + r.metrics.jitterCount,
      reversalCount: acc.reversalCount + r.metrics.reversalCount,
      velocityVariance: acc.velocityVariance + r.metrics.velocityVariance,
      movementSmoothness: acc.movementSmoothness + r.metrics.movementSmoothness,
      hoverDuration: acc.hoverDuration + r.metrics.hoverDuration,
      totalSwipeTime: acc.totalSwipeTime + r.metrics.totalSwipeTime,
    }),
    {
      timeToFirstMove: 0,
      swipeVelocity: 0,
      maxDeviation: 0,
      jitterCount: 0,
      reversalCount: 0,
      velocityVariance: 0,
      movementSmoothness: 0,
      hoverDuration: 0,
      totalSwipeTime: 0,
    }
  );

  return {
    avgTimeToFirstMove: sum.timeToFirstMove / count,
    avgSwipeVelocity: sum.swipeVelocity / count,
    avgMaxDeviation: sum.maxDeviation / count,
    avgJitterCount: sum.jitterCount / count,
    avgReversalCount: sum.reversalCount / count,
    avgVelocityVariance: sum.velocityVariance / count,
    avgMovementSmoothness: sum.movementSmoothness / count,
    avgHoverDuration: sum.hoverDuration / count,
    avgTotalSwipeTime: sum.totalSwipeTime / count,
    totalRounds: rounds.length,
    timeoutCount,
  };
}

// ========================================
// Per-axis score calculation
// ========================================

function calculateCaution(metrics: AggregatedMetrics): number {
  const timeToFirst = normalizeToScore(metrics.avgTimeToFirstMove, 200, 4000);
  const hover = normalizeToScore(metrics.avgHoverDuration, 0, 3000);
  const reversals = normalizeToScore(metrics.avgReversalCount, 0, 5);
  const deviation = normalizeToScore(metrics.avgMaxDeviation, 0, 200);

  return safeScore(
    timeToFirst * 0.30 +
    hover * 0.25 +
    reversals * 0.25 +
    deviation * 0.20
  );
}

function calculateCalmness(
  metrics: AggregatedMetrics,
  pressureMetrics: AggregatedMetrics,
  mainMetrics: AggregatedMetrics
): number {
  const jitterInv = invertedNormalize(metrics.avgJitterCount, 0, 20);
  const smoothness = normalizeToScore(
    metrics.avgMovementSmoothness * 100,
    0,
    100
  );
  const varianceInv = invertedNormalize(metrics.avgVelocityVariance, 0, 2);

  const pressureStability = calculatePressureStability(
    pressureMetrics,
    mainMetrics
  );

  return safeScore(
    jitterInv * 0.30 +
    smoothness * 0.25 +
    varianceInv * 0.20 +
    pressureStability * 0.25
  );
}

function calculatePressureStability(
  pressure: AggregatedMetrics,
  main: AggregatedMetrics
): number {
  if (main.totalRounds === 0 || pressure.totalRounds === 0) return 50;

  const smoothDiff = Math.abs(
    pressure.avgMovementSmoothness - main.avgMovementSmoothness
  );
  const velDiff = Math.abs(
    pressure.avgSwipeVelocity - main.avgSwipeVelocity
  );

  const smoothStability = invertedNormalize(smoothDiff, 0, 0.5);
  const velStability = invertedNormalize(velDiff, 0, 1);

  return safeScore(smoothStability * 0.5 + velStability * 0.5);
}

function calculateLogic(
  metrics: AggregatedMetrics,
  rounds: readonly SwipeRoundData[]
): number {
  const consistency = calculateSelectionConsistency(rounds);
  const reversalInv = invertedNormalize(metrics.avgReversalCount, 0, 5);
  const directness = calculateTrajectoryDirectness(metrics);

  return safeScore(
    consistency * 0.40 +
    reversalInv * 0.30 +
    directness * 0.30
  );
}

function calculateSelectionConsistency(
  rounds: readonly SwipeRoundData[]
): number {
  const categoryDirections = new Map<string, string[]>();

  for (const round of rounds) {
    if (round.direction === 'timeout') continue;
    const config = ROUNDS.find(
      (r) => r.roundNumber === round.roundNumber
    );
    if (!config) continue;

    const existing = categoryDirections.get(config.imageCategory) ?? [];
    categoryDirections.set(config.imageCategory, [
      ...existing,
      round.direction,
    ]);
  }

  let consistentCategories = 0;
  let totalCategories = 0;

  for (const directions of categoryDirections.values()) {
    if (directions.length < 2) continue;
    totalCategories++;
    const allSame = directions.every((d) => d === directions[0]);
    if (allSame) consistentCategories++;
  }

  if (totalCategories === 0) return 50;
  return normalizeToScore(consistentCategories / totalCategories, 0, 1);
}

function calculateTrajectoryDirectness(
  metrics: AggregatedMetrics
): number {
  const deviationInv = invertedNormalize(metrics.avgMaxDeviation, 0, 200);
  const jitterInv = invertedNormalize(metrics.avgJitterCount, 0, 20);
  return safeScore(deviationInv * 0.5 + jitterInv * 0.5);
}

function calculateCooperativeness(
  rounds: readonly SwipeRoundData[]
): number {
  const socialRounds = rounds.filter((r) => {
    const config = ROUNDS.find((c) => c.roundNumber === r.roundNumber);
    return config?.imageCategory === 'group_vs_individual';
  });

  if (socialRounds.length === 0) return 50;

  const activeRounds = socialRounds.filter((r) => r.direction !== 'timeout');
  if (activeRounds.length === 0) return 50;

  const leftSwipes = activeRounds.filter(
    (r) => r.direction === 'left'
  ).length;
  const socialRate = leftSwipes / activeRounds.length;

  const avgHover =
    activeRounds.reduce((sum, r) => sum + r.metrics.hoverDuration, 0) /
    activeRounds.length;
  const hoverRatio = normalizeToScore(avgHover, 0, 3000);

  return safeScore(
    normalizeToScore(socialRate, 0, 1) * 0.60 + hoverRatio * 0.40
  );
}

function calculatePositivity(
  metrics: AggregatedMetrics,
  rounds: readonly SwipeRoundData[]
): number {
  const velocity = normalizeToScore(metrics.avgSwipeVelocity, 0.1, 1.5);
  const decisionSpeed = invertedNormalize(metrics.avgTotalSwipeTime, 200, 5000);
  const firstMoveInv = invertedNormalize(metrics.avgTimeToFirstMove, 200, 4000);

  const timeoutRate =
    rounds.length > 0
      ? rounds.filter((r) => r.direction === 'timeout').length / rounds.length
      : 0;
  const noTimeoutScore = invertedNormalize(timeoutRate, 0, 0.5);

  return safeScore(
    velocity * 0.25 +
    decisionSpeed * 0.30 +
    firstMoveInv * 0.25 +
    noTimeoutScore * 0.20
  );
}

// ========================================
// Main entry point
// ========================================

export function calculateScores(
  rounds: readonly SwipeRoundData[]
): BaselineScores {
  const allMetrics = aggregateMetrics(rounds);

  const mainRounds = rounds.filter(
    (r) => r.roundNumber >= 4 && r.roundNumber <= 8
  );
  const pressureRounds = rounds.filter(
    (r) => r.roundNumber >= 9 && r.roundNumber <= 10
  );

  const mainMetrics = aggregateMetrics(mainRounds);
  const pressureMetrics = aggregateMetrics(pressureRounds);

  return {
    caution: calculateCaution(allMetrics),
    calmness: calculateCalmness(allMetrics, pressureMetrics, mainMetrics),
    logic: calculateLogic(allMetrics, rounds),
    cooperativeness: calculateCooperativeness(rounds),
    positivity: calculatePositivity(allMetrics, rounds),
  };
}
