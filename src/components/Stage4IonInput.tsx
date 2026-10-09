import React, { useState, useEffect, useRef } from 'react';
import { ALL_28_IONS, IonData } from '../data/chemistryData';
import { audioEngine } from '../utils/audioEngine';
import { CheckCircle2, Zap, CornerDownLeft, Filter } from 'lucide-react';
import { StageScoreDetail } from '../types';

interface Stage4Props {
  onStageComplete: (scoreDetail: StageScoreDetail) => void;
  onScoreUpdate: (delta: number) => void;
  stageTimer: number;
}

interface IonCardInputState {
  ion: IonData;
  inputValue: string;
  isSolved: boolean;
  attempts: number;
  lastError: boolean;
}

export const Stage4IonInput: React.FC<Stage4Props> = ({
  onStageComplete,
  onScoreUpdate,
  stageTimer,
}) => {
  const [cards, setCards] = useState<IonCardInputState[]>([]);
  const [penalties, setPenalties] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unsolved' | 'cation' | 'anion'>('all');

  const completedRef = useRef(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const totalCount = ALL_28_IONS.length; // 28 items

  useEffect(() => {
    // Shuffle the 28 cards
    const shuffled = [...ALL_28_IONS].sort(() => Math.random() - 0.5);

    setCards(
      shuffled.map((ion) => ({
        ion,
        inputValue: '',
        isSolved: false,
        attempts: 0,
        lastError: false,
      }))
    );
  }, []);

  const handleFinish = (isTimeout: boolean = false, recordedTime?: number) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const finalTime = recordedTime !== undefined ? recordedTime : stageTimer;
    const isFullyCompleted = solvedCount === totalCount;
    // 4단계: 2분 30초(150초) 이내 완성 시 보너스 50점
    const earnedBonus = !isTimeout && isFullyCompleted && finalTime <= 150 ? 50 : 0;

    if (earnedBonus > 0) {
      audioEngine.playBonus();
      onScoreUpdate(earnedBonus);
    } else if (isFullyCompleted) {
      audioEngine.playVictory();
    }

    onStageComplete({
      baseScore: solvedCount * 10,
      penalties: penalties,
      bonus: earnedBonus,
      timeSpent: finalTime,
      completed: isFullyCompleted,
    });
  };

  // 4분(240초) 자동 다음 단계 이동
  useEffect(() => {
    if (stageTimer >= 240 && !completedRef.current) {
      handleFinish(true);
    }
  }, [stageTimer]);

  const showFeedbackMsg = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 800);
  };

  const cleanString = (str: string) => {
    return str.replace(/\s+/g, '').toLowerCase();
  };

  const handleInputChange = (index: number, val: string) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, inputValue: val, lastError: false } : c))
    );
  };

  const handleCheckAnswer = (index: number) => {
    const card = cards[index];
    if (card.isSolved) return;

    let userInput = cleanString(card.inputValue);
    if (!userInput) return;

    // Remove suffix "이온" if student typed it anyway
    if (userInput.endsWith('이온') && userInput.length > 2) {
      userInput = userInput.slice(0, -2);
    }

    const cleanRoot = cleanString(card.ion.rootName);
    const cleanFull = cleanString(card.ion.name).replace(/이온$/, '');
    const cleanAliases = (card.ion.aliases || []).map((a) => cleanString(a).replace(/이온$/, ''));

    const isCorrect =
      userInput === cleanRoot ||
      userInput === cleanFull ||
      cleanAliases.includes(userInput);

    if (isCorrect) {
      audioEngine.playCorrect();
      onScoreUpdate(10);
      showFeedbackMsg('+10점', 'text-teal-300');

      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);

      setCards((prev) =>
        prev.map((c, i) =>
          i === index
            ? { ...c, isSolved: true, inputValue: c.ion.rootName, lastError: false }
            : c
        )
      );

      // Auto-focus next unsolved input
      const nextUnsolvedIndex = cards.findIndex(
        (c, i) => i > index && !c.isSolved
      );
      if (nextUnsolvedIndex !== -1 && inputRefs.current[nextUnsolvedIndex]) {
        inputRefs.current[nextUnsolvedIndex]?.focus();
      }

      if (nextSolved === totalCount) {
        const timeTaken = stageTimer;
        setTimeout(() => {
          handleFinish(false, timeTaken);
        }, 500);
      }
    } else {
      audioEngine.playWrong();
      onScoreUpdate(-1);
      setPenalties((p) => p + 1);
      showFeedbackMsg('-1점', 'text-rose-400');

      setCards((prev) =>
        prev.map((c, i) =>
          i === index
            ? { ...c, attempts: c.attempts + 1, lastError: true }
            : c
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCheckAnswer(index);
    }
  };

  const isBonusEligible = stageTimer <= 150;
  const progressPercent = Math.round((solvedCount / totalCount) * 100);

  const displayedCards = cards
    .map((card, originalIndex) => ({ card, originalIndex }))
    .filter(({ card }) => {
      if (filterType === 'unsolved') return !card.isSolved;
      if (filterType === 'cation') return card.ion.type === 'cation';
      if (filterType === 'anion') return card.ion.type === 'anion';
      return true;
    });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-purple-800/60 rounded-2xl p-4 mb-3 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 text-xs sm:text-sm font-black">
              4단계 게임 (최종 단계)
            </span>
            <h2 className="text-base sm:text-xl font-bold text-white">
              이온식 화학식을 보고 이름 직접 쓰기 (총 28종)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            화학식 카드를 보고 '이온' 앞부분의 원소/작용기 이름만 입력하세요. (예: Na⁺ → <strong className="text-teal-300">'나트륨'</strong>만 입력)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-300">
              해결: <strong className="text-purple-300 font-black">{solvedCount}</strong> / {totalCount} ({progressPercent}%)
            </div>
            <div className="w-32 sm:w-40 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              isBonusEligible
                ? 'bg-amber-950/70 border-amber-600 text-amber-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>2분 30초 보너스 (+50점): {isBonusEligible ? `${150 - stageTimer}초` : '종료'}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-3 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 mr-1">보기 필터:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            전체 28개
          </button>
          <button
            onClick={() => setFilterType('unsolved')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'unsolved'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            미완료 ({totalCount - solvedCount}개)
          </button>
          <button
            onClick={() => setFilterType('cation')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'cation'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            양이온 14개
          </button>
          <button
            onClick={() => setFilterType('anion')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'anion'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            음이온 14개
          </button>
        </div>

        <div className="text-xs text-slate-400">
          표시 중: <strong className="text-white">{displayedCards.length}</strong>개
        </div>
      </div>

      {feedback && (
        <div className="fixed top-20 right-6 z-50 animate-bounce pointer-events-none">
          <div className={`px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xl font-black ${feedback.color}`}>
            {feedback.text}
          </div>
        </div>
      )}

      {/* Cards Grid: Formula Card + Name Input with fixed '이온' suffix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {displayedCards.map(({ card, originalIndex }) => {
          const textLen = card.ion.formula.length;
          const formulaFontSize =
            textLen >= 7
              ? 'text-base sm:text-lg'
              : textLen >= 5
              ? 'text-lg sm:text-xl'
              : 'text-xl sm:text-2xl';

          return (
            <div
              key={card.ion.id}
              className={`rounded-2xl border p-2.5 flex flex-col justify-between transition-all backdrop-blur-sm shadow-md ${
                card.isSolved
                  ? 'bg-emerald-950/40 border-emerald-600/80'
                  : card.lastError
                  ? 'bg-rose-950/40 border-rose-600/80 animate-shake'
                  : 'bg-slate-900/80 border-slate-800 hover:border-purple-600/60'
              }`}
            >
              {/* Formula Display Area */}
              <div className="relative py-4 px-1 text-center bg-slate-800/90 rounded-xl mb-2 border border-slate-700/60 min-h-[72px] flex items-center justify-center">
                <span className="text-[10px] text-slate-400 absolute top-1 left-2 font-mono font-bold">
                  #{originalIndex + 1}
                </span>

                {card.isSolved && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute top-1 right-2" />
                )}

                <div
                  className={`${formulaFontSize} font-mono font-black text-purple-200 tracking-tight my-1 px-1 max-w-full text-center leading-none`}
                  dangerouslySetInnerHTML={{ __html: card.ion.htmlFormula }}
                />
              </div>

              {/* Input section with fixed [이온] suffix badge */}
              <div className="space-y-1">
                <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/40 overflow-hidden">
                  <input
                    ref={(el) => { inputRefs.current[originalIndex] = el; }}
                    type="text"
                    disabled={card.isSolved}
                    value={card.inputValue}
                    onChange={(e) => handleInputChange(originalIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, originalIndex)}
                    placeholder={card.isSolved ? card.ion.rootName : '이름'}
                    className={`w-full px-2.5 py-1.5 text-xs sm:text-sm font-bold bg-transparent outline-none ${
                      card.isSolved
                        ? 'text-emerald-300 font-black'
                        : card.lastError
                        ? 'text-rose-200'
                        : 'text-white'
                    }`}
                  />
                  {/* Fixed '이온' suffix as requested */}
                  <span className="px-2 py-1.5 bg-slate-700/90 border-l border-slate-600 text-[11px] sm:text-xs font-black text-teal-300 select-none shrink-0">
                    이온
                  </span>
                </div>

                {!card.isSolved && (
                  <button
                    type="button"
                    onClick={() => handleCheckAnswer(originalIndex)}
                    className="w-full py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span>확인</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </button>
                )}

                {card.lastError && (
                  <p className="text-[10px] text-rose-400 font-bold leading-tight text-center">
                    오답 (-1점)
                  </p>
                )}
                {card.attempts >= 2 && !card.isSolved && (
                  <p className="text-[10px] text-amber-300 font-bold leading-tight text-center">
                    💡 힌트: {card.ion.rootName[0]}...
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
        <span>정답: +10점</span>
        <span>•</span>
        <span>오답: -1점 감점</span>
        <span>•</span>
        <span>2분 30초 이내 완료: 보너스 +50점</span>
        <span>•</span>
        <span>4분 경과 시: 자동 최종 결과 이동</span>
      </div>
    </div>
  );
};
