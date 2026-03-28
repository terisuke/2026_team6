import { atom } from 'jotai';
import type {
  SwipeRoundData,
  SwipeGameData,
  GameFlowState,
} from '@/features/game/types';

/** UI state machine for the game flow */
export const gameFlowAtom = atom<GameFlowState>('intro');

/** Collected round data (immutable array) */
export const roundDataAtom = atom<readonly SwipeRoundData[]>([]);

/** Current round index (0-based) */
export const currentRoundAtom = atom<number>(0);

/** Complete game data (set when game finishes) */
export const gameDataAtom = atom<SwipeGameData | null>(null);
