import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  calculateScores,
  aggregateMetrics,
  normalizeToScore,
  generateFeedback,
  getMbtiScores,
  buildPhaseSummaries,
} from '@/lib/analysis';
import {
  getAnalysisResult,
  saveAnalysisResult,
} from '@/lib/db';
import type { SwipeRoundData } from '@/features/game/types';
import type {
  DiagnosisScores,
  ResultResponse,
  GameBreakdown,
  ResultDetails,
  MetricCategory,
} from '@/features/result/types';

interface UserRow {
  readonly id: string;
  readonly self_mbti: string | null;
  readonly baseline_caution: number;
  readonly baseline_calmness: number;
  readonly baseline_logic: number;
  readonly baseline_coop: number;
  readonly baseline_positive: number;
}

interface GameLogRow {
  readonly raw_data: Record<string, unknown>;
}

function buildGameDetail(rounds: readonly SwipeRoundData[]) {
  const metrics = aggregateMetrics(rounds);

  return {
    title: '画像スワイプゲーム',
    feature_scores: [
      { axis: 'caution', name: '慎重さ', score: normalizeToScore(metrics.avgTimeToFirstMove, 200, 4000) },
      { axis: 'calmness', name: '冷静さ', score: normalizeToScore(metrics.avgMovementSmoothness * 100, 0, 100) },
      { axis: 'logic', name: '論理性', score: normalizeToScore(1 - metrics.avgReversalCount / 5, 0, 1) },
      { axis: 'cooperativeness', name: '協調性', score: 50 },
      { axis: 'positivity', name: '積極性', score: normalizeToScore(metrics.avgSwipeVelocity, 0.1, 1.5) },
    ],
    metrics: [
      { label: '初動時間', user: Math.round(metrics.avgTimeToFirstMove), average: 1500, category: 'timing' as MetricCategory },
      { label: 'スワイプ速度', user: Math.round(metrics.avgSwipeVelocity * 100) / 100, average: 0.6, category: 'velocity' as MetricCategory },
      { label: '最大偏差', user: Math.round(metrics.avgMaxDeviation), average: 80, category: 'deviation' as MetricCategory },
      { label: '方向転換数', user: Math.round(metrics.avgReversalCount * 10) / 10, average: 1.5, category: 'decision' as MetricCategory },
      { label: '軌跡の滑らかさ', user: Math.round(metrics.avgMovementSmoothness * 100) / 100, average: 0.6, category: 'trajectory' as MetricCategory },
    ],
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    // 1. Check cache
    const cached = await getAnalysisResult(userId);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 2. Get user from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, self_mbti, baseline_caution, baseline_calmness, baseline_logic, baseline_coop, baseline_positive')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const typedUser = user as UserRow;

    // 3. Get game log
    const { data: gameLog, error: gameLogError } = await supabase
      .from('game_logs')
      .select('raw_data')
      .eq('user_id', userId)
      .eq('game_type', 1)
      .single();

    if (gameLogError || !gameLog) {
      return NextResponse.json(
        { error: 'Game data not found. Please complete the game first.' },
        { status: 404 }
      );
    }

    const typedGameLog = gameLog as GameLogRow;
    const rounds = (typedGameLog.raw_data as { rounds?: SwipeRoundData[] }).rounds ?? [];

    // 4. Calculate scores from game data
    const scores: DiagnosisScores = calculateScores(rounds);

    // 5. Get baseline scores from user record
    const baselineScores: DiagnosisScores = {
      caution: typedUser.baseline_caution,
      calmness: typedUser.baseline_calmness,
      logic: typedUser.baseline_logic,
      cooperativeness: typedUser.baseline_coop,
      positivity: typedUser.baseline_positive,
    };

    // 6. Calculate gaps (game scores - baseline)
    const gaps: DiagnosisScores = {
      caution: scores.caution - baselineScores.caution,
      calmness: scores.calmness - baselineScores.calmness,
      logic: scores.logic - baselineScores.logic,
      cooperativeness: scores.cooperativeness - baselineScores.cooperativeness,
      positivity: scores.positivity - baselineScores.positivity,
    };

    // 7. Get MBTI theoretical scores
    const mbtiScores = typedUser.self_mbti
      ? getMbtiScores(typedUser.self_mbti)
      : null;

    // 8. Generate feedback
    const feedback = generateFeedback(scores, {
      caution: gaps.caution,
      calmness: gaps.calmness,
      logic: gaps.logic,
      cooperativeness: gaps.cooperativeness,
      positivity: gaps.positivity,
    });

    // 9. Build phase summaries
    const phaseSummaries = buildPhaseSummaries(rounds);

    // 10. Calculate accuracy score
    const gapValues = Object.values(gaps).map(Math.abs);
    const avgGap = gapValues.reduce((sum, v) => sum + v, 0) / gapValues.length;
    const accuracyScore = Math.max(0, Math.round(100 - avgGap));

    // 11. Build game breakdown
    const gameBreakdown: GameBreakdown = {
      swipe_game: {
        caution: scores.caution,
        calmness: scores.calmness,
        logic: scores.logic,
        cooperativeness: scores.cooperativeness,
        positivity: scores.positivity,
      },
    };

    // 12. Build details
    const details: ResultDetails = {
      swipe_game: buildGameDetail(rounds),
    };

    // 13. Build full response
    const mbtiDiagnosisScores: DiagnosisScores | null = mbtiScores
      ? {
          caution: mbtiScores.caution,
          calmness: mbtiScores.calmness,
          logic: mbtiScores.logic,
          cooperativeness: mbtiScores.cooperativeness,
          positivity: mbtiScores.positivity,
        }
      : null;

    const result: ResultResponse = {
      user_id: userId,
      self_mbti: typedUser.self_mbti,
      mbti_scores: mbtiDiagnosisScores,
      scores,
      baseline_scores: baselineScores,
      gaps,
      game_breakdown: gameBreakdown,
      feedback,
      accuracy_score: accuracyScore,
      phase_summaries: phaseSummaries,
      details,
    };

    // 14. Cache result
    await saveAnalysisResult(userId, result);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
