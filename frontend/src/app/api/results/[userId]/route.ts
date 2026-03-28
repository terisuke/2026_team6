import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateScores } from '@/lib/analysis/scoring';
import { generateFeedback } from '@/lib/analysis/feedback';
import { getMbtiScores } from '@/lib/analysis/mbtiScoreTable';
import { buildSwipeSummary } from '@/lib/analysis/summary';
import type { BaselineScores, MouseGameData, SwipeMetrics } from '@/features/game/types';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder',
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const supabase = getSupabase();

  try {
    // 1. キャッシュ確認
    const { data: cached } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (cached) {
      return NextResponse.json(formatResponse(cached, userId));
    }

    // 2. ユーザー取得
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (userErr || !user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 3. ゲームログ取得
    const { data: gameLog, error: gameErr } = await supabase
      .from('game_logs')
      .select('raw_data')
      .eq('user_id', userId)
      .eq('game_type', 1)
      .single();
    if (gameErr || !gameLog) {
      return NextResponse.json({ error: 'ゲームデータが見つかりません' }, { status: 404 });
    }

    const gameData = gameLog.raw_data as MouseGameData;
    const rounds = gameData.rounds as SwipeMetrics[];

    // 4. スコア計算
    const scores = calculateScores(rounds);

    // 5. ベースライン
    const baseline: BaselineScores = {
      caution: user.baseline_caution,
      calmness: user.baseline_calmness,
      logic: user.baseline_logic,
      cooperativeness: user.baseline_coop,
      positivity: user.baseline_positive,
    };

    // 6. MBTIブレンド
    let blended = { ...baseline };
    let mbtiScores: BaselineScores | null = null;
    if (user.self_mbti) {
      mbtiScores = getMbtiScores(user.self_mbti);
      if (mbtiScores) {
        blended = {
          caution: Math.round(baseline.caution * 0.7 + mbtiScores.caution * 0.3),
          calmness: Math.round(baseline.calmness * 0.7 + mbtiScores.calmness * 0.3),
          logic: Math.round(baseline.logic * 0.7 + mbtiScores.logic * 0.3),
          cooperativeness: Math.round(baseline.cooperativeness * 0.7 + mbtiScores.cooperativeness * 0.3),
          positivity: Math.round(baseline.positivity * 0.7 + mbtiScores.positivity * 0.3),
        };
      }
    }

    // 7. ギャップ
    const gaps: BaselineScores = {
      caution: scores.caution - blended.caution,
      calmness: scores.calmness - blended.calmness,
      logic: scores.logic - blended.logic,
      cooperativeness: scores.cooperativeness - blended.cooperativeness,
      positivity: scores.positivity - blended.positivity,
    };

    const avgGap =
      (Math.abs(gaps.caution) +
        Math.abs(gaps.calmness) +
        Math.abs(gaps.logic) +
        Math.abs(gaps.cooperativeness) +
        Math.abs(gaps.positivity)) /
      5;
    const accuracyScore = Math.max(0, Math.round(100 - avgGap));

    // 8. フィードバック
    const feedback = generateFeedback(scores, gaps);

    // 9. サマリー
    const summary = buildSwipeSummary(rounds);

    // 10. DB保存
    const result = {
      user_id: userId,
      score_caution: scores.caution,
      score_calmness: scores.calmness,
      score_logic: scores.logic,
      score_coop: scores.cooperativeness,
      score_positive: scores.positivity,
      mbti_caution: mbtiScores?.caution ?? null,
      mbti_calmness: mbtiScores?.calmness ?? null,
      mbti_logic: mbtiScores?.logic ?? null,
      mbti_coop: mbtiScores?.cooperativeness ?? null,
      mbti_positive: mbtiScores?.positivity ?? null,
      gap_caution: gaps.caution,
      gap_calmness: gaps.calmness,
      gap_logic: gaps.logic,
      gap_coop: gaps.cooperativeness,
      gap_positive: gaps.positivity,
      feedback_title: feedback.title,
      feedback_description: feedback.description,
      feedback_gap_point: feedback.gapPoint,
      accuracy_score: accuracyScore,
      phase_summaries: { phase_1: summary },
      game_contributions: { game_1: scores },
    };

    await supabase.from('analysis_results').upsert(result, { onConflict: 'user_id' });

    return NextResponse.json(formatResponse(result, userId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : '分析に失敗しました';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function formatResponse(row: Record<string, unknown>, userId: string) {
  const scores = {
    caution: row.score_caution as number,
    calmness: row.score_calmness as number,
    logic: row.score_logic as number,
    cooperativeness: row.score_coop as number,
    positivity: row.score_positive as number,
  };

  return {
    userId,
    selfMbti: null,
    scores,
    baseline: scores, // 簡易版
    mbtiScores:
      row.mbti_caution != null
        ? {
            caution: row.mbti_caution,
            calmness: row.mbti_calmness,
            logic: row.mbti_logic,
            cooperativeness: row.mbti_coop,
            positivity: row.mbti_positive,
          }
        : null,
    gaps: {
      caution: row.gap_caution,
      calmness: row.gap_calmness,
      logic: row.gap_logic,
      cooperativeness: row.gap_coop,
      positivity: row.gap_positive,
    },
    feedback: {
      title: row.feedback_title,
      description: row.feedback_description,
      gapPoint: row.feedback_gap_point,
    },
    accuracyScore: row.accuracy_score,
    phaseSummary: (row.phase_summaries as Record<string, string>)?.phase_1 ?? '',
  };
}
