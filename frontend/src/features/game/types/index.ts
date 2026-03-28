// ========================================
// Swipe-based Image Selection Game Types
// ========================================

/** Swipe direction chosen by the user */
export type SwipeDirection = 'left' | 'right';

/** A single mouse/pointer trajectory sample */
export interface TrajectoryPoint {
  /** X coordinate in viewport pixels */
  readonly x: number;
  /** Y coordinate in viewport pixels */
  readonly y: number;
  /** Milliseconds since round start */
  readonly timestamp: number;
  /** Instantaneous velocity in px/ms (computed post-hoc) */
  readonly velocity?: number;
}

/** Behavioral metrics calculated for a single swipe round */
export interface SwipeMetrics {
  /** ms: card shown to first pointer move */
  readonly timeToFirstMove: number;
  /** ms: first move to swipe complete */
  readonly totalSwipeTime: number;
  /** px/ms: average swipe velocity */
  readonly swipeVelocity: number;
  /** px: max deviation from ideal straight line */
  readonly maxDeviation: number;
  /** px*ms: area under trajectory curve (deviation integral) */
  readonly trajectoryAUC: number;
  /** Direction change count (micro-reversals) */
  readonly jitterCount: number;
  /** Major direction reversals (left to right) */
  readonly reversalCount: number;
  /** px/ms: peak instantaneous velocity */
  readonly peakVelocity: number;
  /** Variance of velocity samples */
  readonly velocityVariance: number;
  /** 0-1 scale, higher = smoother movement */
  readonly movementSmoothness: number;
  /** ms: stationary time before swipe begins */
  readonly hoverDuration: number;
}

/** Phase within the 10-round game progression */
export type RoundPhase = 'warmup' | 'main' | 'pressure';

/** Five personality measurement axes */
export type MeasurementAxis =
  | 'caution'
  | 'calmness'
  | 'logic'
  | 'cooperativeness'
  | 'positivity';

/** Data recorded for a single completed round */
export interface SwipeRoundData {
  readonly roundNumber: number;
  /** 'timeout' if the user did not swipe before time expired */
  readonly direction: SwipeDirection | 'timeout';
  readonly metrics: SwipeMetrics;
  readonly trajectory: readonly TrajectoryPoint[];
  /** Unix timestamp in milliseconds */
  readonly startedAt: number;
  /** Unix timestamp in milliseconds */
  readonly completedAt: number;
}

/** Complete game payload sent to DB as game_logs.raw_data */
export interface SwipeGameData {
  readonly rounds: readonly SwipeRoundData[];
  /** Total game duration in milliseconds */
  readonly totalDuration: number;
  /** ISO 8601 completion timestamp */
  readonly completedAt: string;
}

/** UI state machine for the game flow */
export type GameFlowState = 'intro' | 'playing' | 'submitting' | 'done';
