'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  gameFlowAtom,
  roundDataAtom,
  currentRoundAtom,
  gameDataAtom,
} from '@/stores/game';
import { ROUNDS, TOTAL_ROUNDS } from '@/features/game/data/rounds';
import type { SwipeRoundConfig } from '@/features/game/data/rounds';
import type {
  SwipeDirection,
  SwipeRoundData,
  SwipeGameData,
  GameFlowState,
} from '@/features/game/types';
import { useMouseTracker } from './useMouseTracker';
import { submitGameData } from '@/lib/db';

export interface UseSwipeGameReturn {
  readonly currentRound: SwipeRoundConfig;
  readonly roundIndex: number;
  readonly totalRounds: number;
  readonly timeRemaining: number;
  readonly gameState: GameFlowState;
  readonly startGame: () => void;
  readonly handleSwipe: (direction: SwipeDirection) => void;
  readonly handleTimeout: () => void;
  readonly recordPoint: (x: number, y: number) => void;
}

export function useSwipeGame(): UseSwipeGameReturn {
  const [gameState, setGameState] = useAtom(gameFlowAtom);
  const [rounds, setRounds] = useAtom(roundDataAtom);
  const [roundIndex, setRoundIndex] = useAtom(currentRoundAtom);
  const [, setGameData] = useAtom(gameDataAtom);

  const [timeRemaining, setTimeRemaining] = useState(0);

  const tracker = useMouseTracker();

  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartAtRef = useRef(0);
  const gameStartAtRef = useRef(0);
  const isProcessingRef = useRef(false);
  const completeRoundRef = useRef<(direction: SwipeDirection | 'timeout') => void>(() => {});

  const currentRound = ROUNDS[roundIndex] ?? ROUNDS[0];

  const clearTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const finishGame = useCallback(
    async (allRounds: readonly SwipeRoundData[]) => {
      setGameState('submitting');

      const data: SwipeGameData = {
        rounds: allRounds,
        totalDuration: Date.now() - gameStartAtRef.current,
        completedAt: new Date().toISOString(),
      };

      setGameData(data);

      const userId = localStorage.getItem('user_id');
      if (userId) {
        try {
          await submitGameData(userId, 1, data);
        } catch {
          // Submission failure is non-blocking
        }
      }

      setGameState('done');
    },
    [setGameState, setGameData]
  );

  const beginRound = useCallback(
    (index: number) => {
      const round = ROUNDS[index];
      if (!round) return;
      isProcessingRef.current = false;
      tracker.startTracking();

      // Start the timer using wall-clock time to avoid drift
      clearTimer();
      roundStartAtRef.current = Date.now();
      setTimeRemaining(round.timeLimit);

      timerIdRef.current = setInterval(() => {
        const elapsed = (Date.now() - roundStartAtRef.current) / 1000;
        const remaining = Math.max(0, round.timeLimit - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          completeRoundRef.current('timeout');
        }
      }, 100);
    },
    [tracker, clearTimer]
  );

  const completeRound = useCallback(
    (direction: SwipeDirection | 'timeout') => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      clearTimer();

      const metrics = tracker.stopTracking();
      const trajectory = tracker.getTrajectory();

      const roundData: SwipeRoundData = {
        roundNumber: currentRound.roundNumber,
        direction,
        metrics,
        trajectory,
        startedAt: roundStartAtRef.current,
        completedAt: Date.now(),
      };

      const updatedRounds = [...rounds, roundData];
      setRounds(updatedRounds);

      const nextIndex = roundIndex + 1;
      if (nextIndex >= TOTAL_ROUNDS) {
        finishGame(updatedRounds);
      } else {
        setRoundIndex(nextIndex);
        beginRound(nextIndex);
      }
    },
    [
      clearTimer,
      tracker,
      currentRound.roundNumber,
      rounds,
      setRounds,
      roundIndex,
      setRoundIndex,
      finishGame,
      beginRound,
    ]
  );

  // Keep ref in sync so the interval can call the latest completeRound
  useEffect(() => {
    completeRoundRef.current = completeRound;
  });

  const startGame = useCallback(() => {
    setRounds([]);
    setRoundIndex(0);
    gameStartAtRef.current = Date.now();
    setGameState('playing');
    beginRound(0);
  }, [setRounds, setRoundIndex, setGameState, beginRound]);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (gameState !== 'playing') return;
      completeRound(direction);
    },
    [gameState, completeRound]
  );

  const handleTimeout = useCallback(() => {
    if (gameState !== 'playing') return;
    completeRound('timeout');
  }, [gameState, completeRound]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    currentRound,
    roundIndex,
    totalRounds: TOTAL_ROUNDS,
    timeRemaining,
    gameState,
    startGame,
    handleSwipe,
    handleTimeout,
    recordPoint: tracker.recordPoint,
  };
}
