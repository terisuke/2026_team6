// ---- 5軸スコア（共通） ----

export interface BaselineScores {
  caution: number;
  calmness: number;
  logic: number;
  cooperativeness: number;
  positivity: number;
}

// ---- マウス / スワイプ計測 ----

export interface PointerSample {
  x: number;
  y: number;
  t: number; // ms (performance.now 基準)
}

export interface SwipeMetrics {
  roundIndex: number;
  phase: 1 | 2 | 3;
  imageCategory: string;
  swipeDirection: 'right' | 'left' | 'timeout';
  timeToFirstMove: number;
  totalSwipeTime: number;
  swipeVelocity: number;
  maxDeviation: number;
  trajectoryAUC: number;
  jitterCount: number;
  reversalCount: number;
  peakVelocity: number;
  velocityVariance: number;
  movementSmoothness: number;
  hoverDuration: number;
}

export interface MouseGameData {
  totalDuration: number;
  rounds: SwipeMetrics[];
  screenWidth: number;
  screenHeight: number;
}

// ---- ラウンド定義 ----

export interface RoundConfig {
  index: number;
  phase: 1 | 2 | 3;
  imageUrl: string;
  imageAlt: string;
  category: string;       // 'neutral', 'social', 'calm_vs_exciting', etc.
  timeLimitSec: number;
}

// ---- 分析結果 (DB保存用) ----

export interface AnalysisResult {
  user_id: string;
  score_caution: number;
  score_calmness: number;
  score_logic: number;
  score_coop: number;
  score_positive: number;
  mbti_caution: number | null;
  mbti_calmness: number | null;
  mbti_logic: number | null;
  mbti_coop: number | null;
  mbti_positive: number | null;
  gap_caution: number;
  gap_calmness: number;
  gap_logic: number;
  gap_coop: number;
  gap_positive: number;
  feedback_title: string;
  feedback_description: string;
  feedback_gap_point: string;
  accuracy_score: number;
  phase_summaries: { phase_1: string };
  game_contributions: { game_1: BaselineScores };
}

// ---- フロントエンド表示用 ----

export interface ResultResponse {
  userId: string;
  selfMbti: string | null;
  scores: BaselineScores;
  baseline: BaselineScores;
  mbtiScores: BaselineScores | null;
  gaps: BaselineScores;
  feedback: { title: string; description: string; gapPoint: string };
  accuracyScore: number;
  phaseSummary: string;
  details: {
    featureScores: { axis: string; score: number }[];
    metrics: { label: string; value: number; average: number }[];
  };
}
