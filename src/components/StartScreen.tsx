import React, { useState } from 'react';
import { Sparkles, Play, ShieldAlert, Award, Clock, BookOpen, Music, CheckCircle2 } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface StartScreenProps {
  onStartGame: (nickname: string) => void;
  onOpenTeacher: () => void;
  initialNickname?: string;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  onOpenTeacher,
  initialNickname = '',
}) => {
  const [nickname, setNickname] = useState(initialNickname);
  const [error, setError] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('닉네임을 입력해주세요 (예: 3반15번김화학)');
      return;
    }
    if (trimmed.length > 12) {
      setError('닉네임은 12글자 이하로 입력해주세요.');
      return;
    }
    setError('');
    audioEngine.playCorrect();
    onStartGame(trimmed);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-cyan-950/40">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Main Hero Card */}
        <div className="bg-slate-900/90 border border-cyan-800/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-600/50 text-cyan-300 text-xs sm:text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>중학교 3학년 과학 필수 화학 언어</span>
          </div>

          {/* Core Greeting Phrase as required */}
          <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-100 to-sky-300 tracking-tight mb-4 leading-tight">
            여러분을 화학 입문의 세계로 초대합니다.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
            원소 기호 20종과 주요 이온식을 4단계 인터랙티브 퀴즈로 재미있게 마스터하세요!
            빠르고 정확하게 해결하여 보너스 점수와 명예의 전당 1위를 차지해보세요.
          </p>

          {/* Nickname Form */}
          <form onSubmit={handleStart} className="max-w-md mx-auto space-y-4">
            <div className="text-left">
              <label htmlFor="nickname" className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                도전자 닉네임 입력 (이름 또는 학번)
              </label>
              <div className="relative">
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="예: 30105 홍길동"
                  maxLength={12}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-800/90 border border-cyan-700/60 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-slate-500 text-base font-medium transition-all outline-none"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> {error}
                </p>
              )}
            </div>

            {/* Start Button */}
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 active:scale-[0.99] text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950 transition-transform group-hover:scale-110" />
              <span>학습 시작 (1단계로)</span>
            </button>
          </form>

          {/* Teacher Page Link */}
          <div className="mt-7 pt-5 border-t border-slate-800 flex items-center justify-center gap-4 text-sm">
            <span className="text-slate-400">선생님이신가요?</span>
            <button
              onClick={onOpenTeacher}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 transition-colors cursor-pointer"
            >
              교사 관리자 페이지 입장
            </button>
          </div>
        </div>

        {/* 4-Stage Rule Preview Card */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-cyan-900/70 text-cyan-300 font-black flex items-center justify-center text-base shrink-0 border border-cyan-700/50">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                1단계: 원소 기호 카드 매칭
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                20가지 원소 기호(H~Ca)와 한글 이름 매칭 (+10점, 오답 -1점).
              </p>
              <span className="inline-block mt-1 text-xs text-amber-300 font-bold">
                ⚡ 1분 이내 완성 시 보너스 50점
              </span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-teal-900/70 text-teal-300 font-black flex items-center justify-center text-base shrink-0 border border-teal-700/50">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                2단계: 주기율표 빈 칸 채우기
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                무작위 카드를 클릭 후 주기율표 슬롯에 배치 (취소 가능, 오배치 -1점).
              </p>
              <span className="inline-block mt-1 text-xs text-amber-300 font-bold">
                ⚡ 1분 30초 이내 완성 시 보너스 50점
              </span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-indigo-900/70 text-indigo-300 font-black flex items-center justify-center text-base shrink-0 border border-indigo-700/50">
              3
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                3단계: 이온식 화학식 매칭
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                양이온과 음이온 28종의 화학식 카드와 이온 이름 카드 매칭.
              </p>
              <span className="inline-block mt-1 text-xs text-amber-300 font-bold">
                ⚡ 2분 30초 이내 완성 시 보너스 50점
              </span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl bg-purple-900/70 text-purple-300 font-black flex items-center justify-center text-base shrink-0 border border-purple-700/50">
              4
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                4단계: 이온식 이름 적기
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                이온 화학식을 보고 '이온' 앞 이름만 빠르게 입력하기 (28종).
              </p>
              <span className="inline-block mt-1 text-xs text-amber-300 font-bold">
                ⚡ 2분 30초 이내 완성 시 보너스 50점
              </span>
            </div>
          </div>
        </div>

        {/* Ambient Music & Limit Guide */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-2">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>단계마다 집중을 돕는 밝은 테마 음악이 흐릅니다.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>단계별 3분 초과 시 자동으로 다음 단계로 이동합니다.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
