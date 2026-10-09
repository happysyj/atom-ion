import React, { useState, useEffect, useRef } from 'react';
import { ALL_28_IONS, IonData } from '../data/chemistryData';
import { audioEngine } from '../utils/audioEngine';
import { CheckCircle2, Zap, Sparkles, Filter } from 'lucide-react';
import { StageScoreDetail } from '../types';

interface Stage3Props {
  onStageComplete: (scoreDetail: StageScoreDetail) => void;
  onScoreUpdate: (delta: number) => void;
  stageTimer: number;
}

interface IonCard {
  id: string;
  ionId: string;
  type: 'formula' | 'name';
  htmlText: string;
  plainText: string;
  ionType: 'cation' | 'anion';
  matched: boolean;
}

export const Stage3IonMatch: React.FC<Stage3Props> = ({
  onStageComplete,
  onScoreUpdate,
  stageTimer,
}) => {
  const [formulaCards, setFormulaCards] = useState<IonCard[]>([]);
  const [nameCards, setNameCards] = useState<IonCard[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<IonCard | null>(null);
  const [selectedName, setSelectedName] = useState<IonCard | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'cation' | 'anion'>('all');

  const completedRef = useRef(false);
  const totalPairs = ALL_28_IONS.length; // 28 pairs

  useEffect(() => {
    const formulas: IonCard[] = ALL_28_IONS.map((ion) => ({
      id: `form_${ion.id}`,
      ionId: ion.id,
      type: 'formula',
      htmlText: ion.htmlFormula,
      plainText: ion.formula,
      ionType: ion.type,
      matched: false,
    }));

    const names: IonCard[] = ALL_28_IONS.map((ion) => ({
      id: `name_${ion.id}`,
      ionId: ion.id,
      type: 'name',
      htmlText: ion.name,
      plainText: ion.name,
      ionType: ion.type,
      matched: false,
    }));

    // 화학식 카드는 무작위 배열, 이온 이름 카드는 가나다 순으로 정렬
    setFormulaCards([...formulas].sort(() => Math.random() - 0.5));
    setNameCards([...names].sort((a, b) => a.plainText.localeCompare(b.plainText, 'ko')));
  }, []);

  const handleFinish = (isTimeout: boolean = false, recordedTime?: number) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const finalTime = recordedTime !== undefined ? recordedTime : stageTimer;
    const isFullyCompleted = matchedCount === totalPairs;
    // 3단계: 2분 30초(150초) 이내에 완성 시 보너스 50점
    const earnedBonus = !isTimeout && isFullyCompleted && finalTime <= 150 ? 50 : 0;

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

  // 4분(240초) 자동 이동 (28개 문항이므로 충분한 시간 부여)
  useEffect(() => {
    if (stageTimer >= 240 && !completedRef.current) {
      handleFinish(true);
    }
  }, [stageTimer]);

  const showFeedbackMsg = (text: string, color: string) => {
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 800);
  };

  // Evaluate matching pair
  useEffect(() => {
    if (!selectedFormula || !selectedName) return;

    if (selectedFormula.ionId === selectedName.ionId) {
      // Correct match!
      audioEngine.playCorrect();
      onScoreUpdate(10);
      showFeedbackMsg('+10점', 'text-teal-300');

      setFormulaCards((prev) =>
        prev.map((c) => (c.id === selectedFormula.id ? { ...c, matched: true } : c))
      );
      setNameCards((prev) =>
        prev.map((c) => (c.id === selectedName.id ? { ...c, matched: true } : c))
      );

      const nextCount = matchedCount + 1;
      setMatchedCount(nextCount);
      setSelectedFormula(null);
      setSelectedName(null);

      if (nextCount === totalPairs) {
        const timeTaken = stageTimer;
        setTimeout(() => {
          handleFinish(false, timeTaken);
        }, 500);
      }
    } else {
      // Wrong!
      audioEngine.playWrong();
      onScoreUpdate(-1);
      setPenalties((p) => p + 1);
      showFeedbackMsg('-1점', 'text-rose-400');
      setShakeId(`${selectedFormula.id}_${selectedName.id}`);

      setTimeout(() => {
        setShakeId(null);
        setSelectedFormula(null);
        setSelectedName(null);
      }, 500);
    }
  }, [selectedFormula, selectedName]);

  const handleCardClick = (card: IonCard) => {
    if (card.matched) return;
    audioEngine.playCardSelect();

    if (card.type === 'formula') {
      setSelectedFormula(selectedFormula?.id === card.id ? null : card);
    } else {
      setSelectedName(selectedName?.id === card.id ? null : card);
    }
  };

  const isBonusEligible = stageTimer <= 150;
  const progressPercent = Math.round((matchedCount / totalPairs) * 100);

  const displayedFormulas = formulaCards.filter(
    (c) => filterType === 'all' || c.ionType === filterType
  );
  const displayedNames = nameCards.filter(
    (c) => filterType === 'all' || c.ionType === filterType
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-indigo-800/60 rounded-2xl p-4 mb-3 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs sm:text-sm font-black">
              3단계 게임
            </span>
            <h2 className="text-base sm:text-xl font-bold text-white">
              이온식 화학식 & 이온 이름 매칭 (총 28종)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            화학식 카드(왼쪽)와 이온 이름 카드(오른쪽)를 클릭하여 짝을 맞추세요.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-300">
              진행도: <strong className="text-indigo-300 font-black">{matchedCount}</strong> / {totalPairs} ({progressPercent}%)
            </div>
            <div className="w-32 sm:w-40 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
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

      {/* Filter Tabs to comfortably navigate 28 cards */}
      <div className="flex items-center justify-between mb-3 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 mr-1">보기 필터:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            전체 28종
          </button>
          <button
            onClick={() => setFilterType('cation')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'cation'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            양이온 14종
          </button>
          <button
            onClick={() => setFilterType('anion')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'anion'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            음이온 14종
          </button>
        </div>

        <div className="text-xs text-slate-400">
          표시 중: <strong className="text-white">{displayedFormulas.length}</strong>개
        </div>
      </div>

      {feedback && (
        <div className="fixed top-20 right-6 z-50 animate-bounce pointer-events-none">
          <div className={`px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xl font-black ${feedback.color}`}>
            {feedback.text}
          </div>
        </div>
      )}

      {/* Dual Column Layout: Formulas | Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Left Column: Ion Formulas */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h3 className="text-sm sm:text-base font-black text-indigo-300 flex items-center gap-1.5">
              <span>이온 화학식 카드</span>
              <span className="text-xs text-slate-400 font-normal">(윗첨자/아래첨자)</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {displayedFormulas.filter((c) => !c.matched).length}개 남음
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5 max-h-[58vh] overflow-y-auto pr-1">
            {displayedFormulas.map((card) => {
              const isSelected = selectedFormula?.id === card.id;
              const isShaking = shakeId?.startsWith(card.id);
              // 긴 화학식(예: CH3COO-, MnO4-, HCO3-)이 카드 영역 밖으로 벗어나지 않도록 폰트 크기 조절
              const textLen = card.plainText.length;
              const formulaFontSize =
                textLen >= 7
                  ? 'text-xs sm:text-sm'
                  : textLen >= 5
                  ? 'text-sm sm:text-base'
                  : 'text-base sm:text-xl';

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.matched}
                  className={`relative aspect-[4/3] flex items-center justify-center rounded-xl p-1.5 font-bold transition-all select-none cursor-pointer overflow-hidden ${
                    card.matched
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400/30 cursor-default opacity-40'
                      : isSelected
                      ? 'bg-indigo-500 text-white border-2 border-white shadow-lg shadow-indigo-500/50 scale-105 z-10'
                      : card.ionType === 'cation'
                      ? 'bg-slate-800/95 hover:bg-slate-750 text-indigo-200 border border-indigo-700/60 hover:border-indigo-400 active:scale-95 shadow-sm'
                      : 'bg-slate-800/95 hover:bg-slate-750 text-cyan-200 border border-cyan-700/60 hover:border-cyan-400 active:scale-95 shadow-sm'
                  } ${isShaking ? 'animate-shake bg-rose-900 border-rose-500' : ''}`}
                >
                  <span
                    className={`${formulaFontSize} font-mono font-black tracking-tight text-center leading-none px-1 max-w-full`}
                    dangerouslySetInnerHTML={{ __html: card.htmlText }}
                  />
                  {card.matched && (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Ion Names */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h3 className="text-sm sm:text-base font-black text-teal-300 flex items-center gap-1.5">
              <span>이온 이름 카드</span>
              <span className="text-xs text-slate-400 font-normal">(가나다순 정렬)</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {displayedNames.filter((c) => !c.matched).length}개 남음
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5 max-h-[58vh] overflow-y-auto pr-1">
            {displayedNames.map((card) => {
              const isSelected = selectedName?.id === card.id;
              const isShaking = shakeId?.endsWith(card.id);
              // 긴 이온 이름(예: 과망가니즈산 이온, 탄산수소 이온, 플루오린화 이온)이 카드 영역 밖으로 벗어나지 않도록 폰트 크기 조절
              const textLen = card.plainText.length;
              const nameFontSize =
                textLen >= 8
                  ? 'text-[11px] sm:text-xs'
                  : textLen >= 6
                  ? 'text-xs sm:text-sm'
                  : 'text-xs sm:text-sm md:text-base';

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={card.matched}
                  className={`relative aspect-[4/3] flex flex-col items-center justify-center rounded-xl p-1.5 font-bold transition-all select-none cursor-pointer overflow-hidden ${
                    card.matched
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400/30 cursor-default opacity-40'
                      : isSelected
                      ? 'bg-teal-400 text-slate-950 border-2 border-white shadow-lg shadow-teal-400/50 scale-105 z-10'
                      : 'bg-slate-800/95 hover:bg-slate-750 text-slate-100 border border-teal-700/60 hover:border-teal-400 active:scale-95 shadow-sm'
                  } ${isShaking ? 'animate-shake bg-rose-900 border-rose-500' : ''}`}
                >
                  <span className={`${nameFontSize} font-black text-center leading-tight break-keep px-1 max-w-full`}>
                    {card.plainText}
                  </span>
                  {card.matched && (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="mt-4 text-center text-xs text-slate-400 flex items-center justify-center gap-4">
        <span>정답: +10점</span>
        <span>•</span>
        <span>오답: -1점 감점</span>
        <span>•</span>
        <span>2분 30초 이내 완료: 보너스 +50점</span>
        <span>•</span>
        <span>4분 경과 시: 자동 다음 단계</span>
      </div>
    </div>
  );
};
