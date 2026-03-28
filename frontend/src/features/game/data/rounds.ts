import type { RoundConfig } from '../types';

/**
 * 10ラウンドの定義。
 * imageUrl はプレースホルダー。実画像を `/public/images/game/` に配置して差し替える。
 */
export const ROUNDS: RoundConfig[] = [
  // ---- Phase 1: ウォームアップ（ベースライン取得） ----
  {
    index: 0,
    phase: 1,
    imageUrl: '/images/game/r1_landscape_a.webp',
    imageAlt: '穏やかな湖畔の風景',
    category: 'neutral',
    timeLimitSec: 8,
  },
  {
    index: 1,
    phase: 1,
    imageUrl: '/images/game/r2_abstract_a.webp',
    imageAlt: 'カラフルな抽象アート',
    category: 'neutral',
    timeLimitSec: 8,
  },
  {
    index: 2,
    phase: 1,
    imageUrl: '/images/game/r3_landscape_b.webp',
    imageAlt: '都会の夜景',
    category: 'neutral',
    timeLimitSec: 8,
  },

  // ---- Phase 2: 本番（性格特性測定） ----
  {
    index: 3,
    phase: 2,
    imageUrl: '/images/game/r4_group_activity.webp',
    imageAlt: '友達とバーベキューを楽しむ場面',
    category: 'social',
    timeLimitSec: 10,
  },
  {
    index: 4,
    phase: 2,
    imageUrl: '/images/game/r5_calm_scene.webp',
    imageAlt: '静かな読書タイム',
    category: 'calm_vs_exciting',
    timeLimitSec: 10,
  },
  {
    index: 5,
    phase: 2,
    imageUrl: '/images/game/r6_organized.webp',
    imageAlt: '整理された美しいデスク',
    category: 'structured_vs_free',
    timeLimitSec: 10,
  },
  {
    index: 6,
    phase: 2,
    imageUrl: '/images/game/r7_helping.webp',
    imageAlt: '困っている人を助ける場面',
    category: 'helping',
    timeLimitSec: 10,
  },
  {
    index: 7,
    phase: 2,
    imageUrl: '/images/game/r8_adventure.webp',
    imageAlt: '崖からのバンジージャンプ',
    category: 'risk',
    timeLimitSec: 10,
  },

  // ---- Phase 3: プレッシャー（時間圧力下） ----
  {
    index: 8,
    phase: 3,
    imageUrl: '/images/game/r9_mixed_a.webp',
    imageAlt: '賑やかなフェスティバル',
    category: 'mixed',
    timeLimitSec: 5,
  },
  {
    index: 9,
    phase: 3,
    imageUrl: '/images/game/r10_mixed_b.webp',
    imageAlt: '一人旅の美しい朝焼け',
    category: 'mixed',
    timeLimitSec: 5,
  },
];
