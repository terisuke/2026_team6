'use client';

import { useRef, useCallback } from 'react';
import type { SwipeMetrics, TrajectoryPoint } from '@/features/game/types';

export interface UseMouseTrackerReturn {
  startTracking: () => void;
  stopTracking: () => SwipeMetrics;
  recordPoint: (x: number, y: number) => void;
  getTrajectory: () => readonly TrajectoryPoint[];
}

/**
 * Track pointer movements during each round and calculate SwipeMetrics.
 * Uses refs to avoid re-renders during tracking.
 */
export function useMouseTracker(): UseMouseTrackerReturn {
  const trajectoryRef = useRef<TrajectoryPoint[]>([]);
  const roundStartRef = useRef<number>(0);
  const firstMoveTimestampRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    trajectoryRef.current = [];
    roundStartRef.current = performance.now();
    firstMoveTimestampRef.current = null;
  }, []);

  const recordPoint = useCallback((x: number, y: number) => {
    const now = performance.now();
    const timestamp = now - roundStartRef.current;

    if (firstMoveTimestampRef.current === null) {
      firstMoveTimestampRef.current = now;
    }

    const points = trajectoryRef.current;
    let velocity = 0;
    if (points.length > 0) {
      const prev = points[points.length - 1];
      const dt = timestamp - prev.timestamp;
      if (dt > 0) {
        const dx = x - prev.x;
        const dy = y - prev.y;
        velocity = Math.sqrt(dx * dx + dy * dy) / dt;
      }
    }

    points.push({ x, y, timestamp, velocity });
  }, []);

  const getTrajectory = useCallback(
    (): readonly TrajectoryPoint[] => [...trajectoryRef.current],
    []
  );

  const stopTracking = useCallback((): SwipeMetrics => {
    const points = trajectoryRef.current;
    const now = performance.now();
    const roundStart = roundStartRef.current;
    const firstMove = firstMoveTimestampRef.current;

    const timeToFirstMove = firstMove !== null ? firstMove - roundStart : now - roundStart;
    const totalSwipeTime = firstMove !== null ? now - firstMove : 0;

    if (points.length < 2) {
      return buildEmptyMetrics(timeToFirstMove, totalSwipeTime);
    }

    const velocities = points
      .map((p) => p.velocity ?? 0)
      .filter((v) => v > 0);

    const peakVelocity = velocities.length > 0
      ? Math.max(...velocities)
      : 0;

    const avgVelocity = velocities.length > 0
      ? velocities.reduce((a, b) => a + b, 0) / velocities.length
      : 0;

    const velocityVariance = computeVariance(velocities);

    const { maxDeviation, trajectoryAUC } = computeDeviationMetrics(points);
    const jitterCount = computeJitterCount(points);
    const reversalCount = computeReversalCount(points);

    const movementSmoothness = points.length > 1
      ? Math.max(0, Math.min(1, 1 - jitterCount / points.length))
      : 1;

    const hoverDuration = timeToFirstMove;

    return {
      timeToFirstMove,
      totalSwipeTime,
      swipeVelocity: avgVelocity,
      maxDeviation,
      trajectoryAUC,
      jitterCount,
      reversalCount,
      peakVelocity,
      velocityVariance,
      movementSmoothness,
      hoverDuration,
    };
  }, []);

  return { startTracking, stopTracking, recordPoint, getTrajectory };
}

// ========================================
// Internal helpers
// ========================================

function buildEmptyMetrics(
  timeToFirstMove: number,
  totalSwipeTime: number
): SwipeMetrics {
  return {
    timeToFirstMove,
    totalSwipeTime,
    swipeVelocity: 0,
    maxDeviation: 0,
    trajectoryAUC: 0,
    jitterCount: 0,
    reversalCount: 0,
    peakVelocity: 0,
    velocityVariance: 0,
    movementSmoothness: 1,
    hoverDuration: timeToFirstMove,
  };
}

function computeVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumSqDiff = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return sumSqDiff / values.length;
}

/**
 * Deviation from straight line between first and last points.
 * trajectoryAUC = sum of absolute deviations.
 */
function computeDeviationMetrics(
  points: readonly TrajectoryPoint[]
): { maxDeviation: number; trajectoryAUC: number } {
  if (points.length < 2) return { maxDeviation: 0, trajectoryAUC: 0 };

  const first = points[0];
  const last = points[points.length - 1];

  const lineX = last.x - first.x;
  const lineY = last.y - first.y;
  const lineLen = Math.sqrt(lineX * lineX + lineY * lineY);

  if (lineLen === 0) return { maxDeviation: 0, trajectoryAUC: 0 };

  let maxDev = 0;
  let auc = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const px = points[i].x - first.x;
    const py = points[i].y - first.y;
    const cross = Math.abs(px * lineY - py * lineX);
    const deviation = cross / lineLen;
    maxDev = Math.max(maxDev, deviation);
    auc += deviation;
  }

  return { maxDeviation: maxDev, trajectoryAUC: auc };
}

/**
 * Jitter = count of micro direction changes where consecutive dx signs differ.
 */
function computeJitterCount(points: readonly TrajectoryPoint[]): number {
  if (points.length < 3) return 0;
  let count = 0;
  for (let i = 2; i < points.length; i++) {
    const dx1 = points[i - 1].x - points[i - 2].x;
    const dx2 = points[i].x - points[i - 1].x;
    if (dx1 * dx2 < 0) count++;
  }
  return count;
}

/**
 * Reversal = major direction reversals (sustained left-to-right or right-to-left).
 * Requires at least 3 consecutive same-direction points to count.
 */
function computeReversalCount(
  points: readonly TrajectoryPoint[]
): number {
  if (points.length < 4) return 0;

  let currentDirection: 'left' | 'right' | null = null;
  let sameCount = 0;
  let reversals = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    if (dx === 0) continue;

    const dir: 'left' | 'right' = dx < 0 ? 'left' : 'right';

    if (dir === currentDirection) {
      sameCount++;
    } else {
      if (currentDirection !== null && sameCount >= 3) {
        reversals++;
      }
      currentDirection = dir;
      sameCount = 1;
    }
  }

  return reversals;
}
