import type { BaselineScores } from '@/features/game/types';

export function generateFeedback(
  scores: BaselineScores,
  gaps: BaselineScores,
): { title: string; description: string; gapPoint: string } {
  const gapEntries = Object.entries(gaps).map(([key, value]) => ({
    key,
    value,
    abs: Math.abs(value),
  }));
  gapEntries.sort((a, b) => b.abs - a.abs);
  const maxGap = gapEntries[0];

  if (maxGap.abs <= 10) {
    return {
      title: '自己認識の達人',
      description:
        'あなたの自己認識と実際の行動にはほとんどズレがありません。自分自身を極めて客観的に把握できています。',
      gapPoint: 'なし（バランス型）',
    };
  }

  const isOverestimated = maxGap.value < 0;

  const feedbackText: Record<
    string,
    { over: { title: string; desc: string }; under: { title: string; desc: string } }
  > = {
    caution: {
      over: {
        title: '予想外の大胆さ',
        desc: 'あなたは自分を慎重だと思っていましたが、実際の行動では迷いなく大胆な判断を下していました。',
      },
      under: {
        title: '隠れた慎重派',
        desc: 'あなたは自分を大胆だと思っていましたが、行動ログには石橋を叩いて渡る慎重さが表れています。',
      },
    },
    calmness: {
      over: {
        title: '隠れパニックメーカー',
        desc: 'あなたは冷静なつもりでも、想定外の事態が起きると無意識に焦りが行動に表れてしまうようです。',
      },
      under: {
        title: '氷のメンタル',
        desc: 'あなたは自分を感情的だと思っていましたが、プレッシャー下でも極めて冷静に処理を行えていました。',
      },
    },
    logic: {
      over: {
        title: '直感ドリブン',
        desc: 'あなたは論理的に考えているつもりでも、いざという時はフィーリングで決定を下すことが多いようです。',
      },
      under: {
        title: '隠れた知性',
        desc: 'あなたは自分を直感的だと思っていましたが、非常に一貫性のある論理的な判断を下していました。',
      },
    },
    cooperativeness: {
      over: {
        title: '孤高のソロプレイヤー',
        desc: 'あなたは協調的だと思っていましたが、実際には自分の意見を貫く強さを持っています。',
      },
      under: {
        title: '究極のバランサー',
        desc: 'あなたは自分を独立心が強いと思っていましたが、無意識に周囲の空気を読み調和を重んじています。',
      },
    },
    positivity: {
      over: {
        title: '石橋を叩き割る守護者',
        desc: 'あなたは積極的だと思い込んでいますが、無意識のうちに失敗を恐れ行動が遅れる傾向があります。',
      },
      under: {
        title: '前のめりな挑戦者',
        desc: 'あなたは自分を消極的だと思っていましたが、チャンスがあれば誰よりも早く行動を起こしています。',
      },
    },
  };

  const axisNames: Record<string, string> = {
    caution: '慎重さ',
    calmness: '冷静さ',
    logic: '論理性',
    cooperativeness: '協調性',
    positivity: '積極性',
  };

  const fb = isOverestimated
    ? feedbackText[maxGap.key].over
    : feedbackText[maxGap.key].under;

  return {
    title: fb.title,
    description: fb.desc,
    gapPoint: axisNames[maxGap.key],
  };
}
