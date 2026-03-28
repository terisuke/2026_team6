import { supabase } from './supabase';
import type {
  AnswerOption,
  BaselineAnswers,
} from '@/features/diagnosis/types';
import type { SwipeGameData } from '@/features/game/types';
import type {
  DiagnosisScores,
  ResultResponse,
  GameBreakdown,
  PhaseSummaries,
  ResultDetails,
  DiagnosisFeedback,
} from '@/features/result/types';

// ========================================
// Score conversion (mirrors backend registerService)
// ========================================

const SCORE_MAP: Readonly<Record<AnswerOption, number>> = {
  A: 25,
  B: 45,
  C: 65,
  D: 85,
};

function convertAnswerToScore(answer: AnswerOption): number {
  return SCORE_MAP[answer] ?? 50;
}

// ========================================
// GameLog DB type
// ========================================

interface GameLogRow {
  readonly id: number;
  readonly user_id: string;
  readonly game_type: number;
  readonly raw_data: Record<string, unknown>;
  readonly played_at: string;
}

// ========================================
// AnalysisResult DB type
// ========================================

interface AnalysisResultRow {
  readonly user_id: string;
  readonly self_mbti: string | null;
  readonly score_caution: number;
  readonly score_calmness: number;
  readonly score_logic: number;
  readonly score_coop: number;
  readonly score_positive: number;
  readonly baseline_caution: number;
  readonly baseline_calmness: number;
  readonly baseline_logic: number;
  readonly baseline_coop: number;
  readonly baseline_positive: number;
  readonly mbti_caution: number | null;
  readonly mbti_calmness: number | null;
  readonly mbti_logic: number | null;
  readonly mbti_coop: number | null;
  readonly mbti_positive: number | null;
  readonly gap_caution: number;
  readonly gap_calmness: number;
  readonly gap_logic: number;
  readonly gap_coop: number;
  readonly gap_positive: number;
  readonly feedback_title: string;
  readonly feedback_description: string;
  readonly feedback_gap_point: string;
  readonly game_contributions: GameBreakdown;
  readonly accuracy_score: number;
  readonly phase_summaries: PhaseSummaries;
  readonly details: ResultDetails;
  readonly created_at?: string;
}

// ========================================
// DB Operations
// ========================================

/**
 * Register a new user with MBTI and baseline answers.
 * Converts answers to scores and inserts into the users table.
 * Returns the new user_id (UUID).
 */
export async function registerUser(
  mbti: string | null,
  baselineAnswers: BaselineAnswers
): Promise<string> {
  const userId = crypto.randomUUID();

  const { error } = await supabase.from('users').insert({
    id: userId,
    self_mbti: mbti,
    baseline_caution: convertAnswerToScore(baselineAnswers.q1_caution),
    baseline_calmness: 50,
    baseline_logic: 50,
    baseline_coop: convertAnswerToScore(baselineAnswers.q2_cooperativeness),
    baseline_positive: convertAnswerToScore(baselineAnswers.q3_positivity),
  });

  if (error) {
    throw new Error(`Failed to register user: ${error.message}`);
  }

  return userId;
}

/**
 * Submit game data (UPSERT by user_id + game_type).
 * game_type is always 1 for the swipe game.
 */
export async function submitGameData(
  userId: string,
  gameType: number,
  data: SwipeGameData
): Promise<void> {
  const { error } = await supabase.from('game_logs').upsert(
    {
      user_id: userId,
      game_type: gameType,
      raw_data: data as unknown as Record<string, unknown>,
    },
    { onConflict: 'user_id,game_type' }
  );

  if (error) {
    throw new Error(`Failed to submit game data: ${error.message}`);
  }
}

/**
 * Get a game log by user_id and game_type.
 * Returns null if not found.
 */
export async function getGameLog(
  userId: string,
  gameType: number
): Promise<GameLogRow | null> {
  const { data, error } = await supabase
    .from('game_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('game_type', gameType)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) {
    throw new Error(`Failed to get game log: ${error.message}`);
  }

  return data;
}

/**
 * Save analysis result (UPSERT by user_id).
 */
export async function saveAnalysisResult(
  userId: string,
  result: ResultResponse
): Promise<void> {
  const row: Omit<AnalysisResultRow, 'created_at'> = {
    user_id: userId,
    self_mbti: result.self_mbti,
    score_caution: result.scores.caution,
    score_calmness: result.scores.calmness,
    score_logic: result.scores.logic,
    score_coop: result.scores.cooperativeness,
    score_positive: result.scores.positivity,
    baseline_caution: result.baseline_scores.caution,
    baseline_calmness: result.baseline_scores.calmness,
    baseline_logic: result.baseline_scores.logic,
    baseline_coop: result.baseline_scores.cooperativeness,
    baseline_positive: result.baseline_scores.positivity,
    mbti_caution: result.mbti_scores?.caution ?? null,
    mbti_calmness: result.mbti_scores?.calmness ?? null,
    mbti_logic: result.mbti_scores?.logic ?? null,
    mbti_coop: result.mbti_scores?.cooperativeness ?? null,
    mbti_positive: result.mbti_scores?.positivity ?? null,
    gap_caution: result.gaps.caution,
    gap_calmness: result.gaps.calmness,
    gap_logic: result.gaps.logic,
    gap_coop: result.gaps.cooperativeness,
    gap_positive: result.gaps.positivity,
    feedback_title: result.feedback.title,
    feedback_description: result.feedback.description,
    feedback_gap_point: result.feedback.gap_point,
    game_contributions: result.game_breakdown,
    accuracy_score: result.accuracy_score,
    phase_summaries: result.phase_summaries,
    details: result.details,
  };

  const { error } = await supabase
    .from('analysis_results')
    .upsert(row, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Failed to save analysis result: ${error.message}`);
  }
}

/**
 * Get cached analysis result by user_id.
 * Returns null if not found.
 */
export async function getAnalysisResult(
  userId: string
): Promise<ResultResponse | null> {
  const { data, error } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) {
    throw new Error(`Failed to get analysis result: ${error.message}`);
  }

  const row = data as AnalysisResultRow;

  const scores: DiagnosisScores = {
    caution: row.score_caution,
    calmness: row.score_calmness,
    logic: row.score_logic,
    cooperativeness: row.score_coop,
    positivity: row.score_positive,
  };

  const baselineScores: DiagnosisScores = {
    caution: row.baseline_caution,
    calmness: row.baseline_calmness,
    logic: row.baseline_logic,
    cooperativeness: row.baseline_coop,
    positivity: row.baseline_positive,
  };

  const mbtiScores: DiagnosisScores | null =
    row.mbti_caution !== null
      ? {
          caution: row.mbti_caution!,
          calmness: row.mbti_calmness!,
          logic: row.mbti_logic!,
          cooperativeness: row.mbti_coop!,
          positivity: row.mbti_positive!,
        }
      : null;

  const gaps: DiagnosisScores = {
    caution: row.gap_caution,
    calmness: row.gap_calmness,
    logic: row.gap_logic,
    cooperativeness: row.gap_coop,
    positivity: row.gap_positive,
  };

  const feedback: DiagnosisFeedback = {
    title: row.feedback_title,
    description: row.feedback_description,
    gap_point: row.feedback_gap_point,
  };

  return {
    user_id: row.user_id,
    self_mbti: row.self_mbti,
    mbti_scores: mbtiScores,
    scores,
    baseline_scores: baselineScores,
    gaps,
    game_breakdown: row.game_contributions,
    feedback,
    accuracy_score: row.accuracy_score,
    phase_summaries: row.phase_summaries,
    details: row.details,
  };
}
