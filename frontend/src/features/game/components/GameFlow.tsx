'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SwipeCard from './SwipeCard';
import CountdownBar from './CountdownBar';
import RoundIndicator from './RoundIndicator';
import { useMouseTracker } from '../hooks/useMouseTracker';
import { ROUNDS } from '../data/rounds';
import { submitGameData } from '@/lib/db';
import type { SwipeMetrics, MouseGameData } from '../types';

type GamePhase = 'intro' | 'playing' | 'submitting';

export default function GameFlow({ userId }: { userId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allMetrics = useRef<SwipeMetrics[]>([]);
  const gameStart = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tracker = useMouseTracker();

  const round = ROUNDS[currentRound];

  // ---- タイマー管理 ----
  useEffect(() => {
    if (phase !== 'playing' || !timerRunning || !round) return;

    timerRef.current = setTimeout(() => {
      handleSwipe('timeout');
    }, round.timeLimitSec * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, timerRunning, phase]);

  // ---- ゲーム開始 ----
  const startGame = useCallback(() => {
    gameStart.current = performance.now();
    setPhase('playing');
    setCurrentRound(0);
    tracker.startRound();
    setTimerRunning(true);
  }, [tracker]);

  // ---- スワイプ / タイムアウト処理 ----
  const handleSwipe = useCallback(
    (direction: 'right' | 'left' | 'timeout') => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimerRunning(false);

      const metrics = tracker.finishRound(
        round.index,
        round.phase,
        round.category,
        direction,
      );
      allMetrics.current.push(metrics);

      const nextRound = currentRound + 1;
      if (nextRound >= ROUNDS.length) {
        submitResults();
      } else {
        setCurrentRound(nextRound);
        tracker.startRound();
        setTimerRunning(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRound, round, tracker],
  );

  // ---- 結果送信 ----
  const submitResults = useCallback(async () => {
    setPhase('submitting');
    const gameData: MouseGameData = {
      totalDuration: performance.now() - gameStart.current,
      rounds: allMetrics.current,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    };
    try {
      await submitGameData(userId, gameData);
      router.push('/result');
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信に失敗しました');
    }
  }, [userId, router]);

  // ---- Intro 画面 ----
  if (phase === 'intro') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-8 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 px-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="mb-3 text-3xl font-bold">直感スワイプ</h1>
          <p className="mb-1 text-white/70">画像を見て直感で判断してね</p>
          <p className="text-sm text-white/50">
            右スワイプ = 好き / 左スワイプ = スルー
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-12 text-5xl"
        >
          <span>👈</span>
          <span>👉</span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          onClick={startGame}
          className="rounded-full bg-white px-10 py-4 text-lg font-bold text-indigo-900 shadow-lg transition hover:scale-105 active:scale-95"
        >
          スタート
        </motion.button>
      </div>
    );
  }

  // ---- Submitting 画面 ----
  if (phase === 'submitting') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        {error ? (
          <>
            <p className="text-red-300">{error}</p>
            <button
              onClick={submitResults}
              className="rounded-lg bg-white/20 px-6 py-2"
            >
              リトライ
            </button>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="h-10 w-10 rounded-full border-4 border-white/30 border-t-white"
            />
            <p className="text-white/70">分析中...</p>
          </>
        )}
      </div>
    );
  }

  // ---- Playing 画面 ----
  return (
    <div className="flex h-dvh flex-col bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* ヘッダー */}
      <div className="flex flex-col items-center gap-3 px-6 pt-6">
        <RoundIndicator current={currentRound} total={ROUNDS.length} />
        <CountdownBar
          durationSec={round.timeLimitSec}
          running={timerRunning}
          key={currentRound}
        />
        {round.phase === 3 && (
          <span className="text-xs font-medium text-yellow-300">PRESSURE ROUND</span>
        )}
      </div>

      {/* カードエリア */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-4">
        <div className="relative aspect-[3/4] w-full max-w-[400px]">
          <AnimatePresence mode="popLayout">
            <SwipeCard
              key={currentRound}
              imageUrl={round.imageUrl}
              imageAlt={round.imageAlt}
              onSwipe={handleSwipe}
              onPointerMove={tracker.recordPointer}
              active
            />
          </AnimatePresence>
        </div>
      </div>

      {/* フッターヒント */}
      <div className="flex items-center justify-between px-12 pb-8 text-white/50">
        <span className="text-sm">← スルー</span>
        <span className="text-xs">{currentRound + 1} / {ROUNDS.length}</span>
        <span className="text-sm">好き →</span>
      </div>
    </div>
  );
}
