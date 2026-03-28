export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export type QuestionKey =
  | 'q1_caution'
  | 'q2_cooperativeness'
  | 'q3_positivity';

export type BaselineAnswers = Record<QuestionKey, AnswerOption>;

export type QuestionOption = {
  value: AnswerOption;
  label: string;
};

export type Question = {
  key: QuestionKey;
  label: string;
  options: QuestionOption[];
};

export const QUESTIONS: Question[] = [
  {
    key: 'q1_caution',
    label: '初めての街でランチ。お店選びは？',
    options: [
      { value: 'A', label: '口コミを熟読して予約する' },
      { value: 'B', label: '歩きながらスマホで比較する' },
      { value: 'C', label: '外観の雰囲気で決める' },
      { value: 'D', label: '直感でパッと飛び込む' },
    ],
  },
  {
    key: 'q2_cooperativeness',
    label: '大人数での食事。自分の注文は？',
    options: [
      { value: 'A', label: '全体のバランスを見て合わせる' },
      { value: 'B', label: '浮かない範囲で好きなものを頼む' },
      { value: 'C', label: '周りを気にせず食べたいものを頼む' },
      { value: 'D', label: '自分のイチオシをみんなにも勧める' },
    ],
  },
  {
    key: 'q3_positivity',
    label: '初対面の人が多いパーティーでは？',
    options: [
      { value: 'A', label: '自分からどんどん話しかける' },
      { value: 'B', label: '目が合った人に挨拶してみる' },
      { value: 'C', label: '話しかけられるのを笑顔で待つ' },
      { value: 'D', label: '聞き役に徹して相槌を打つ' },
    ],
  },
];

/** 回答 → 0-100 スコア変換 */
const ANSWER_SCORE: Record<AnswerOption, number> = {
  A: 100,
  B: 75,
  C: 25,
  D: 0,
};

export function answersToScores(answers: BaselineAnswers) {
  return {
    caution: ANSWER_SCORE[answers.q1_caution],
    calmness: 50,           // マウス行動で測定するためデフォルト
    logic: 50,              // マウス行動で測定するためデフォルト
    cooperativeness: ANSWER_SCORE[answers.q2_cooperativeness],
    positivity: ANSWER_SCORE[answers.q3_positivity],
  };
}
