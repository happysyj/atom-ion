import React, { useState, useEffect, useRef } from 'react';
import { ELEMENTS_20, ElementData } from '../data/chemistryData';
import { audioEngine } from '../utils/audioEngine';
import { CheckCircle2, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { StageScoreDetail } from '../types';

interface Stage1Props {
  onStageComplete: (scoreDetail: StageScoreDetail) => void;
  onScoreUpdate: (delta: number) => void;
  stageTimer: number;
}

interface MatchCard {
  id: string; // unique id
  elementNumber: number;
  type: 'symbol' | 'name';
  text: string;
  matched: boolean;
}

export const Stage1ElementMatch: React.FC<Stage1Props> = ({
  onStageComplete,
  onScoreUpdate,
  stageTimer,
}) => {
  const [symbolCards, setSymbolCards] = useState<MatchCard[]>([]);
  const [nameCards, setNameCards] = useState<MatchCard[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<MatchCard | null>(null);
  const [selectedName, setSelectedName] = useState<MatchCard | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [floatingFeedback, setFloatingFeedback] = useState<{ text: string; color: string; id: number } | null>(null);

  const completedRef = useRef(false);

  // Initialize shuffled cards on mount
  useEffect(() => {
    const symbols: MatchCard[] = ELEMENTS_20.map((el) => ({
      id: `sym_${el.number}`,
      elementNumber: el.number,
      type: 'symbol',
      text: el.symbol,
      matched: false,
    }));

    const names: MatchCard[] = ELEMENTS_20.map((el) => ({
      id: `name_${el.number}`,
      elementNumber: el.number,
      type: 'name',
      text: el.name,
      matched: false,
    }));

    // Fisher-Yates Shuffle
    setSymbolCards([...symbols].sort(() => Math.random() - 0.5));
    setNameCards([...names].sort(() => Math.random() - 0.5));
  }, []);

  // Handle stage completion
  const handleFinish = (isTimeout: boolean = false, recordedTime?: number) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const finalTime = recordedTime !== undefined ? recordedTime : stageTimer;
    const isFullyCompleted = matchedCount === 20;
    const earnedBonus = !isTimeout && isFullyCompleted && finalTime <= 60 ? 50 : 0;

    if (earnedBonus > 0) {
      audioEngine.playBonus();
      onScoreUpdate(earnedBonus);
    } else if (isFullyCompleted) {
      audioEngine.playVictory();
    }

    onStageComplete({
      baseScore: matchedCount * 10,
      penalties: penalties,
      bonus: earnedBonus,
      timeSpent: finalTime,
      completed: isFullyCompleted,
    });
  };

  // Watch for 3 minutes (180s) auto-advance threshold
  useEffect(() => {
    if (stageTimer >= 180 && !completedRef.current) {
      handleFinish(true);
    }
  }, [stageTimer]);

  // Check matching whenever both are selected
  useEffect(() => {
    if (!selectedSymbol || !selectedName) return;

    if (selectedSymbol.elementNumber === selectedName.elementNumber) {
      // Correct match!
      audioEngine.playCorrect();
      onScoreUpdate(10);
      showFeedback('+10점', 'text-teal-300');

      setSymbolCards((prev) =>
        prev.map((c) => (c.id === selectedSymbol.id ? { ...c, matched: true } : c))
      );
      setNameCards((prev) =>
        prev.map((c) => (c.id === selectedName.id ? { ...c, matched: true } : c))
      );

      const nextCount = matchedCount + 1;
      setMatchedCount(nextCount);
      setSelectedSymbol(null);
      setSelectedName(null);

      // Check if all 20 elements are matched
      if (nextCount === 20) {
        const timeTaken = stageTimer;
        setTimeout(() => {
          handleFinish(false, timeTaken);
        }, 500);
      }
    } else {
      // Wrong match: -1 penalty
      audioEngine.playWrong();
      onScoreUpdate(-1);
      setPenalties((p) => p + 1);
      showFeedback('-1점', 'text-rose-400');
      setShakeId(`${selectedSymbol.id}_${selectedName.id}`);

      setTimeout(() => {
        setShakeId(null);
        setSelectedSymbol(null);
        setSelectedName(null);
      }, 500);
    }
  }, [selectedSymbol, selectedName]);

  const showFeedback = (text: string, color: string) => {
    setFloatingFeedback({ text, color, id: Date.now() });
    setTimeout(() => setFloatingFeedback(null), 800);
  };

  const handleCardClick = (card: MatchCard) => {
    if (card.matched) return;
    audioEngine.playCardSelect();

    if (card.type === 'symbol') {
      setSelectedSymbol(selectedSymbol?.id === card.id ? null : card);
    } else {
      setSelectedName(selectedName?.id === card.id ? null : card);
    }
  };

  const progressPercent = Math.round((matchedCount / 20) * 100);
  const isBonusEligible = stageTimer <= 60;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Top Banner & Instructions */}
      <div className="bg-slate-900/80 border border-cyan-800/60 rounded-2xl p-4 mb-4 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-bold">
              1단계 게임
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              원소 기호와 원소 이름 매칭
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            원소 기호 카드(왼쪽)와 한글 원소 이름 카드(오른쪽)를 하나씩 클릭하여 짝을 맞추세요.
          </p>
        </div>

        {/* Progress & Bonus Indicator */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">진행도: {matchedCount} / 20 ({progressPercent}%)</div>
            <div className="w-32 sm:w-40 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              isBonusEligible
                ? 'bg-amber-950/60 border-amber-600/70 text-amber-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>1분 보너스 (+50점): {isBonusEligible ? `${60 - stageTimer}초 남음` : '종료'}</span>
          </div>
        </div>
      </div>

      {/* Floating Feedback alert */}
      {floatingFeedback && (
        <div className="fixed top-20 right-6 z-50 animate-bounce pointer-events-none">
          <div className={`px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-lg font-black ${floatingFeedback.color}`}>
            {floatingFeedback.text}
          </div>
        </div>
      )}

      {/* Cards Layout: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Element Symbols */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <span>원소 기호 카드</span>
              <span className="text-xs font-normal text-slate-400">(선택 후 오른쪽 이름을 누르세요)</span>
            </h3>
            <span className="text-xs text-slate-400">20개</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-2.5">
            {symbolCards.map((card) => {
              const isSelected = selectedSymbol?.id === card.id;
              const isShaking = shakeId?.startsWith(card.id);

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.matched}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl font-bold transition-all select-none ${
                    card.matched
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400/40 cursor-default scale-95 opacity-50'
                      : isSelected
                      ? 'bg-cyan-500 text-slate-950 border-2 border-white shadow-lg shadow-cyan-500/40 scale-105 z-10'
                      : 'bg-slate-800/90 hover:bg-slate-750 text-cyan-200 border border-cyan-800/40 hover:border-cyan-500/60 active:scale-95 shadow-sm'
                  } ${isShaking ? 'animate-shake bg-rose-900/80 border-rose-500 text-white' : ''}`}
                >
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                    {card.text}
                  </span>
                  {card.matched && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Korean Element Names */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-bold text-teal-300 flex items-center gap-1.5">
              <span>원소 이름 카드</span>
              <span className="text-xs font-normal text-slate-400">(한글 이름)</span>
            </h3>
            <span className="text-xs text-slate-400">20개</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-2.5">
            {nameCards.map((card) => {
              const isSelected = selectedName?.id === card.id;
              const isShaking = shakeId?.endsWith(card.id);

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.matched}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl p-1.5 font-bold transition-all select-none cursor-pointer ${
                    card.matched
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400/40 cursor-default scale-95 opacity-50'
                      : isSelected
                      ? 'bg-teal-400 text-slate-950 border-2 border-white shadow-lg shadow-teal-400/40 scale-105 z-10'
                      : 'bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-teal-800/40 hover:border-teal-500/60 active:scale-95 shadow-sm'
                  } ${isShaking ? 'animate-shake bg-rose-900/80 border-rose-500 text-white' : ''}`}
                >
                  <span className="text-sm sm:text-base font-extrabold text-center leading-tight">
                    {card.text}
                  </span>
                  {card.matched && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rules Notice Footer */}
      <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
        <span>정답: +10점</span>
        <span>•</span>
        <span>오답: -1점 감점</span>
        <span>•</span>
        <span>1분 이내 완료: 보너스 +50점</span>
        <span>•</span>
        <span>3분 경과 시: 자동 다음 단계</span>
      </div>
    </div>
  );
};
