'use client';

import { useRef, useCallback } from 'react';
import type { PointerSample, SwipeMetrics } from '../types';

/**
 * ~60Hz でポインター座標をサンプリングし、
 * ラウンド終了時に SwipeMetrics を算出するフック。
 */
export function useMouseTracker() {
  const samples = useRef<PointerSample[]>([]);
  const roundStart = useRef(0);
  const firstMoveTime = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const startRound = useCallback(() => {
    samples.current = [];
    roundStart.current = performance.now();
    firstMoveTime.current = null;
    startPos.current = null;
  }, []);

  const recordPointer = useCallback((x: number, y: number) => {
    const t = performance.now();
    if (startPos.current === null) {
      startPos.current = { x, y };
    }

    // 初動検出（10px以上移動）
    if (firstMoveTime.current === null && startPos.current) {
      const dx = x - startPos.current.x;
      const dy = y - startPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        firstMoveTime.current = t;
      }
    }

    samples.current.push({ x, y, t });
  }, []);

  const finishRound = useCallback(
    (
      roundIndex: number,
      phase: 1 | 2 | 3,
      category: string,
      direction: 'right' | 'left' | 'timeout',
    ): SwipeMetrics => {
      const now = performance.now();
      const pts = samples.current;
      const totalTime = now - roundStart.current;
      const timeToFirstMove =
        firstMoveTime.current !== null
          ? firstMoveTime.current - roundStart.current
          : totalTime;

      if (pts.length < 2) {
        return emptyMetrics(roundIndex, phase, category, direction, totalTime, timeToFirstMove);
      }

      // ---- 速度プロファイル ----
      const velocities: number[] = [];
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        const dt = pts[i].t - pts[i - 1].t;
        if (dt > 0) velocities.push(Math.sqrt(dx * dx + dy * dy) / dt);
      }
      const avgVel = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;
      const peakVel = velocities.length > 0 ? Math.max(...velocities) : 0;
      const velMean = avgVel;
      const velVar =
        velocities.length > 1
          ? velocities.reduce((s, v) => s + (v - velMean) ** 2, 0) / velocities.length
          : 0;

      // ---- 軌道逸脱 (MD & AUC) ----
      const start = pts[0];
      const end = pts[pts.length - 1];
      const lineLen = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      let maxDev = 0;
      let sumDev = 0;
      if (lineLen > 1) {
        for (const p of pts) {
          const d = pointToLineDist(p.x, p.y, start.x, start.y, end.x, end.y);
          if (d > maxDev) maxDev = d;
          sumDev += d;
        }
      }
      const auc = lineLen > 1 ? (sumDev / pts.length) * lineLen : 0;

      // ---- ジッター (100ms窓内90°超方向変化) ----
      let jitter = 0;
      for (let i = 2; i < pts.length; i++) {
        if (pts[i].t - pts[i - 2].t > 100) continue;
        const a1 = Math.atan2(pts[i - 1].y - pts[i - 2].y, pts[i - 1].x - pts[i - 2].x);
        const a2 = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
        let diff = Math.abs(a2 - a1);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff > Math.PI / 2) jitter++;
      }

      // ---- 方向転換 (左右反転) ----
      let reversals = 0;
      let prevDir: 'left' | 'right' | null = null;
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        if (Math.abs(dx) < 3) continue;
        const dir = dx > 0 ? 'right' : 'left';
        if (prevDir !== null && dir !== prevDir) reversals++;
        prevDir = dir;
      }

      // ---- 滑らかさ ----
      const smoothness = pts.length > 2 ? 1 - Math.min(jitter / pts.length, 1) : 0.5;

      // ---- ホバー (初動前の静止時間) ----
      const hover = timeToFirstMove;

      return {
        roundIndex,
        phase,
        imageCategory: category,
        swipeDirection: direction,
        timeToFirstMove,
        totalSwipeTime: totalTime,
        swipeVelocity: avgVel,
        maxDeviation: maxDev,
        trajectoryAUC: auc,
        jitterCount: jitter,
        reversalCount: reversals,
        peakVelocity: peakVel,
        velocityVariance: velVar,
        movementSmoothness: smoothness,
        hoverDuration: hover,
      };
    },
    [],
  );

  return { startRound, recordPointer, finishRound };
}

// ---- ヘルパー ----

function pointToLineDist(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const num = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1);
  const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
  return den === 0 ? 0 : num / den;
}

function emptyMetrics(
  roundIndex: number,
  phase: 1 | 2 | 3,
  category: string,
  direction: 'right' | 'left' | 'timeout',
  totalTime: number,
  timeToFirstMove: number,
): SwipeMetrics {
  return {
    roundIndex,
    phase,
    imageCategory: category,
    swipeDirection: direction,
    timeToFirstMove,
    totalSwipeTime: totalTime,
    swipeVelocity: 0,
    maxDeviation: 0,
    trajectoryAUC: 0,
    jitterCount: 0,
    reversalCount: 0,
    peakVelocity: 0,
    velocityVariance: 0,
    movementSmoothness: 0.5,
    hoverDuration: timeToFirstMove,
  };
}
