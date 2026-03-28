import type { BaselineScores } from '@/features/game/types';

const MBTI_SCORE_TABLE: Record<string, BaselineScores> = {
  INTJ: { caution: 80, calmness: 85, logic: 95, cooperativeness: 30, positivity: 25 },
  INTP: { caution: 60, calmness: 80, logic: 90, cooperativeness: 25, positivity: 20 },
  ENTJ: { caution: 55, calmness: 75, logic: 90, cooperativeness: 45, positivity: 90 },
  ENTP: { caution: 30, calmness: 60, logic: 80, cooperativeness: 30, positivity: 85 },
  INFJ: { caution: 75, calmness: 70, logic: 50, cooperativeness: 80, positivity: 30 },
  INFP: { caution: 65, calmness: 55, logic: 40, cooperativeness: 75, positivity: 20 },
  ENFJ: { caution: 50, calmness: 65, logic: 45, cooperativeness: 90, positivity: 85 },
  ENFP: { caution: 25, calmness: 45, logic: 35, cooperativeness: 70, positivity: 90 },
  ISTJ: { caution: 95, calmness: 85, logic: 80, cooperativeness: 60, positivity: 20 },
  ISFJ: { caution: 90, calmness: 75, logic: 45, cooperativeness: 85, positivity: 25 },
  ESTJ: { caution: 70, calmness: 70, logic: 75, cooperativeness: 55, positivity: 80 },
  ESFJ: { caution: 65, calmness: 55, logic: 40, cooperativeness: 90, positivity: 80 },
  ISTP: { caution: 50, calmness: 90, logic: 75, cooperativeness: 20, positivity: 30 },
  ISFP: { caution: 55, calmness: 60, logic: 30, cooperativeness: 65, positivity: 25 },
  ESTP: { caution: 15, calmness: 55, logic: 60, cooperativeness: 25, positivity: 95 },
  ESFP: { caution: 10, calmness: 40, logic: 25, cooperativeness: 60, positivity: 95 },
};

export function getMbtiScores(mbti: string): BaselineScores | null {
  return MBTI_SCORE_TABLE[mbti.toUpperCase().trim()] ?? null;
}
