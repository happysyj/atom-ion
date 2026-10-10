import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  RotateCcw,
  Award,
  Zap,
  Sparkles,
  Users,
  CheckCircle2,
  Loader2,
  CloudCheck,
  Share2,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { StageScoreDetail, StudentRecord } from '../types';
import { saveRecordToGAS, getRecordsFromGAS } from '../utils/gasService';

interface ResultScreenProps {
  nickname: string;
  totalScore: number;
  totalTime: number; // in seconds
  stageDetails: {
    stage1?: StageScoreDetail;
    stage2?: StageScoreDetail;
    stage3?: StageScoreDetail;
    stage4?: StageScoreDetail;
  };
  onRestart: () => void;
  onOpenTeacher: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  nickname,
  totalScore,
  totalTime,
  stageDetails,
  onRestart,
  onOpenTeacher,
}) => {
  const [leaderboard, setLeaderboard] = useState<StudentRecord[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{
    saved: boolean;
    loading: boolean;
    message: string;
    fromGAS: boolean;
    fromFirestore?: boolean;
  }>({
    saved: false,
    loading: true,
    message: '성적 데이터를 동기화하는 중입니다...',
    fromGAS: false,
    fromFirestore: false,
  });

  // Calculate guaranteed total score from all 4 stages
  const calculatedScore =
    (stageDetails.stage1 ? Math.max(0, stageDetails.stage1.baseScore - stageDetails.stage1.penalties + stageDetails.stage1.bonus) : 0) +
    (stageDetails.stage2 ? Math.max(0, stageDetails.stage2.baseScore - stageDetails.stage2.penalties + stageDetails.stage2.bonus) : 0) +
    (stageDetails.stage3 ? Math.max(0, stageDetails.stage3.baseScore - stageDetails.stage3.penalties + stageDetails.stage3.bonus) : 0) +
    (stageDetails.stage4 ? Math.max(0, stageDetails.stage4.baseScore - stageDetails.stage4.penalties + stageDetails.stage4.bonus) : 0);
  
  const effectiveTotalScore = Math.max(totalScore, calculatedScore);

  useEffect(() => {
    // 1. Play victory sounds & launch festive confetti
    audioEngine.playVictory();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    } catch {
      // ignore
    }

    // 2. Save record to GAS Web App (or local backup) and refresh Leaderboard
    const handleSaveAndFetch = async () => {
      try {
        setSaveStatus((s) => ({ ...s, loading: true }));
        const saveRes = await saveRecordToGAS({
          name: nickname,
          score: effectiveTotalScore,
          time: totalTime,
        });

        setSaveStatus({
          saved: true,
          loading: false,
          message: saveRes.message,
          fromGAS: saveRes.fromGAS,
          fromFirestore: saveRes.fromFirestore,
        });

        // Fetch latest leaderboard
        setIsLoadingLeaderboard(true);
        const getRes = await getRecordsFromGAS();
        setLeaderboard(getRes.records);
      } catch (err) {
        setSaveStatus({
          saved: true,
          loading: false,
          message: '성적이 로컬 저장소에 안전하게 기록되었습니다.',
          fromGAS: false,
        });
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    handleSaveAndFetch();
  }, [effectiveTotalScore]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? `${m}분 ` : ''}${s}초`;
  };

  // Ranking calculation: 1st by highest score, 2nd by shortest time
  const sortedRecords = [...leaderboard].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.time - b.time;
  });

  const top5Records = sortedRecords.slice(0, 5);

  // Find user rank
  const myRankIndex = sortedRecords.findIndex(
    (r) => r.name === nickname && r.score === totalScore && r.time === totalTime
  );
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : 1;

  // Calculate total bonus earned
  const totalBonus =
    (stageDetails.stage1?.bonus || 0) +
    (stageDetails.stage2?.bonus || 0) +
    (stageDetails.stage3?.bonus || 0) +
    (stageDetails.stage4?.bonus || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {/* Decorative Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Congratulations Card */}
      <div className="bg-slate-900/90 border border-cyan-800/60 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center relative z-10 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
          <Trophy className="w-9 h-9" />
        </div>

        {/* Completion Message as required */}
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-teal-100 to-amber-200 mb-2">
          축하합니다! 원소 기호와 이온식을 모두 마스터했습니다!
        </h1>

        <p className="text-sm sm:text-base text-slate-300 mb-6">
          <strong className="text-teal-300 font-bold">{nickname}</strong> 학생의 화학 입문 퀴즈 결과입니다.
        </p>

        {/* Score & Time Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto mb-6">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
            <span className="text-xs text-slate-400 font-medium block">최종 합계 점수</span>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 mt-1">
              {effectiveTotalScore}<span className="text-base font-bold text-slate-400">점</span>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
            <span className="text-xs text-slate-400 font-medium block">총 소요 시간</span>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 mt-1">
              {formatTime(totalTime)}
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4">
            <span className="text-xs text-slate-400 font-medium block">획득 보너스</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1 flex items-center justify-center gap-1">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>+{totalBonus}점</span>
            </div>
          </div>
        </div>

        {/* Save Status / Loading Indicator */}
        <div className="max-w-md mx-auto mb-8 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-center gap-2">
          {saveStatus.loading ? (
            <>
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="text-slate-300">구글 연동 서버로 성적을 전송하는 중...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">{saveStatus.message}</span>
            </>
          )}
        </div>

        {/* Detailed Stage Breakdown Table */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-8 text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            단계별 상세 점수 내역
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { num: 1, name: '원소 기호 매칭', data: stageDetails.stage1, limit: 60, limitDesc: '1분 이내 (+50점)' },
              { num: 2, name: '주기율표 채우기', data: stageDetails.stage2, limit: 90, limitDesc: '1분 30초 이내 (+50점)' },
              { num: 3, name: '이온식 매칭', data: stageDetails.stage3, limit: 150, limitDesc: '2분 30초 이내 (+50점)' },
              { num: 4, name: '이온식 이름 쓰기', data: stageDetails.stage4, limit: 150, limitDesc: '2분 30초 이내 (+50점)' },
            ].map((st) => (
              <div key={st.num} className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 block">{st.num}단계: {st.name}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">보너스 기준: {st.limitDesc}</span>
                <div className="mt-1.5 space-y-0.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>기본 점수:</span>
                    <span className="font-mono">{st.data?.baseScore ?? 0}점</span>
                  </div>
                  <div className="flex justify-between text-rose-300">
                    <span>오답 감점:</span>
                    <span className="font-mono">-{st.data?.penalties ?? 0}점</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>속도 보너스:</span>
                    <span className="font-mono">+{st.data?.bonus ?? 0}점</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>소요 시간:</span>
                    <span className="font-mono">{formatTime(st.data?.timeSpent ?? 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onRestart}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 도전하기</span>
          </button>

          <button
            onClick={onOpenTeacher}
            className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm sm:text-base border border-slate-700 transition-all cursor-pointer"
          >
            교사용 전체 성적 페이지
          </button>
        </div>
      </div>

      {/* Real-time Top 5 Leaderboard as required */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative z-10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                실시간 상위 5위 리더보드
                {saveStatus.fromFirestore ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-normal">
                    클라우드 DB 동기화됨
                  </span>
                ) : saveStatus.fromGAS ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-normal">
                    스프레드시트 동기화됨
                  </span>
                ) : null}
              </h2>
              <p className="text-xs text-slate-400">
                랭킹 기준: 1순위 높은 점수, 2순위 짧은 소요 시간
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            내 순위: <strong className="text-amber-300 font-bold text-sm">#{myRank}위</strong>
          </div>
        </div>

        {isLoadingLeaderboard ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs">리더보드 불러오는 중...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {top5Records.map((rec, index) => {
              const isCurrentUser = rec.name === nickname && rec.score === totalScore;
              const rank = index + 1;

              return (
                <div
                  key={rec.id || `rank_${index}`}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'bg-cyan-950/50 border-cyan-500/80 shadow-md shadow-cyan-950/40 text-white'
                      : rank === 1
                      ? 'bg-amber-950/30 border-amber-600/60 text-amber-100'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm font-mono shrink-0 shadow-sm ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {rank}
                    </div>

                    <div>
                      <span className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                        {rec.name}
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-700 text-cyan-100 font-bold">
                            나
                          </span>
                        )}
                      </span>
                      {rec.date && (
                        <span className="text-xs text-slate-400 block">{rec.date}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right">
                    <div>
                      <span className="text-lg sm:text-2xl font-black text-amber-300 font-mono">
                        {rec.score}점
                      </span>
                    </div>
                    <div className="w-24 text-xs sm:text-sm text-slate-300 font-mono font-bold flex items-center justify-end gap-1">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{formatTime(rec.time)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
