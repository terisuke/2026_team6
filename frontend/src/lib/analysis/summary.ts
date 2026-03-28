import type { SwipeMetrics } from '@/features/game/types';

const mean = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

export function buildSwipeSummary(rounds: SwipeMetrics[]): string {
  if (rounds.length === 0) return 'データなし';

  const avgFirst = mean(rounds.map((r) => r.timeToFirstMove));
  const avgSwipe = mean(rounds.map((r) => r.totalSwipeTime));
  const totalReversals = rounds.reduce((s, r) => s + r.reversalCount, 0);
  const timeouts = rounds.filter((r) => r.swipeDirection === 'timeout').length;

  const phase1 = rounds.filter((r) => r.phase === 1);
  const phase3 = rounds.filter((r) => r.phase === 3);
  const baseJitter = mean(phase1.map((r) => r.jitterCount));
  const pressJitter = mean(phase3.map((r) => r.jitterCount));

  const firstText =
    avgFirst < 500
      ? '画像を見た瞬間に'
      : avgFirst < 1500
        ? '少し眺めてから'
        : 'じっくり考えてから';

  const speedText =
    avgSwipe < 1500
      ? '素早くスワイプしました'
      : avgSwipe < 3000
        ? '落ち着いたペースで判断しました'
        : '慎重に時間をかけて選びました';

  const reversalText =
    totalReversals >= 5
      ? `途中で${totalReversals}回も方向を変え、迷いが見られました。`
      : totalReversals >= 2
        ? `${totalReversals}回の方向転換がありました。`
        : '迷いなく一直線に選択しました。';

  const pressureText =
    phase3.length > 0 && pressJitter > baseJitter * 1.5
      ? 'プレッシャー下ではマウスの揺れが増加しました。'
      : 'プレッシャー下でも安定した操作を維持しました。';

  const timeoutText =
    timeouts > 0 ? `${timeouts}問でタイムアウトしました。` : '';

  return `${firstText}${speedText}。${reversalText}${pressureText}${timeoutText}`;
}
