/**
 * Analysis module internal types
 * Re-exports and extends types needed for scoring calculations
 */

export interface BaselineScores {
  readonly caution: number;
  readonly calmness: number;
  readonly logic: number;
  readonly cooperativeness: number;
  readonly positivity: number;
}

export interface AggregatedMetrics {
  readonly avgTimeToFirstMove: number;
  readonly avgSwipeVelocity: number;
  readonly avgMaxDeviation: number;
  readonly avgJitterCount: number;
  readonly avgReversalCount: number;
  readonly avgVelocityVariance: number;
  readonly avgMovementSmoothness: number;
  readonly avgHoverDuration: number;
  readonly avgTotalSwipeTime: number;
  readonly totalRounds: number;
  readonly timeoutCount: number;
}

export interface PhaseSummaries {
  readonly warmup: string;
  readonly main: string;
  readonly pressure: string;
}

export interface DiagnosisFeedback {
  readonly title: string;
  readonly description: string;
  readonly gap_point: string;
}
