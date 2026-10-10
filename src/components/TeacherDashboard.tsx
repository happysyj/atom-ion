import React, { useState, useEffect } from 'react';
import {
  Lock,
  Download,
  RefreshCw,
  Search,
  ExternalLink,
  Code,
  Check,
  Copy,
  AlertCircle,
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  Trash2,
  Settings,
  Save,
  HelpCircle,
  Info,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudentRecord } from '../types';
import {
  getRecordsFromGAS,
  getActiveWebAppUrl,
  setActiveWebAppUrl,
  GAS_SCRIPT_CODE_TEMPLATE,
  saveLocalRecord,
} from '../utils/gasService';
import { googleSignIn, initAuth, logout } from '../services/googleAuth';
import { createGoogleSpreadsheetWithRecords } from '../services/googleSheetsApi';
import { User } from 'firebase/auth';

interface TeacherDashboardProps {
  onBackToApp: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [gasUrlInput, setGasUrlInput] = useState(getActiveWebAppUrl());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Google OAuth User State (from Firebase Auth)
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [showDomainGuide, setShowDomainGuide] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isGitHubPages = currentHostname.endsWith('github.io');

  useEffect(() => {
    initAuth((user) => {
      setGoogleUser(user);
    });
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === '140115') {
      setIsAuthenticated(true);
      setAuthError('');
      loadData();
    } else {
      setAuthError('비밀번호가 올바르지 않습니다. 다시 확인해주세요.');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await getRecordsFromGAS();
      setRecords(res.records);
      if (res.fromFirestore) {
        setStatusMessage('클라우드 데이터베이스(Firebase Firestore)에서 실시간 학생 성적을 동기화했습니다.');
      } else if (res.fromGAS) {
        setStatusMessage('Google Apps Script(스프레드시트)에서 최신 데이터를 동기화했습니다.');
      } else {
        setStatusMessage('로컬 브라우저 저장소의 성적 데이터를 불러왔습니다.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGasUrl = () => {
    setActiveWebAppUrl(gasUrlInput);
    setShowSettingsModal(false);
    loadData();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE_TEMPLATE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGoogleLogin = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    setGoogleAuthError(null);
    setAuthErrorCode(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        setShowDomainGuide(false);
      }
    } catch (err: any) {
      const errorCode = err?.code || '';
      setAuthErrorCode(errorCode);
      if (errorCode === 'auth/unauthorized-domain') {
        setGoogleAuthError(
          `현재 배포 주소(${currentHostname || 'github.io'})가 Firebase 승인 도메인(Authorized Domain)에 등록되지 않았습니다.`
        );
        setShowDomainGuide(true);
      } else if (errorCode === 'auth/popup-blocked') {
        setGoogleAuthError('브라우저에서 팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.');
      } else if (
        errorCode !== 'auth/popup-closed-by-user' &&
        errorCode !== 'auth/cancelled-popup-request'
      ) {
        setGoogleAuthError('Google 로그인 중 오류가 발생했습니다. 아래 도메인 설정 또는 대체 방법을 확인해주세요.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setExportUrl(null);
    setGoogleAuthError(null);
  };

  const handleExportToGoogleSheets = async () => {
    if (!googleUser) {
      await handleGoogleLogin();
      return;
    }

    setIsGoogleLoading(true);
    setGoogleAuthError(null);
    try {
      const title = `[과학3] 원소기호&이온식 성적표_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '')}`;
      const res = await createGoogleSpreadsheetWithRecords(title, records);
      setExportUrl(res.spreadsheetUrl);
    } catch (err: unknown) {
      setGoogleAuthError((err as Error).message || '스프레드시트 내보내기에 실패했습니다.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (records.length === 0) {
      setStatusMessage('다운로드할 성적 기록이 없습니다.');
      return;
    }

    // CSV format with UTF-8 BOM so Korean text displays properly in MS Excel
    const header = '순위,기록일시,학생 닉네임,최종 점수,소요 시간(초)\n';
    const rows = sortedRecords
      .map((r, i) => `${i + 1},"${r.date || '-'}",${r.name},${r.score},${r.time}`)
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `화학퀴즈_학생성적_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ranking sort
  const sortedRecords = [...records].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.time - b.time;
  });

  const filteredRecords = sortedRecords.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const averageScore =
    records.length > 0 ? Math.round(records.reduce((acc, cur) => acc + cur.score, 0) / records.length) : 0;
  const maxScore = records.length > 0 ? Math.max(...records.map((r) => r.score)) : 0;

  // --- Password Gate Screen ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-700/60 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white mb-1">교사용 관리자 페이지</h2>
          <p className="text-xs text-slate-400 mb-6">
            학생들의 퀴즈 참여 기록 및 스프레드시트 연동을 관리합니다.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                관리자 비밀번호
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="관리자 비밀번호를 입력하세요"
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-center tracking-widest text-lg font-mono"
                autoFocus
              />
              {authError && (
                <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              인증 및 관리자 페이지 접속
            </button>
          </form>

          <button
            onClick={onBackToApp}
            className="mt-4 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 학생 퀴즈 화면으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // --- Main Teacher Dashboard ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="학생 퀴즈 화면으로 이동"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>교사용 학생 성적 관리 대시보드</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              전체 학생 기록 실시간 조회 및 Google Sheets / CSV 내보내기
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>GAS URL 설정</span>
          </button>

          <button
            onClick={() => setShowCodeModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Code className="w-4 h-4 text-teal-400" />
            <span>GAS 스크립트 코드</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>CSV 엑셀 다운로드</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400">총 응시자 수</span>
          <div className="text-2xl font-black text-white mt-1">{records.length}명</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400">전체 최고 점수</span>
          <div className="text-2xl font-black text-amber-300 mt-1">{maxScore}점</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400">평균 점수</span>
          <div className="text-2xl font-black text-cyan-300 mt-1">{averageScore}점</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400">데이터베이스 연동</span>
          <div className="text-xs font-semibold text-emerald-400 mt-2 truncate flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>클라우드 DB (Firestore)</span>
          </div>
        </div>
      </div>

      {/* Google Sheets Direct OAuth Integration Card (Selected Element) */}
      <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-800/40 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                <span>Google Sheets 원클릭 연동 및 내보내기</span>
                {googleUser ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-700 font-normal">
                    {googleUser.email} 연결됨
                  </span>
                ) : isGitHubPages ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700 font-medium flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    GitHub Pages 배포 환경
                  </span>
                ) : null}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                선생님의 Google 계정으로 로그인하여 내 Google 드라이브에 학생 성적 스프레드시트를 자동으로 생성할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {googleUser ? (
              <>
                <button
                  onClick={handleExportToGoogleSheets}
                  disabled={isGoogleLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  <span>새 구글 시트로 내보내기</span>
                </button>

                <button
                  onClick={handleGoogleLogout}
                  className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 shadow cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google 계정으로 로그인</span>
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Google 로그인 없이도 즉시 성적 파일을 다운로드할 수 있습니다"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>로그인 없이 CSV 다운로드</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowDomainGuide((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="GitHub 배포 시 구글 로그인 설정 방법 안내"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">도메인 안내</span>
              {showDomainGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {exportUrl && (
              <a
                href={exportUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>생성된 시트 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* GitHub Pages & Domain Guide Toggle Box */}
        {showDomainGuide && (
          <div className="mt-4 pt-4 border-t border-emerald-800/40 text-xs text-slate-300 space-y-2.5 bg-slate-950/40 p-4 rounded-xl">
            <div className="flex items-start gap-2 text-amber-300 font-semibold">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>GitHub Pages 배포 사이트에서 Google 로그인 오류가 발생하는 원인 & 해결 방법</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-6">
              Google 및 Firebase Authentication은 보안 정책상 <strong className="text-white">사전에 승인된 도메인(Authorized Domains)</strong>에서만 OAuth 팝업 로그인을 허용합니다.
              GitHub Pages 주소(<code className="text-cyan-300 bg-slate-800 px-1.5 py-0.5 rounded">{currentHostname || 'github.io'}</code>)를 Firebase 콘솔에 등록해야 정상 작동합니다.
            </p>

            <div className="pl-6 bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>🔧 Firebase 콘솔에서 30초 만에 도메인 등록하는 방법:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Firebase 콘솔 (console.firebase.google.com)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  에 접속하여 해당 프로젝트를 선택합니다.
                </li>
                <li>
                  좌측 메뉴의 <strong className="text-white">빌드(Build) → Authentication → 설정(Settings)</strong> 탭으로 이동합니다.
                </li>
                <li>
                  <strong className="text-white">승인된 도메인(Authorized domains)</strong> 목록에서 <strong className="text-emerald-400">[도메인 추가]</strong>를 클릭합니다.
                </li>
                <li>
                  도메인 입력창에 <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">github.io</code> (또는 본인의 <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">{currentHostname}</code>)를 입력하고 저장합니다.
                </li>
                <li>설정 후 본 페이지를 새로고침하시면 Google 로그인이 즉시 정상 동작합니다!</li>
              </ol>
            </div>

            <div className="pl-6 text-emerald-300 flex items-center gap-1.5 pt-1">
              <span>✨ <strong>로그인 설정 없이 바로 사용하는 방법:</strong></span>
              <span className="text-slate-300">우측 상단의 <strong>[CSV 엑셀 다운로드]</strong> 버튼이나 상단의 <strong>[GAS URL 설정]</strong>을 이용하시면 도메인 등록 없이도 학생 성적을 온전히 저장하고 엑셀로 관리하실 수 있습니다.</span>
            </div>
          </div>
        )}
      </div>

      {googleAuthError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{googleAuthError}</span>
            </div>
            <button
              onClick={() => setGoogleAuthError(null)}
              className="text-xs text-rose-400 hover:text-white underline ml-3 cursor-pointer shrink-0"
            >
              닫기
            </button>
          </div>

          {authErrorCode === 'auth/unauthorized-domain' && (
            <div className="pl-6 text-slate-300 space-y-1.5">
              <p>
                현재 주소(<code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">{currentHostname}</code>)가 Firebase 승인 도메인 목록에 없어서 발생한 보안 오류입니다.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setShowDomainGuide(true)}
                  className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  📖 도메인 등록 해결 가이드 열기
                </button>
                <button
                  onClick={handleDownloadCsv}
                  className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700 text-emerald-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>로그인 없이 CSV로 즉시 다운로드</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Records Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 닉네임 검색..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="text-xs text-slate-400">
            조회된 기록: <span className="text-cyan-300 font-bold">{filteredRecords.length}</span>개
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">순위</th>
                <th className="py-3 px-3">기록 일시</th>
                <th className="py-3 px-3">학생 닉네임</th>
                <th className="py-3 px-3">최종 점수</th>
                <th className="py-3 px-3">소요 시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>학생 기록 불러오는 중...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    등록된 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, index) => {
                  const rank = index + 1;
                  return (
                    <tr key={rec.id || index} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-bold font-mono text-[11px] ${
                            rank === 1
                              ? 'bg-amber-400 text-slate-950'
                              : rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{rec.date || '-'}</td>
                      <td className="py-3 px-3 font-bold text-slate-200">{rec.name}</td>
                      <td className="py-3 px-3 text-amber-300 font-mono font-bold text-sm">
                        {rec.score}점
                      </td>
                      <td className="py-3 px-3 text-cyan-300 font-mono">
                        {Math.floor(rec.time / 60)}분 {rec.time % 60}초
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Template Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-teal-400" />
                <span>Google Apps Script 백엔드 코드 가이드</span>
              </h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                닫기
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Google 스프레드시트의 <strong>[확장 프로그램] → [Apps Script]</strong>에 아래 코드를
              복사하여 붙여넣은 후, 웹 앱으로 배포하세요.
            </p>

            <div className="relative flex-1 overflow-hidden bg-slate-950 border border-slate-800 rounded-xl mb-4">
              <button
                onClick={handleCopyCode}
                className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '복사 완료!' : '코드 복사'}</span>
              </button>
              <pre className="p-4 text-[11px] font-mono text-teal-300 h-80 overflow-y-auto leading-relaxed select-all">
                {GAS_SCRIPT_CODE_TEMPLATE}
              </pre>
            </div>

            <div className="text-right">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (GAS URL Configuration) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>Google Apps Script 웹 앱 URL 설정</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              스프레드시트에서 새로 배포한 웹 앱 URL(https://script.google.com/macros/s/.../exec)을
              입력하세요.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Web App URL
                </label>
                <input
                  type="text"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveGasUrl}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>저장 및 적용</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
