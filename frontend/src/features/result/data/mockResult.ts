import type { ResultResponse } from '../types';

/**
 * @deprecated 現在未使用。useResult.ts は実APIに切り替え済み。
 * ローカル開発・テスト時のリファレンスとして残している。
 */
export const MOCK_RESULT: ResultResponse = {
  user_id: 'uuid-1234-5678',
  self_mbti: 'ENTP',
  mbti_scores: {
    caution: 30,
    calmness: 60,
    logic: 80,
    cooperativeness: 40,
    positivity: 90,
  },
  scores: {
    caution: 20,
    calmness: 80,
    logic: 60,
    cooperativeness: 10,
    positivity: 90,
  },
  baseline_scores: {
    caution: 100,
    calmness: 50,
    logic: 80,
    cooperativeness: 30,
    positivity: 70,
  },
  gaps: {
    caution: -80,
    calmness: 30,
    logic: -20,
    cooperativeness: -20,
    positivity: 20,
  },
  game_breakdown: {
    swipe_game: {
      caution: 20,
      logic: 60,
      calmness: 80,
      cooperativeness: 10,
      positivity: 90,
    },
  },
  feedback: {
    title: '暴走する機関車',
    description:
      'あなたは自称リーダーですが、協調性が皆無です。規約は読まない！ AIには即ギレ！ でも窮地での「冷静さ」はスーパーヒーロー級です！',
    gap_point: '慎重さ',
  },
  accuracy_score: 50,
  phase_summaries: {
    warmup: '画像を素早く確認し、直感的に選択を行いました',
    main: '一貫した選択パターンで、迷いなくスワイプしました',
    pressure: '時間制限下でも冷静さを保ち、判断速度を維持しました',
  },
  details: {
    swipe_game: {
      title: '画像スワイプゲーム',
      feature_scores: [
        { axis: 'caution', name: '慎重さ', score: 20 },
        { axis: 'logic', name: '論理性', score: 60 },
        { axis: 'calmness', name: '冷静さ', score: 80 },
        { axis: 'cooperativeness', name: '協調性', score: 10 },
        { axis: 'positivity', name: '積極性', score: 90 },
      ],
      metrics: [
        {
          label: 'スワイプ速度(px/s)',
          user: 1200,
          average: 800,
          category: 'velocity',
        },
        {
          label: '迷い時間(ms)',
          user: 350,
          average: 1200,
          category: 'timing',
        },
        {
          label: 'マウス軌跡長(px)',
          user: 450,
          average: 280,
          category: 'trajectory',
        },
        {
          label: '軌跡のブレ(px)',
          user: 45.5,
          average: 12.0,
          category: 'deviation',
        },
        {
          label: '右スワイプ率(%)',
          user: 72,
          average: 55,
          category: 'decision',
        },
        {
          label: '判断変更(回)',
          user: 2,
          average: 4.5,
          category: 'decision',
        },
        {
          label: '平均反応時間(ms)',
          user: 680,
          average: 1100,
          category: 'timing',
        },
      ],
    },
  },
};
