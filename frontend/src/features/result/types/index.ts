// ========================================
// 5-axis scores (DiagnosisScores)
// ========================================

export interface DiagnosisScores {
  caution: number;
  calmness: number;
  logic: number;
  cooperativeness: number;
  positivity: number;
}

// ========================================
// Diagnosis feedback (DiagnosisFeedback)
// ========================================

export interface DiagnosisFeedback {
  title: string;
  description: string;
  gap_point: string;
}

// ========================================
// Detail screen: feature scores & metrics
// ========================================

export interface FeatureScore {
  axis: string;
  name: string;
  score: number;
}

export type MetricCategory =
  | 'trajectory'
  | 'timing'
  | 'velocity'
  | 'deviation'
  | 'decision';

export interface Metric {
  label: string;
  user: number;
  average: number;
  category: MetricCategory;
}

export interface GameDetail {
  title: string;
  feature_scores: FeatureScore[];
  metrics: Metric[];
}

// ========================================
// Phase summaries (warmup / main / pressure)
// ========================================

export interface PhaseSummaries {
  warmup: string;
  main: string;
  pressure: string;
}

// ========================================
// Game breakdown (single swipe game)
// ========================================

export interface GameBreakdown {
  swipe_game: Partial<DiagnosisScores>;
}

// ========================================
// Result details (single game)
// ========================================

export interface ResultDetails {
  swipe_game: GameDetail;
}

// ========================================
// Result response (ResultResponse)
// ========================================

export interface ResultResponse {
  user_id: string;
  self_mbti: string | null;
  mbti_scores: DiagnosisScores | null;
  scores: DiagnosisScores;
  baseline_scores: DiagnosisScores;
  gaps: DiagnosisScores;
  game_breakdown: GameBreakdown;
  feedback: DiagnosisFeedback;
  accuracy_score: number;
  phase_summaries: PhaseSummaries;
  details: ResultDetails;
}
