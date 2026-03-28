import type { RoundPhase, MeasurementAxis } from "../types";
import { IMAGE_PAIRS } from "@/constants/imageConfig";

// ========================================
// Swipe Round Configuration
// ========================================

export interface SwipeRoundConfig {
  readonly roundNumber: number;
  readonly phase: RoundPhase;
  readonly leftImage: {
    readonly path: string;
    readonly label: string;
  };
  readonly rightImage: {
    readonly path: string;
    readonly label: string;
  };
  readonly imageCategory: string;
  readonly timeLimit: number;
  readonly targetAxes: readonly MeasurementAxis[];
}

/**
 * Helper: IMAGE_PAIRS から pairIndex で取得
 * pairIndex は 1-based
 */
function getPair(pairIndex: number) {
  const pair = IMAGE_PAIRS.find((p) => p.pairIndex === pairIndex);
  if (!pair) {
    throw new Error(`Image pair not found: pairIndex=${pairIndex}`);
  }
  return pair;
}

// ---------- Pair references ----------
// pairIndex 12: abstract_galaxy vs concrete_dog
// pairIndex  5: calm_lake vs lively_celebration
// pairIndex 13: abstract_rainbow vs concrete_cat
// pairIndex  9: group_wedding vs individual_yoga
// pairIndex  6: calm_sunset vs lively_skydiving
// pairIndex  1: order_desk vs freedom_street
// pairIndex 10: group_school vs individual_camping
// pairIndex  4: order_coffee vs freedom_rollercoaster
// pairIndex  7: calm_flowers vs lively_thunderstorm
// pairIndex 11: group_parade vs individual_sailing

const pair1 = getPair(12);
const pair2 = getPair(5);
const pair3 = getPair(13);
const pair4 = getPair(9);
const pair5 = getPair(6);
const pair6 = getPair(1);
const pair7 = getPair(10);
const pair8 = getPair(4);
const pair9 = getPair(7);
const pair10 = getPair(11);

/**
 * 10 rounds of the swipe game.
 *
 * | Phase    | Rounds | Time  | Purpose                        |
 * |----------|--------|-------|--------------------------------|
 * | warmup   | 1-3    | 8 s   | Baseline (jitter, speed)       |
 * | main     | 4-8    | 10 s  | All 5 personality axes         |
 * | pressure | 9-10   | 5 s   | Stress tolerance under time    |
 */
export const ROUNDS: readonly SwipeRoundConfig[] = [
  // ═══ Warmup Phase (R1-3): abstract/calm pairs, 8s ═══
  {
    roundNumber: 1,
    phase: "warmup",
    leftImage: { path: pair1.left.src, label: pair1.left.label },
    rightImage: { path: pair1.right.src, label: pair1.right.label },
    imageCategory: pair1.category,
    timeLimit: 8,
    targetAxes: ["calmness"],
  },
  {
    roundNumber: 2,
    phase: "warmup",
    leftImage: { path: pair2.left.src, label: pair2.left.label },
    rightImage: { path: pair2.right.src, label: pair2.right.label },
    imageCategory: pair2.category,
    timeLimit: 8,
    targetAxes: ["calmness"],
  },
  {
    roundNumber: 3,
    phase: "warmup",
    leftImage: { path: pair3.left.src, label: pair3.left.label },
    rightImage: { path: pair3.right.src, label: pair3.right.label },
    imageCategory: pair3.category,
    timeLimit: 8,
    targetAxes: ["calmness"],
  },

  // ═══ Main Phase (R4-8): thematic pairs, 10s ═══
  {
    roundNumber: 4,
    phase: "main",
    leftImage: { path: pair4.left.src, label: pair4.left.label },
    rightImage: { path: pair4.right.src, label: pair4.right.label },
    imageCategory: pair4.category,
    timeLimit: 10,
    targetAxes: ["cooperativeness"],
  },
  {
    roundNumber: 5,
    phase: "main",
    leftImage: { path: pair5.left.src, label: pair5.left.label },
    rightImage: { path: pair5.right.src, label: pair5.right.label },
    imageCategory: pair5.category,
    timeLimit: 10,
    targetAxes: ["calmness", "positivity"],
  },
  {
    roundNumber: 6,
    phase: "main",
    leftImage: { path: pair6.left.src, label: pair6.left.label },
    rightImage: { path: pair6.right.src, label: pair6.right.label },
    imageCategory: pair6.category,
    timeLimit: 10,
    targetAxes: ["logic", "caution"],
  },
  {
    roundNumber: 7,
    phase: "main",
    leftImage: { path: pair7.left.src, label: pair7.left.label },
    rightImage: { path: pair7.right.src, label: pair7.right.label },
    imageCategory: pair7.category,
    timeLimit: 10,
    targetAxes: ["cooperativeness", "positivity"],
  },
  {
    roundNumber: 8,
    phase: "main",
    leftImage: { path: pair8.left.src, label: pair8.left.label },
    rightImage: { path: pair8.right.src, label: pair8.right.label },
    imageCategory: pair8.category,
    timeLimit: 10,
    targetAxes: ["caution", "positivity"],
  },

  // ═══ Pressure Phase (R9-10): high-contrast pairs, 5s ═══
  {
    roundNumber: 9,
    phase: "pressure",
    leftImage: { path: pair9.left.src, label: pair9.left.label },
    rightImage: { path: pair9.right.src, label: pair9.right.label },
    imageCategory: pair9.category,
    timeLimit: 5,
    targetAxes: ["calmness", "caution"],
  },
  {
    roundNumber: 10,
    phase: "pressure",
    leftImage: { path: pair10.left.src, label: pair10.left.label },
    rightImage: { path: pair10.right.src, label: pair10.right.label },
    imageCategory: pair10.category,
    timeLimit: 5,
    targetAxes: ["cooperativeness", "positivity"],
  },
];

export const TOTAL_ROUNDS = ROUNDS.length;
export const TOTAL_GAME_TIME_SEC = ROUNDS.reduce((sum, r) => sum + r.timeLimit, 0);
