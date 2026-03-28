'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { mbtiAtom } from '@/stores/diagnosis';
import {
  QUESTIONS,
  answersToScores,
  type QuestionKey,
  type BaselineAnswers,
  type AnswerOption,
} from '@/features/diagnosis/types';
import LoadingScreen from '@/components/common/LoadingScreen';
import { registerUser } from '@/lib/db';
import { getMbtiScores } from '@/lib/analysis/mbtiScoreTable';

type Status = 'answering' | 'loading' | 'error';

export default function BaselineSurvey() {
  const router = useRouter();
  const mbti = useAtomValue(mbtiAtom);

  const bgmRef = useRef<HTMLAudioElement | null>(null);

  const playSE = useCallback((path: string) => {
    const audio = new Audio(path);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, []);

  useEffect(() => {
    const bgm = new Audio('/sounds/start-bgm.mp3');
    bgm.loop = true;
    bgm.volume = 0.4;
    bgmRef.current = bgm;

    const playBGM = () => {
      bgm.play().catch(() => {});
      window.removeEventListener('click', playBGM);
    };
    window.addEventListener('click', playBGM);
    playBGM();

    return () => {
      bgm.pause();
      window.removeEventListener('click', playBGM);
    };
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Partial<Record<QuestionKey, AnswerOption>>
  >({});
  const [status, setStatus] = useState<Status>('answering');

  const currentQuestion = QUESTIONS[currentIndex];
  const totalQuestions = QUESTIONS.length;

  const submitToApi = useCallback(
    async (finalAnswers: BaselineAnswers) => {
      setStatus('loading');
      if (bgmRef.current) bgmRef.current.pause();

      try {
        const baseScores = answersToScores(finalAnswers);

        // MBTI提供時は冷静さ・論理性をMBTI理論値で補完
        if (mbti) {
          const mbtiScores = getMbtiScores(mbti);
          if (mbtiScores) {
            baseScores.calmness = Math.round(baseScores.calmness * 0.3 + mbtiScores.calmness * 0.7);
            baseScores.logic = Math.round(baseScores.logic * 0.3 + mbtiScores.logic * 0.7);
          }
        }

        const userId = await registerUser({ mbti, baselineScores: baseScores });
        localStorage.setItem('real_you_user_id', userId);
        router.push('/game');
      } catch {
        setStatus('error');
      }
    },
    [mbti, router],
  );

  const handleAnswer = (value: AnswerOption) => {
    const newAnswers = { ...answers, [currentQuestion.key]: value };
    setAnswers(newAnswers);
    playSE('/sounds/general-button-se.mp3');

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      submitToApi(newAnswers as BaselineAnswers);
    }
  };

  const handleRetry = () => {
    playSE('/sounds/general-button-se.mp3');
    submitToApi(answers as BaselineAnswers);
  };

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'error') {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <p className="text-lg font-semibold text-red-600">通信に失敗しました</p>
        <button
          onClick={handleRetry}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          リトライ
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-0 flex items-start justify-between gap-4">
        <div className="relative z-10 flex flex-col">
          <div className="rounded-2xl border-4 border-gray-800 bg-white px-6 py-3 shadow-md">
            <h1 className="text-xl font-bold text-gray-900">質問コーナー</h1>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="flex shrink-0 gap-0.5 rounded-xl border-4 border-gray-800 bg-gray-100 p-1">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`h-6 w-8 rounded-lg transition-colors ${
                i <= currentIndex ? 'bg-rose-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* メインカード */}
      <div className="relative -mt-4 rounded-3xl border-4 border-gray-800 bg-white p-6 shadow-lg">
        <p className="mb-6 text-xl font-bold text-gray-900">
          Q{currentIndex + 1}. {currentQuestion.label}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleAnswer(option.value)}
              className="rounded-2xl border-4 border-gray-800 bg-gray-100 px-6 py-4 text-center font-bold text-gray-900 transition hover:bg-rose-50 hover:border-rose-300"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
