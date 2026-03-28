/**
 * マウス軌跡 × スワイプ行動 → 5軸スコアリングエンジン
 *
 * Meidenbauer et al. (2023) の知見をベースに、
 * スワイプ速度・軌道逸脱・ジッター・方向転換・注視時間から
 * 5軸の性格特性を 0-100 で算出する。
 */
import type { SwipeMetrics, BaselineScores } from '@/features/game/types';

// ---- ユーティリティ ----

const clamp = (v: number) => Math.max(0, Math.min(100, v));

const safeScore = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

const linear = (val: number, min: number, max: number) =>
  clamp(((val - min) / (max - min)) * 100);

const linearInv = (val: number, best: number, worst: number) =>
  clamp(100 - ((val - best) / (worst - best)) * 100);

const logNorm = (val: number, min: number, max: number) => {
  const safe = Math.max(min, Math.min(max, val));
  const num = Math.log(safe + 1) - Math.log(min + 1);
  const den = Math.log(max + 1) - Math.log(min + 1);
  return den === 0 ? 0 : clamp((num / den) * 100);
};

const mean = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

// ---- 軸別スコア算出 ----

function scoreCaution(rounds: SwipeMetrics[]): number {
  const avgDecisionTime = mean(rounds.map((r) => r.totalSwipeTime));
  const avgHover = mean(rounds.map((r) => r.hoverDuration));
  const avgReversals = mean(rounds.map((r) => r.reversalCount));
  const avgAUC = mean(rounds.map((r) => r.trajectoryAUC));

  const sTime = logNorm(avgDecisionTime, 800, 8000);
  const sHover = logNorm(avgHover, 200, 3000);
  const sReversal = linear(avgReversals, 0, 4);
  const sAUC = logNorm(avgAUC, 500, 20000);

  return safeScore(sTime * 0.3 + sHover * 0.25 + sReversal * 0.25 + sAUC * 0.2);
}

function scoreCalmness(rounds: SwipeMetrics[]): number {
  const phase1 = rounds.filter((r) => r.phase === 1);
  const phase3 = rounds.filter((r) => r.phase === 3);
  const all = rounds;

  const avgJitter = mean(all.map((r) => r.jitterCount));
  const avgSmooth = mean(all.map((r) => r.movementSmoothness));
  const avgVelVar = mean(all.map((r) => r.velocityVariance));

  const baseJitter = mean(phase1.map((r) => r.jitterCount));
  const pressJitter = mean(phase3.map((r) => r.jitterCount));
  const jitterDelta = phase3.length > 0 ? pressJitter - baseJitter : 0;

  const sJitter = linearInv(avgJitter, 2, 20);
  const sSmooth = linear(avgSmooth, 0.3, 0.95);
  const sVel = linearInv(avgVelVar, 0.01, 0.5);
  const sStress = linearInv(jitterDelta, 0, 10);

  return safeScore(sJitter * 0.3 + sSmooth * 0.25 + sVel * 0.2 + sStress * 0.25);
}

function scoreLogic(rounds: SwipeMetrics[]): number {
  // 同カテゴリ内の選択一貫性を算出
  const consistency = computeChoiceConsistency(rounds);
  const avgReversals = mean(rounds.map((r) => r.reversalCount));
  const avgMD = mean(rounds.map((r) => r.maxDeviation));

  const sConsist = linear(consistency, 0, 100);
  const sReversal = linearInv(avgReversals, 0, 4);
  const sDirect = linearInv(avgMD, 20, 200);

  return safeScore(sConsist * 0.4 + sReversal * 0.3 + sDirect * 0.3);
}

function scoreCooperativeness(rounds: SwipeMetrics[]): number {
  const socialRounds = rounds.filter(
    (r) => r.imageCategory === 'social' || r.imageCategory === 'helping',
  );
  const rightSwipeRate =
    socialRounds.length > 0
      ? socialRounds.filter((r) => r.swipeDirection === 'right').length / socialRounds.length
      : 0.5;

  const socialHover = mean(socialRounds.map((r) => r.hoverDuration));
  const allHover = mean(rounds.map((r) => r.hoverDuration));
  const hoverRatio = allHover > 0 ? socialHover / allHover : 1;

  const sChoice = linear(rightSwipeRate * 100, 0, 100);
  const sEngage = logNorm(hoverRatio * 100, 50, 200);

  return safeScore(sChoice * 0.6 + sEngage * 0.4);
}

function scorePositivity(rounds: SwipeMetrics[]): number {
  const avgVelocity = mean(rounds.map((r) => r.swipeVelocity));
  const avgDecision = mean(rounds.map((r) => r.totalSwipeTime));
  const avgFirstMove = mean(rounds.map((r) => r.timeToFirstMove));
  const timeoutCount = rounds.filter((r) => r.swipeDirection === 'timeout').length;

  const sSpeed = logNorm(avgVelocity * 1000, 100, 2000);
  const sDecision = linearInv(avgDecision, 500, 6000);
  const sFirst = linearInv(avgFirstMove, 100, 2000);
  const sTimeout = linearInv(timeoutCount, 0, 3);

  return safeScore(sSpeed * 0.25 + sDecision * 0.3 + sFirst * 0.25 + sTimeout * 0.2);
}

// ---- 一貫性スコア ----

function computeChoiceConsistency(rounds: SwipeMetrics[]): number {
  // Phase2のラウンドをカテゴリでグループ化し、同カテゴリ内で同方向スワイプした割合
  const phase2 = rounds.filter((r) => r.phase === 2 && r.swipeDirection !== 'timeout');
  if (phase2.length <= 1) return 50;

  // 全Phase2ラウンドで最頻スワイプ方向と一致する割合
  const rightCount = phase2.filter((r) => r.swipeDirection === 'right').length;
  const dominantRate = Math.max(rightCount, phase2.length - rightCount) / phase2.length;
  return dominantRate * 100;
}

// ---- メインエントリ ----

export function calculateScores(rounds: SwipeMetrics[]): BaselineScores {
  return {
    caution: scoreCaution(rounds),
    calmness: scoreCalmness(rounds),
    logic: scoreLogic(rounds),
    cooperativeness: scoreCooperativeness(rounds),
    positivity: scorePositivity(rounds),
  };
}
