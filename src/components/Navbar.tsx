import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Atom, ArrowLeft, Trophy, Clock, BookOpen } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { GameStage } from '../types';

interface NavbarProps {
  stage: GameStage;
  nickname: string;
  totalScore: number;
  stageTimer: number; // in seconds
  maxStageTime?: number; // default 180s (3 minutes)
  onGoHome: () => void;
  onOpenTeacher: () => void;
  onOpenPeriodicTable: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stage,
  nickname,
  totalScore,
  stageTimer,
  maxStageTime = 180,
  onGoHome,
  onOpenTeacher,
  onOpenPeriodicTable,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [scorePulse, setScorePulse] = useState(false);

  useEffect(() => {
    setScorePulse(true);
    const t = setTimeout(() => setScorePulse(false), 300);
    return () => clearTimeout(t);
  }, [totalScore]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
      audioEngine.setMuted(false);
    }
    audioEngine.setVolume(val);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStageName = () => {
    switch (stage) {
      case 'stage1':
        return '1단계: 원소 기호 매칭';
      case 'stage2':
        return '2단계: 주기율표 채우기';
      case 'stage3':
        return '3단계: 이온식 매칭';
      case 'stage4':
        return '4단계: 이온식 이름 작성';
      case 'result':
        return '최종 성적 결과';
      case 'teacher':
        return '교사용 관리 페이지';
      default:
        return '화학 입문 퀴즈';
    }
  };

  const isPlayingStage = ['stage1', 'stage2', 'stage3', 'stage4'].includes(stage);
  const timeLeft = Math.max(0, maxStageTime - stageTimer);
  const isTimeWarning = isPlayingStage && timeLeft <= 30;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-cyan-800/50 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Left: Logo & Stage Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {stage !== 'start' ? (
            <button
              onClick={onGoHome}
              title="첫 화면으로 돌아가기"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          ) : null}

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-md shadow-cyan-500/25">
              <Atom className="w-6 h-6 text-slate-950 font-black animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-cyan-200">
                  원소기호 & 이온식 마스터
                </span>
                {isPlayingStage && (
                  <span className="hidden md:inline-block px-2.5 py-0.5 text-xs rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                    {getStageName()}
                  </span>
                )}
              </div>
              {nickname && (
                <p className="text-xs sm:text-sm text-slate-300">
                  도전자: <strong className="text-teal-300 font-bold">{nickname}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Stage Timer (when in game) */}
        {isPlayingStage && (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                isTimeWarning
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title="단계별 제한 시간 (3분 경과 시 자동 다음 단계로 이동)"
            >
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs sm:text-sm font-mono font-bold">
                <span className="text-cyan-200 text-sm sm:text-base">{formatTime(stageTimer)}</span>
                <span className="text-slate-400 font-normal"> / {formatTime(maxStageTime)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Reference Periodic Table Button + Score & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Interactive Periodic Table Reference Button */}
          <button
            onClick={onOpenPeriodicTable}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-teal-900/80 to-cyan-900/80 hover:from-teal-800 hover:to-cyan-800 border border-cyan-600/70 text-cyan-200 hover:text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition-all cursor-pointer active:scale-95"
            title="언제든 주기율표 원소 정보를 확인하세요"
          >
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="hidden xs:inline">주기율표 참고</span>
            <span className="xs:hidden">도감</span>
          </button>

          {/* Current Score Display */}
          {isPlayingStage && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border border-amber-500/50 text-amber-300 transition-transform ${
                scorePulse ? 'scale-110' : 'scale-100'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-right">
                <span className="text-[10px] block leading-none text-amber-400 font-bold">점수</span>
                <span className="text-base sm:text-xl font-black font-mono tracking-tight">{totalScore}점</span>
              </div>
            </div>
          )}

          {/* Audio Controls */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1.5 rounded-xl border border-slate-700">
            <button
              onClick={toggleMute}
              className="p-1 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-10 sm:w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="배경음악 및 효과음 볼륨 조절"
            />
          </div>

          {/* Teacher Page Quick Link on start screen */}
          {stage === 'start' && (
            <button
              onClick={onOpenTeacher}
              className="px-3 py-2 text-xs sm:text-sm font-bold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              교사 페이지
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

