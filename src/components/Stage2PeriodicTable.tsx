import React, { useState, useEffect, useRef } from 'react';
import { ELEMENTS_20, ElementData } from '../data/chemistryData';
import { audioEngine } from '../utils/audioEngine';
import { CheckCircle2, Zap, RotateCcw } from 'lucide-react';
import { StageScoreDetail } from '../types';

interface Stage2Props {
  onStageComplete: (scoreDetail: StageScoreDetail) => void;
  onScoreUpdate: (delta: number) => void;
  stageTimer: number;
}

// 8개 주요 족 (1, 2, 13, 14, 15, 16, 17, 18) x 4주기
interface TableSlot {
  period: number; // 1~4
  colIndex: number; // 0~7
  groupLabel: string;
  elementNumber: number | null; // 1~20 if valid, null if empty space in periodic table
}

const PERIODIC_GRID: TableSlot[][] = [
  // 1주기: H(1), blank, blank, blank, blank, blank, blank, He(2)
  [
    { period: 1, colIndex: 0, groupLabel: '1족', elementNumber: 1 },
    { period: 1, colIndex: 1, groupLabel: '2족', elementNumber: null },
    { period: 1, colIndex: 2, groupLabel: '13족', elementNumber: null },
    { period: 1, colIndex: 3, groupLabel: '14족', elementNumber: null },
    { period: 1, colIndex: 4, groupLabel: '15족', elementNumber: null },
    { period: 1, colIndex: 5, groupLabel: '16족', elementNumber: null },
    { period: 1, colIndex: 6, groupLabel: '17족', elementNumber: null },
    { period: 1, colIndex: 7, groupLabel: '18족', elementNumber: 2 },
  ],
  // 2주기: Li(3), Be(4), B(5), C(6), N(7), O(8), F(9), Ne(10)
  [
    { period: 2, colIndex: 0, groupLabel: '1족', elementNumber: 3 },
    { period: 2, colIndex: 1, groupLabel: '2족', elementNumber: 4 },
    { period: 2, colIndex: 2, groupLabel: '13족', elementNumber: 5 },
    { period: 2, colIndex: 3, groupLabel: '14족', elementNumber: 6 },
    { period: 2, colIndex: 4, groupLabel: '15족', elementNumber: 7 },
    { period: 2, colIndex: 5, groupLabel: '16족', elementNumber: 8 },
    { period: 2, colIndex: 6, groupLabel: '17족', elementNumber: 9 },
    { period: 2, colIndex: 7, groupLabel: '18족', elementNumber: 10 },
  ],
  // 3주기: Na(11), Mg(12), Al(13), Si(14), P(15), S(16), Cl(17), Ar(18)
  [
    { period: 3, colIndex: 0, groupLabel: '1족', elementNumber: 11 },
    { period: 3, colIndex: 1, groupLabel: '2족', elementNumber: 12 },
    { period: 3, colIndex: 2, groupLabel: '13족', elementNumber: 13 },
    { period: 3, colIndex: 3, groupLabel: '14족', elementNumber: 14 },
    { period: 3, colIndex: 4, groupLabel: '15족', elementNumber: 15 },
    { period: 3, colIndex: 5, groupLabel: '16족', elementNumber: 16 },
    { period: 3, colIndex: 6, groupLabel: '17족', elementNumber: 17 },
    { period: 3, colIndex: 7, groupLabel: '18족', elementNumber: 18 },
  ],
  // 4주기: K(19), Ca(20), blank...
  [
    { period: 4, colIndex: 0, groupLabel: '1족', elementNumber: 19 },
    { period: 4, colIndex: 1, groupLabel: '2족', elementNumber: 20 },
    { period: 4, colIndex: 2, groupLabel: '13족', elementNumber: null },
    { period: 4, colIndex: 3, groupLabel: '14족', elementNumber: null },
    { period: 4, colIndex: 4, groupLabel: '15족', elementNumber: null },
    { period: 4, colIndex: 5, groupLabel: '16족', elementNumber: null },
    { period: 4, colIndex: 6, groupLabel: '17족', elementNumber: null },
    { period: 4, colIndex: 7, groupLabel: '18족', elementNumber: null },
  ],
];

interface PlacedMap {
  [atomicNumber: number]: string; // elementNumber -> symbol placed
}

export const Stage2PeriodicTable: React.FC<Stage2Props> = ({
  onStageComplete,
  onScoreUpdate,
  stageTimer,
}) => {
  const [shuffledElements, setShuffledElements] = useState<ElementData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const [placedSlots, setPlacedSlots] = useState<PlacedMap>({});
  const [placedSymbols, setPlacedSymbols] = useState<Set<string>>(new Set());

  const [penalties, setPenalties] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [shakeSlot, setShakeSlot] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  const completedRef = useRef(false);

  useEffect(() => {
    const shuffled = [...ELEMENTS_20].sort(() => Math.random() - 0.5);
    setShuffledElements(shuffled);
  }, []);

  const handleFinish = (isTimeout: boolean = false, recordedTime?: number) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const finalTime = recordedTime !== undefined ? recordedTime : stageTimer;
    const isFullyCompleted = correctCount === 20;
    // 2단계: 1분 30초(90초) 이내 완성 시 보너스 50점
    const earnedBonus = !isTimeout && isFullyCompleted && finalTime <= 90 ? 50 : 0;

    if (earnedBonus > 0) {
      audioEngine.playBonus();
      onScoreUpdate(earnedBonus);
    } else if (isFullyCompleted) {
      audioEngine.playVictory();
    }

    onStageComplete({
      baseScore: correctCount * 10,
      penalties: penalties,
      bonus: earnedBonus,
      timeSpent: finalTime,
      completed: isFullyCompleted,
    });
  };

  useEffect(() => {
    if (stageTimer >= 180 && !completedRef.current) {
      handleFinish(true);
    }
  }, [stageTimer]);

  const showFeedbackMsg = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 800);
  };

  const handleSelectCard = (symbol: string) => {
    if (placedSymbols.has(symbol)) return;
    audioEngine.playCardSelect();
    setSelectedSymbol((prev) => (prev === symbol ? null : symbol));
  };

  const handleSlotClick = (targetAtomicNum: number | null) => {
    if (!targetAtomicNum) return;

    const currentlyPlaced = placedSlots[targetAtomicNum];
    if (currentlyPlaced) {
      // Cancel/Remove placed card
      audioEngine.playWrong();
      setPlacedSlots((prev) => {
        const next = { ...prev };
        delete next[targetAtomicNum];
        return next;
      });
      setPlacedSymbols((prev) => {
        const next = new Set(prev);
        next.delete(currentlyPlaced);
        return next;
      });

      const targetElement = ELEMENTS_20.find((e) => e.number === targetAtomicNum);
      if (targetElement && targetElement.symbol === currentlyPlaced) {
        onScoreUpdate(-10);
        setCorrectCount((c) => Math.max(0, c - 1));
      }
      showFeedbackMsg('배치 취소됨', 'text-amber-300');
      return;
    }

    if (!selectedSymbol) return;

    const targetElement = ELEMENTS_20.find((e) => e.number === targetAtomicNum);
    if (!targetElement) return;

    if (targetElement.symbol === selectedSymbol) {
      // Correct!
      audioEngine.playCorrect();
      onScoreUpdate(10);
      showFeedbackMsg('+10점', 'text-teal-300');

      setPlacedSlots((prev) => ({ ...prev, [targetAtomicNum]: selectedSymbol }));
      setPlacedSymbols((prev) => new Set([...prev, selectedSymbol]));

      const nextCount = correctCount + 1;
      setCorrectCount(nextCount);
      setSelectedSymbol(null);

      if (nextCount === 20) {
        const timeTaken = stageTimer;
        setTimeout(() => {
          handleFinish(false, timeTaken);
        }, 500);
      }
    } else {
      // Wrong placement: -1 penalty
      audioEngine.playWrong();
      onScoreUpdate(-1);
      setPenalties((p) => p + 1);
      showFeedbackMsg('-1점 (오배열)', 'text-rose-400');
      setShakeSlot(targetAtomicNum);

      setPlacedSlots((prev) => ({ ...prev, [targetAtomicNum]: selectedSymbol }));
      setPlacedSymbols((prev) => new Set([...prev, selectedSymbol]));
      setSelectedSymbol(null);

      setTimeout(() => {
        setShakeSlot(null);
      }, 500);
    }
  };

  const isBonusEligible = stageTimer <= 90;
  const progressPercent = Math.round((correctCount / 20) * 100);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex flex-col justify-between h-[calc(100vh-4.25rem)] max-h-[calc(100vh-4.25rem)] overflow-hidden">
      
      {/* 1. Compact Header Bar (Zero scroll requirement) */}
      <div className="bg-slate-900/90 border border-teal-800/60 rounded-xl px-3 py-2 backdrop-blur-md shadow-md flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-teal-950 border border-teal-700 text-teal-300 text-xs sm:text-sm font-black">
            2단계
          </span>
          <h2 className="text-sm sm:text-lg font-black text-white">
            주기율표 빈 칸 채우기 (원자번호 1~20번)
          </h2>
          <span className="hidden md:inline text-xs text-slate-300">
            • 카드를 선택 후 주기율표 슬롯을 클릭하세요 (클릭 시 취소 회수 가능)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-300">
              정답 <strong className="text-teal-300 font-black">{correctCount}</strong>/20
            </span>
            <div className="w-20 sm:w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${
              isBonusEligible
                ? 'bg-amber-950/70 border-amber-600 text-amber-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>1분 30초 보너스: {isBonusEligible ? `${90 - stageTimer}초` : '종료'}</span>
          </div>
        </div>
      </div>

      {/* Floating feedback message */}
      {feedback && (
        <div className="fixed top-18 right-6 z-50 animate-bounce pointer-events-none">
          <div className={`px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xl font-black ${feedback.color}`}>
            {feedback.text}
          </div>
        </div>
      )}

      {/* 2. Main Gameplay Body: Left 20 cards | Right Periodic Table (Fills remaining height perfectly) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 flex-1 my-2 min-h-0 items-stretch">
        
        {/* Left Column: 20 Element Symbol Cards (shuffled) */}
        <div className="md:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden shadow-lg">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1">
            <h3 className="text-xs sm:text-sm font-black text-teal-300 flex items-center gap-1.5">
              <span>원소 기호 카드</span>
              <span className="text-slate-400 font-normal">({20 - placedSymbols.size}개 남음)</span>
            </h3>
            {selectedSymbol ? (
              <span className="text-xs font-black px-2 py-0.5 rounded bg-teal-400 text-slate-950 animate-pulse">
                선택: {selectedSymbol}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">카드를 누르세요</span>
            )}
          </div>

          {/* 4 columns x 5 rows grid: Highly legible & compact */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-1.5 sm:gap-2 flex-1 items-stretch py-1">
            {shuffledElements.map((el) => {
              const isPlaced = placedSymbols.has(el.symbol);
              const isSelected = selectedSymbol === el.symbol;

              return (
                <button
                  key={el.symbol}
                  onClick={() => handleSelectCard(el.symbol)}
                  disabled={isPlaced}
                  className={`w-full h-full min-h-[48px] flex flex-col items-center justify-center rounded-xl p-1 font-bold transition-all select-none cursor-pointer ${
                    isPlaced
                      ? 'bg-slate-950/40 border border-slate-800/80 text-slate-700 cursor-not-allowed opacity-25'
                      : isSelected
                      ? 'bg-teal-400 text-slate-950 border-2 border-white shadow-lg shadow-teal-400/50 scale-105 z-10'
                      : 'bg-slate-800/95 hover:bg-slate-750 text-teal-200 border border-teal-700/60 hover:border-teal-400 active:scale-95 shadow-sm'
                  }`}
                >
                  <span className="text-xl sm:text-2xl font-black font-mono leading-none">
                    {el.symbol}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-bold leading-tight mt-0.5 ${
                    isSelected ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    {el.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Complete Periodic Table Grid (8 columns x 4 periods) */}
        <div className="md:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between overflow-x-auto shadow-lg">
          
          {/* Header Row: 8 Group Labels */}
          <div className="min-w-[540px] flex flex-col h-full justify-between">
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2 text-center pb-1 border-b border-slate-800/70">
              {['1족', '2족', '13족', '14족', '15족', '16족', '17족', '18족'].map((grp) => (
                <div key={grp} className="text-xs sm:text-sm font-black text-cyan-300 uppercase py-0.5">
                  {grp}
                </div>
              ))}
            </div>

            {/* 4 Periods Rows Grid */}
            <div className="grid grid-rows-4 gap-1.5 sm:gap-2 flex-1 my-1.5 items-stretch">
              {PERIODIC_GRID.map((row, periodIdx) => (
                <div key={periodIdx} className="flex items-center gap-1.5 sm:gap-2 h-full">
                  {/* Period Label */}
                  <div className="w-7 sm:w-8 shrink-0 text-center text-xs sm:text-sm font-black text-slate-400 font-mono">
                    {periodIdx + 1}주기
                  </div>

                  {/* 8 Columns Slots */}
                  <div className="grid grid-cols-8 gap-1.5 sm:gap-2 flex-1 h-full">
                    {row.map((slot, colIdx) => {
                      if (slot.elementNumber === null) {
                        return (
                          <div
                            key={`empty_${periodIdx}_${colIdx}`}
                            className="rounded-xl bg-slate-950/30 border border-dashed border-slate-800/40 h-full"
                          />
                        );
                      }

                      const atomicNum = slot.elementNumber;
                      const correctElem = ELEMENTS_20.find((e) => e.number === atomicNum)!;
                      const placedSym = placedSlots[atomicNum];
                      const isCorrect = placedSym === correctElem.symbol;
                      const isWrong = placedSym && !isCorrect;
                      const isShaking = shakeSlot === atomicNum;

                      return (
                        <button
                          key={`slot_${atomicNum}`}
                          onClick={() => handleSlotClick(atomicNum)}
                          className={`relative rounded-xl border flex flex-col items-center justify-center p-1 transition-all select-none h-full cursor-pointer ${
                            isCorrect
                              ? 'bg-gradient-to-tr from-teal-950/90 to-emerald-950/90 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950'
                              : isWrong
                              ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                              : selectedSymbol
                              ? 'bg-slate-800/90 hover:bg-cyan-950/80 border-cyan-500/80 hover:border-cyan-300 shadow-md'
                              : 'bg-slate-800/50 border-slate-700/70 text-slate-400'
                          } ${isShaking ? 'animate-shake' : ''}`}
                        >
                          {/* Atomic Number Badge */}
                          <span className="absolute top-1 left-1.5 text-[10px] sm:text-xs font-mono text-slate-400 font-black">
                            {atomicNum}
                          </span>

                          {/* Placed Symbol or Placeholder */}
                          {placedSym ? (
                            <div className="flex flex-col items-center justify-center mt-1">
                              <span className="text-xl sm:text-2xl font-black font-mono leading-none">
                                {placedSym}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold mt-0.5 leading-none">
                                {isCorrect ? correctElem.name : '오답(취소)'}
                              </span>
                              {isCorrect ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 absolute top-1 right-1" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5 text-rose-400 absolute top-1 right-1 animate-spin-slow" />
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center mt-1 opacity-60">
                              <span className="text-base sm:text-lg font-black text-slate-500 font-mono leading-none">?</span>
                              <span className="text-[10px] sm:text-xs font-bold text-slate-400 leading-none mt-0.5">
                                {correctElem.name}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-bold text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> 정답 배치 (+10점)
                </span>
                <span className="flex items-center gap-1 font-bold text-rose-300">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> 오배치 (클릭하여 취소 회수 가능, -1점)
                </span>
              </div>
              <span className="font-bold text-slate-300">
                1~4주기 8개 주요 족
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Compact Status Footer */}
      <div className="text-center text-xs text-slate-400 py-0.5 shrink-0">
        <span>정답 +10점</span> • <span>오답 감점 -1점</span> • <span>1분 이내 완성 시 +50점 보너스</span> • <span>3분 경과 시 자동 다음 단계</span>
      </div>

    </div>
  );
};
