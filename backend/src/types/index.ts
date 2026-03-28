// ========================================
// API Request/Response types
// ========================================

export interface BaselineScores {
  caution: number; // 0-100
  calmness: number;
  logic: number;
  cooperativeness: number;
  positivity: number;
}

export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface BaselineAnswers {
  q1_caution: AnswerOption;
  q2_cooperativeness: AnswerOption;
  q3_positivity: AnswerOption;
}

export interface RegisterRequest {
  mbti?: string | null; // optional
  baseline_answers: BaselineAnswers; // required
}

export interface RegisterResponse {
  user_id: string; // UUID
  status: "success";
}

export type GameType = 1;

export interface SubmitGameRequest {
  user_id: string;
  game_type: GameType;
  data: Record<string, unknown>;
}

export interface SubmitGameResponse {
  status: "success" | "error";
  message: string;
}

export interface DiagnosisFeedback {
  title: string;
  description: string;
  gap_point: string;
}

export interface GameBreakdown {
  swipe_game?: Partial<BaselineScores>;
}

export interface PhaseSummaries {
  warmup: string;
  main: string;
  pressure: string;
}

export interface ResultResponse {
  user_id: string;
  self_mbti: string | null;
  mbti_scores: BaselineScores | null;
  scores: BaselineScores;
  baseline_scores: BaselineScores;
  gaps: BaselineScores;
  game_breakdown: GameBreakdown;
  feedback: DiagnosisFeedback;
  accuracy_score: number;
  phase_summaries: PhaseSummaries;
  details: Record<string, unknown>;
}

export interface ApiError {
  status: "error";
  error: string;
  message: string;
}

// ========================================
// DB types
// ========================================

export interface User {
  id: string;
  self_mbti: string | null;
  baseline_caution: number;
  baseline_calmness: number;
  baseline_logic: number;
  baseline_coop: number;
  baseline_positive: number;
  created_at: string;
}

export interface GameLog {
  id: number;
  user_id: string;
  game_type: number;
  raw_data: Record<string, unknown>;
  played_at: string;
}

// ========================================
// Constants
// ========================================

export const GAME_TYPES = {
  SWIPE_GAME: 1,
} as const;

export const SCORE_KEYS = {
  CAUTION: 'caution',
  CALMNESS: 'calmness',
  LOGIC: 'logic',
  COOPERATIVENESS: 'cooperativeness',
  POSITIVITY: 'positivity',
} as const;

export type ScoreKey = typeof SCORE_KEYS[keyof typeof SCORE_KEYS];
