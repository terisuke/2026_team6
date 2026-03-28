import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/userRepository';
import { BaselineAnswers, BaselineScores } from '../types';

// 回答 → スコア変換マップ（論文ベース4段階）
const SCORE_MAP: Record<string, number> = {
    'A': 25,  // low
    'B': 45,
    'C': 65,
    'D': 85,  // high
};

const DEFAULT_NEUTRAL_SCORE = 50;

function convertAnswersToScores(answers: BaselineAnswers): BaselineScores {
    const convert = (value: string): number => SCORE_MAP[value] ?? DEFAULT_NEUTRAL_SCORE;
    return {
        caution: convert(answers.q1_caution),
        calmness: DEFAULT_NEUTRAL_SCORE,
        logic: DEFAULT_NEUTRAL_SCORE,
        cooperativeness: convert(answers.q2_cooperativeness),
        positivity: convert(answers.q3_positivity),
    };
}

export const registerService = {
    async registerUser(mbti: string | null | undefined, baselineAnswers: BaselineAnswers) {
        // バリデーション
        if (mbti) {
            const mbtiRegex = /^[IE][SN][TF][JP]$/i;
            if (!mbtiRegex.test(mbti)) {
                throw { status: 400, code: 'invalid_mbti', message: 'MBTI must be a valid 4-letter type (e.g., INTJ, ESFP)' };
            }
        }

        if (!baselineAnswers) {
            throw { status: 400, code: 'invalid_request', message: 'baseline_answers is required' };
        }

        const requiredKeys = ['q1_caution', 'q2_cooperativeness', 'q3_positivity'];
        const providedKeys = Object.keys(baselineAnswers);
        const missingKeys = requiredKeys.filter(k => !providedKeys.includes(k));

        if (missingKeys.length > 0) {
            throw { status: 400, code: 'invalid_request', message: `Missing baseline_answers keys: ${missingKeys.join(', ')}` };
        }

        const validValues = ['A', 'B', 'C', 'D'];
        const invalidKeys = requiredKeys.filter(k => !validValues.includes((baselineAnswers as unknown as Record<string, string>)[k]));
        if (invalidKeys.length > 0) {
            throw { status: 400, code: 'invalid_answers', message: `Answers must be one of [${validValues.join(', ')}]. Invalid keys: ${invalidKeys.join(', ')}` };
        }

        // A-D → 数値に変換（calmness, logicはデフォルト50）
        const baselineScores = convertAnswersToScores(baselineAnswers);

        const userId = uuidv4();
        await userRepository.create(userId, mbti || null, baselineScores);

        return userId;
    }
};
