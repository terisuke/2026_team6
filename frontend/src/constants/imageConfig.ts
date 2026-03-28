/**
 * Image Insight ゲーム — 画像ペア定義
 *
 * 画像ソース: OASIS (Open Affective Standardized Image Set)
 * - Kurdi, Lozano & Banaji (2017). Introducing the Open Affective Standardized Image Set (OASIS).
 *   Behavior Research Methods, 49(2), 457–470.
 *
 * 各ペアの valence / arousal 値は OASIS rating CSV に基づく。
 * カテゴリ設計は Meidenbauer et al. (2023) の画像選択タスクを参考。
 */

// ---------- 型定義 ----------

export type ImageCategory =
  | "order_vs_freedom"
  | "calm_vs_lively"
  | "group_vs_individual"
  | "abstract_vs_concrete";

/** 各画像ペアが測定する Real You 5 軸 */
export type TraitAxis =
  | "caution"
  | "calmness"
  | "logic"
  | "cooperativeness"
  | "positivity";

export interface ImageSide {
  /** /images/game/ からの相対パス */
  src: string;
  /** 短い日本語ラベル（結果画面用） */
  label: string;
  /** OASIS valence mean (1‑7) */
  valence: number;
  /** OASIS arousal mean (1‑7) */
  arousal: number;
}

export interface ImagePair {
  pairIndex: number;
  category: ImageCategory;
  /** このペアが主に測定する軸 */
  targetAxes: TraitAxis[];
  left: ImageSide;
  right: ImageSide;
}

// ---------- ペア定義 ----------

export const IMAGE_PAIRS: ImagePair[] = [
  // ═══ 秩序 vs 自由 (Order vs Freedom) ═══
  // 測定軸: caution（慎重さ）, logic（論理性）
  {
    pairIndex: 1,
    category: "order_vs_freedom",
    targetAxes: ["caution", "logic"],
    left: {
      src: "/images/game/order_desk.webp",
      label: "整然としたデスク",
      valence: 4.04,
      arousal: 1.88,
    },
    right: {
      src: "/images/game/freedom_street.webp",
      label: "賑やかな街路",
      valence: 5.06,
      arousal: 3.31,
    },
  },
  {
    pairIndex: 2,
    category: "order_vs_freedom",
    targetAxes: ["caution", "logic"],
    left: {
      src: "/images/game/order_snow.webp",
      label: "静かな雪景色",
      valence: 4.82,
      arousal: 2.9,
    },
    right: {
      src: "/images/game/freedom_city.webp",
      label: "雑多な都市",
      valence: 4.44,
      arousal: 3.14,
    },
  },
  {
    pairIndex: 3,
    category: "order_vs_freedom",
    targetAxes: ["caution", "logic"],
    left: {
      src: "/images/game/order_candle.webp",
      label: "穏やかなキャンドル",
      valence: 5.05,
      arousal: 3.31,
    },
    right: {
      src: "/images/game/freedom_fireworks.webp",
      label: "華やかな花火",
      valence: 6.16,
      arousal: 4.42,
    },
  },
  {
    pairIndex: 4,
    category: "order_vs_freedom",
    targetAxes: ["caution", "logic"],
    left: {
      src: "/images/game/order_coffee.webp",
      label: "落ち着くコーヒー",
      valence: 5.55,
      arousal: 3.8,
    },
    right: {
      src: "/images/game/freedom_rollercoaster.webp",
      label: "スリルの絶叫マシン",
      valence: 5.45,
      arousal: 4.71,
    },
  },

  // ═══ 静寂 vs 活気 (Calm vs Lively) ═══
  // 測定軸: calmness（冷静さ）, positivity（積極性）
  {
    pairIndex: 5,
    category: "calm_vs_lively",
    targetAxes: ["calmness", "positivity"],
    left: {
      src: "/images/game/calm_lake.webp",
      label: "静かな湖",
      valence: 5.96,
      arousal: 3.22,
    },
    right: {
      src: "/images/game/lively_celebration.webp",
      label: "賑やかな祝祭",
      valence: 5.32,
      arousal: 3.8,
    },
  },
  {
    pairIndex: 6,
    category: "calm_vs_lively",
    targetAxes: ["calmness", "positivity"],
    left: {
      src: "/images/game/calm_sunset.webp",
      label: "穏やかな夕焼け",
      valence: 5.88,
      arousal: 3.54,
    },
    right: {
      src: "/images/game/lively_skydiving.webp",
      label: "大空のスカイダイビング",
      valence: 5.23,
      arousal: 4.68,
    },
  },
  {
    pairIndex: 7,
    category: "calm_vs_lively",
    targetAxes: ["calmness", "positivity"],
    left: {
      src: "/images/game/calm_flowers.webp",
      label: "静かな花々",
      valence: 5.94,
      arousal: 3.01,
    },
    right: {
      src: "/images/game/lively_thunderstorm.webp",
      label: "激しい雷雨",
      valence: 5.06,
      arousal: 4.55,
    },
  },
  {
    pairIndex: 8,
    category: "calm_vs_lively",
    targetAxes: ["calmness", "positivity"],
    left: {
      src: "/images/game/calm_desert.webp",
      label: "静寂の砂漠",
      valence: 4.0,
      arousal: 3.27,
    },
    right: {
      src: "/images/game/lively_lightning.webp",
      label: "稲妻の閃光",
      valence: 4.85,
      arousal: 4.52,
    },
  },

  // ═══ 集団 vs 個人 (Group vs Individual) ═══
  // 測定軸: cooperativeness（協調性）
  {
    pairIndex: 9,
    category: "group_vs_individual",
    targetAxes: ["cooperativeness"],
    left: {
      src: "/images/game/group_wedding.webp",
      label: "みんなの結婚式",
      valence: 5.67,
      arousal: 4.1,
    },
    right: {
      src: "/images/game/individual_yoga.webp",
      label: "一人のヨガ",
      valence: 5.56,
      arousal: 3.47,
    },
  },
  {
    pairIndex: 10,
    category: "group_vs_individual",
    targetAxes: ["cooperativeness"],
    left: {
      src: "/images/game/group_school.webp",
      label: "学校の仲間",
      valence: 5.83,
      arousal: 3.96,
    },
    right: {
      src: "/images/game/individual_camping.webp",
      label: "一人のキャンプ",
      valence: 5.6,
      arousal: 3.25,
    },
  },
  {
    pairIndex: 11,
    category: "group_vs_individual",
    targetAxes: ["cooperativeness"],
    left: {
      src: "/images/game/group_parade.webp",
      label: "賑やかなパレード",
      valence: 5.65,
      arousal: 3.48,
    },
    right: {
      src: "/images/game/individual_sailing.webp",
      label: "一人のセーリング",
      valence: 5.45,
      arousal: 3.62,
    },
  },

  // ═══ 抽象 vs 具象 (Abstract vs Concrete) ═══
  // 測定軸: logic（論理性）, calmness（冷静さ）
  {
    pairIndex: 12,
    category: "abstract_vs_concrete",
    targetAxes: ["logic", "calmness"],
    left: {
      src: "/images/game/abstract_galaxy.webp",
      label: "神秘的な銀河",
      valence: 6.06,
      arousal: 4.5,
    },
    right: {
      src: "/images/game/concrete_dog.webp",
      label: "身近な犬",
      valence: 6.2,
      arousal: 3.96,
    },
  },
  {
    pairIndex: 13,
    category: "abstract_vs_concrete",
    targetAxes: ["logic", "calmness"],
    left: {
      src: "/images/game/abstract_rainbow.webp",
      label: "幻想的な虹",
      valence: 6.23,
      arousal: 4.06,
    },
    right: {
      src: "/images/game/concrete_cat.webp",
      label: "愛らしい猫",
      valence: 6.0,
      arousal: 4.22,
    },
  },
  {
    pairIndex: 14,
    category: "abstract_vs_concrete",
    targetAxes: ["logic", "calmness"],
    left: {
      src: "/images/game/abstract_sunflower.webp",
      label: "ひまわり畑",
      valence: 5.87,
      arousal: 3.83,
    },
    right: {
      src: "/images/game/concrete_bird.webp",
      label: "一羽の鳥",
      valence: 6.04,
      arousal: 3.43,
    },
  },
];

// ---------- ユーティリティ ----------

/** カテゴリの日本語名 */
export const CATEGORY_LABELS: Record<ImageCategory, string> = {
  order_vs_freedom: "秩序 vs 自由",
  calm_vs_lively: "静寂 vs 活気",
  group_vs_individual: "集団 vs 個人",
  abstract_vs_concrete: "抽象 vs 具象",
};

/** カテゴリごとにペアをグループ化 */
export function getPairsByCategory(
  category: ImageCategory
): ImagePair[] {
  return IMAGE_PAIRS.filter((p) => p.category === category);
}

/** 全ペア数 */
export const TOTAL_PAIRS = IMAGE_PAIRS.length;

/** ゲーム所要時間の目安（秒） */
export const ESTIMATED_DURATION_SEC = TOTAL_PAIRS * 7; // ~98秒 ≈ 1.5分
