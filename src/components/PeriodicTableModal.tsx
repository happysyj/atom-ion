import React, { useState, useEffect } from 'react';
import { ELEMENTS_20, ElementData } from '../data/chemistryData';
import { X, Sparkles, Info, Layers, Beaker, Atom } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface PeriodicTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 8개 주요 족 (1, 2, 13, 14, 15, 16, 17, 18) x 4주기
const PERIODIC_GRID_TEMPLATE: (number | null)[][] = [
  // 1주기: H(1), blank... He(2)
  [1, null, null, null, null, null, null, 2],
  // 2주기: Li(3), Be(4), B(5), C(6), N(7), O(8), F(9), Ne(10)
  [3, 4, 5, 6, 7, 8, 9, 10],
  // 3주기: Na(11), Mg(12), Al(13), Si(14), P(15), S(16), Cl(17), Ar(18)
  [11, 12, 13, 14, 15, 16, 17, 18],
  // 4주기: K(19), Ca(20), blank...
  [19, 20, null, null, null, null, null, null],
];

export const PeriodicTableModal: React.FC<PeriodicTableModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Default selected element: Hydrogen (1)
  const [selectedElement, setSelectedElement] = useState<ElementData>(ELEMENTS_20[0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getCategoryColor = (cat: ElementData['category']) => {
    switch (cat) {
      case 'alkali':
        return {
          bg: 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/60 text-rose-200',
          badge: 'bg-rose-950 text-rose-300 border-rose-700',
          accent: 'text-rose-400',
        };
      case 'alkaline':
        return {
          bg: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/60 text-orange-200',
          badge: 'bg-orange-950 text-orange-300 border-orange-700',
          accent: 'text-orange-400',
        };
      case 'metalloid':
        return {
          bg: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/60 text-amber-200',
          badge: 'bg-amber-950 text-amber-300 border-amber-700',
          accent: 'text-amber-400',
        };
      case 'halogen':
        return {
          bg: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/60 text-emerald-200',
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-700',
          accent: 'text-emerald-400',
        };
      case 'noble':
        return {
          bg: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/60 text-purple-200',
          badge: 'bg-purple-950 text-purple-300 border-purple-700',
          accent: 'text-purple-400',
        };
      default: // nonmetal
        return {
          bg: 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/60 text-cyan-200',
          badge: 'bg-cyan-950 text-cyan-300 border-cyan-700',
          accent: 'text-cyan-400',
        };
    }
  };

  const currentColors = getCategoryColor(selectedElement.category);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-cyan-700/60 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-600/60 text-cyan-400 flex items-center justify-center shadow-sm">
              <Atom className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>학습용 인터랙티브 주기율표 도감</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  원자번호 1~20번
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                원소 카드를 클릭하거나 마우스를 올리면 상세 성질과 과학 핵심 내용을 확인할 수 있습니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="닫기 (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Selected Element Detail Card (Top Showcase for high visibility) */}
        <div className="my-3.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center gap-4 shadow-inner">
          {/* Big Symbol Box */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-cyan-400/80 flex flex-col items-center justify-center relative shadow-lg shadow-cyan-950 shrink-0">
            <span className="absolute top-1.5 left-2 text-xs font-mono font-bold text-slate-400">
              #{selectedElement.number}
            </span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-cyan-200 leading-none">
              {selectedElement.symbol}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white mt-1">
              {selectedElement.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedElement.weight}
            </span>
          </div>

          {/* Properties Info */}
          <div className="flex-1 text-center md:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-lg sm:text-xl font-bold text-white">
                {selectedElement.name} ({selectedElement.english})
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${currentColors.badge}`}>
                {selectedElement.categoryKo}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                {selectedElement.period}주기 {selectedElement.group}족
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                상온 상태: {selectedElement.state}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-cyan-100/90 leading-relaxed font-medium">
              💡 {selectedElement.description}
            </p>
          </div>
        </div>

        {/* Interactive Periodic Grid */}
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[560px]">
            {/* Group Headers */}
            <div className="grid grid-cols-8 gap-2 mb-1.5 text-center">
              {['1족', '2족', '13족', '14족', '15족', '16족', '17족', '18족'].map((grp) => (
                <div key={grp} className="text-xs font-bold text-slate-400 uppercase py-0.5">
                  {grp}
                </div>
              ))}
            </div>

            {/* 4 Periods */}
            <div className="space-y-2">
              {PERIODIC_GRID_TEMPLATE.map((row, periodIdx) => (
                <div key={periodIdx} className="flex items-center gap-2">
                  <div className="w-7 shrink-0 text-center text-xs font-bold text-slate-500 font-mono">
                    {periodIdx + 1}주기
                  </div>

                  <div className="grid grid-cols-8 gap-2 flex-1">
                    {row.map((atomicNum, colIdx) => {
                      if (atomicNum === null) {
                        return (
                          <div
                            key={`blank_${periodIdx}_${colIdx}`}
                            className="aspect-square rounded-xl bg-slate-950/20 border border-dashed border-slate-800/40"
                          />
                        );
                      }

                      const el = ELEMENTS_20.find((e) => e.number === atomicNum)!;
                      const isSelected = selectedElement.number === el.number;
                      const colStyles = getCategoryColor(el.category);

                      return (
                        <button
                          key={el.symbol}
                          onMouseEnter={() => setSelectedElement(el)}
                          onClick={() => {
                            audioEngine.playCardSelect();
                            setSelectedElement(el);
                          }}
                          className={`aspect-square relative rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-400 text-slate-950 border-2 border-white shadow-lg shadow-cyan-400/40 scale-105 z-10'
                              : `${colStyles.bg} border shadow-sm hover:scale-105`
                          }`}
                        >
                          <span className={`absolute top-1 left-1.5 text-[10px] font-mono font-bold ${
                            isSelected ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {el.number}
                          </span>
                          <span className={`text-base sm:text-2xl font-black font-mono tracking-tight mt-1 ${
                            isSelected ? 'text-slate-950' : 'text-white'
                          }`}>
                            {el.symbol}
                          </span>
                          <span className={`text-[10px] sm:text-xs font-bold leading-none ${
                            isSelected ? 'text-slate-900' : 'text-slate-300'
                          }`}>
                            {el.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block" /> 비금속
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-400 inline-block" /> 알칼리 금속
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-400 inline-block" /> 알칼리 토금속
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> 준금속
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> 할로젠
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-400 inline-block" /> 비활성 기체
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
