/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameStage, StageScoreDetail } from './types';
import { Navbar } from './components/Navbar';
import { StartScreen } from './components/StartScreen';
import { Stage1ElementMatch } from './components/Stage1ElementMatch';
import { Stage2PeriodicTable } from './components/Stage2PeriodicTable';
import { Stage3IonMatch } from './components/Stage3IonMatch';
import { Stage4IonInput } from './components/Stage4IonInput';
import { ResultScreen } from './components/ResultScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PeriodicTableModal } from './components/PeriodicTableModal';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  const [stage, setStage] = useState<GameStage>('start');
  const [nickname, setNickname] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [isPeriodicModalOpen, setIsPeriodicModalOpen] = useState(false);

  // Stage timer (in seconds)
  const [stageTimer, setStageTimer] = useState(0);
  // Total cumulative time spent playing (in seconds)
  const [totalTime, setTotalTime] = useState(0);

  // Detailed scores per stage
  const [stageDetails, setStageDetails] = useState<{
    stage1?: StageScoreDetail;
    stage2?: StageScoreDetail;
    stage3?: StageScoreDetail;
    stage4?: StageScoreDetail;
  }>({});

  const timerRef = useRef<number | null>(null);

  // Manage stage BGM
  useEffect(() => {
    if (stage === 'stage1') {
      audioEngine.startStageBgm(1);
    } else if (stage === 'stage2') {
      audioEngine.startStageBgm(2);
    } else if (stage === 'stage3') {
      audioEngine.startStageBgm(3);
    } else if (stage === 'stage4') {
      audioEngine.startStageBgm(4);
    } else {
      audioEngine.stopBgm();
    }
  }, [stage]);

  // Manage timer ticker for playing stages
  useEffect(() => {
    const isPlaying = ['stage1', 'stage2', 'stage3', 'stage4'].includes(stage);

    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setStageTimer((prev) => prev + 1);
        setTotalTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stage]);

  const handleStartGame = (userNickname: string) => {
    setNickname(userNickname);
    setTotalScore(0);
    setTotalTime(0);
    setStageTimer(0);
    setStageDetails({});
    setStage('stage1');
  };

  const handleScoreUpdate = (delta: number) => {
    setTotalScore((prev) => Math.max(0, prev + delta));
  };

  const computeTotalScore = (details: typeof stageDetails) => {
    const s1 = details.stage1 ? Math.max(0, details.stage1.baseScore - details.stage1.penalties + details.stage1.bonus) : 0;
    const s2 = details.stage2 ? Math.max(0, details.stage2.baseScore - details.stage2.penalties + details.stage2.bonus) : 0;
    const s3 = details.stage3 ? Math.max(0, details.stage3.baseScore - details.stage3.penalties + details.stage3.bonus) : 0;
    const s4 = details.stage4 ? Math.max(0, details.stage4.baseScore - details.stage4.penalties + details.stage4.bonus) : 0;
    return s1 + s2 + s3 + s4;
  };

  const handleStage1Complete = (detail: StageScoreDetail) => {
    setStageDetails((prev) => {
      const next = { ...prev, stage1: detail };
      setTotalScore(computeTotalScore(next));
      return next;
    });
    setStageTimer(0);
    setStage('stage2');
  };

  const handleStage2Complete = (detail: StageScoreDetail) => {
    setStageDetails((prev) => {
      const next = { ...prev, stage2: detail };
      setTotalScore(computeTotalScore(next));
      return next;
    });
    setStageTimer(0);
    setStage('stage3');
  };

  const handleStage3Complete = (detail: StageScoreDetail) => {
    setStageDetails((prev) => {
      const next = { ...prev, stage3: detail };
      setTotalScore(computeTotalScore(next));
      return next;
    });
    setStageTimer(0);
    setStage('stage4');
  };

  const handleStage4Complete = (detail: StageScoreDetail) => {
    setStageDetails((prev) => {
      const next = { ...prev, stage4: detail };
      setTotalScore(computeTotalScore(next));
      return next;
    });
    setStageTimer(0);
    setStage('result');
  };

  const handleRestart = () => {
    setTotalScore(0);
    setTotalTime(0);
    setStageTimer(0);
    setStageDetails({});
    setStage('stage1');
  };

  const handleGoHome = () => {
    const isPlaying = ['stage1', 'stage2', 'stage3', 'stage4'].includes(stage);
    if (isPlaying) {
      const ok = window.confirm('진행 중인 퀴즈를 중단하고 첫 화면으로 돌아가시겠습니까?');
      if (!ok) return;
    }
    setStage('start');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <Navbar
        stage={stage}
        nickname={nickname}
        totalScore={totalScore}
        stageTimer={stageTimer}
        maxStageTime={180}
        onGoHome={handleGoHome}
        onOpenTeacher={() => setStage('teacher')}
        onOpenPeriodicTable={() => setIsPeriodicModalOpen(true)}
      />

      {/* Interactive Periodic Table Reference Modal (accessible anytime) */}
      <PeriodicTableModal
        isOpen={isPeriodicModalOpen}
        onClose={() => setIsPeriodicModalOpen(false)}
      />

      {/* Main Content View by Stage */}
      <main className="flex-1 flex flex-col justify-start">
        {stage === 'start' && (
          <StartScreen
            initialNickname={nickname}
            onStartGame={handleStartGame}
            onOpenTeacher={() => setStage('teacher')}
          />
        )}

        {stage === 'stage1' && (
          <Stage1ElementMatch
            stageTimer={stageTimer}
            onScoreUpdate={handleScoreUpdate}
            onStageComplete={handleStage1Complete}
          />
        )}

        {stage === 'stage2' && (
          <Stage2PeriodicTable
            stageTimer={stageTimer}
            onScoreUpdate={handleScoreUpdate}
            onStageComplete={handleStage2Complete}
          />
        )}

        {stage === 'stage3' && (
          <Stage3IonMatch
            stageTimer={stageTimer}
            onScoreUpdate={handleScoreUpdate}
            onStageComplete={handleStage3Complete}
          />
        )}

        {stage === 'stage4' && (
          <Stage4IonInput
            stageTimer={stageTimer}
            onScoreUpdate={handleScoreUpdate}
            onStageComplete={handleStage4Complete}
          />
        )}

        {stage === 'result' && (
          <ResultScreen
            nickname={nickname}
            totalScore={totalScore}
            totalTime={totalTime}
            stageDetails={stageDetails}
            onRestart={handleRestart}
            onOpenTeacher={() => setStage('teacher')}
          />
        )}

        {stage === 'teacher' && (
          <TeacherDashboard onBackToApp={() => setStage('start')} />
        )}
      </main>
    </div>
  );
}
