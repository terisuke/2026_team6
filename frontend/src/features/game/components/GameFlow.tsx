'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useSwipeGame } from '../hooks/useSwipeGame';
import {
  gameFlowAtom,
  currentRoundAtom,
  roundDataAtom,
  gameDataAtom,
} from '@/stores/game';
import { CardStack } from './CardStack';
import { CountdownBar } from './CountdownBar';
import { RoundIndicator } from './RoundIndicator';
import { ROUNDS } from '../data/rounds';

// ========================================
// Sub-components
// ========================================

function GameIntro({ onStart }: { readonly onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
      <h1 className="text-2xl font-bold text-center">
        画像えらびゲーム
      </h1>
      <div className="max-w-md text-center space-y-4">
        <p className="text-gray-600">
          2枚の画像が表示されます。
          <br />
          直感で好きな方をスワイプしてください。
        </p>
        <p className="text-sm text-gray-400">
          全10ラウンド・制限時間あり
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
        はじめる
      </button>
    </div>
  );
}

function GameSubmitting() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600">分析中...</p>
    </div>
  );
}

function GameComplete() {
  const router = useRouter();

  useEffect(() => {
    router.push('/result');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">結果画面へ移動中...</p>
    </div>
  );
}

// ========================================
// Main orchestrator
// ========================================

export function GameFlow() {
  const {
    currentRound,
    roundIndex,
    totalRounds,
    timeRemaining,
    gameState,
    startGame,
    handleSwipe,
    recordPoint,
  } = useSwipeGame();

  const setGameState = useSetAtom(gameFlowAtom);
  const setRoundIndex = useSetAtom(currentRoundAtom);
  const setRounds = useSetAtom(roundDataAtom);
  const setGameData = useSetAtom(gameDataAtom);

  useEffect(() => {
    setGameState('intro');
    setRoundIndex(0);
    setRounds([]);
    setGameData(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragMove = useCallback(
    (x: number, y: number) => {
      recordPoint(x, y);
    },
    [recordPoint],
  );

  const nextRound = ROUNDS[roundIndex + 1];

  switch (gameState) {
    case 'intro':
      return <GameIntro onStart={startGame} />;
    case 'playing':
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <div className="flex w-full max-w-[480px] items-center justify-between">
            <RoundIndicator
              currentRound={currentRound.roundNumber}
              totalRounds={totalRounds}
              phase={currentRound.phase}
            />
            <span className="text-sm font-medium text-slate-500">
              {timeRemaining.toFixed(1)}s
            </span>
          </div>
          <div className="w-full max-w-[480px]">
            <CountdownBar
              timeRemaining={timeRemaining}
              totalTime={currentRound.timeLimit}
            />
          </div>
          <CardStack
            currentRound={currentRound}
            nextRound={nextRound}
            onSwipe={handleSwipe}
            onDragMove={onDragMove}
          />
        </div>
      );
    case 'submitting':
      return <GameSubmitting />;
    case 'done':
      return <GameComplete />;
  }
}
