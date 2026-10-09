/**
 * =========================================================================
 * [Google Apps Script Web App 연동 설정]
 * 배포한 Google Apps Script 웹 앱 URL을 아래 변수에 입력하세요.
 * (교사용 대시보드 화면에서도 실시간으로 설정 및 변경할 수 있습니다.)
 * =========================================================================
 */
export const WEB_APP_URL = "여기에_웹앱_URL_입력";

import { StudentRecord } from '../types';

const STORAGE_KEY = 'CHEMISTRY_QUIZ_RECORDS';
const CUSTOM_URL_KEY = 'CHEMISTRY_QUIZ_CUSTOM_GAS_URL';

// 초기 데모/테스트용 학생 데이터 (URL이 비어있거나 오프라인일 때 리더보드에 표시)
const INITIAL_DEMO_RECORDS: StudentRecord[] = [
  { id: '1', name: '화학영재민준', score: 380, time: 142, date: '2026-10-09 10:15' },
  { id: '2', name: '원소마스터서연', score: 370, time: 155, date: '2026-10-09 11:20' },
  { id: '3', name: '이온박사도윤', score: 350, time: 168, date: '2026-10-09 13:05' },
  { id: '4', name: '주기율표지우', score: 340, time: 190, date: '2026-10-09 14:40' },
  { id: '5', name: '사이언스하은', score: 320, time: 210, date: '2026-10-09 15:30' },
  { id: '6', name: '케미스트리준호', score: 290, time: 235, date: '2026-10-09 16:10' },
];

export function getActiveWebAppUrl(): string {
  const customUrl = localStorage.getItem(CUSTOM_URL_KEY);
  if (customUrl && customUrl.trim() !== '') {
    return customUrl.trim();
  }
  return WEB_APP_URL.trim();
}

export function setActiveWebAppUrl(url: string): void {
  localStorage.setItem(CUSTOM_URL_KEY, url.trim());
}

// 로컬스토리지 백업 데이터 로드
export function getLocalRecords(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_RECORDS));
      return INITIAL_DEMO_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_RECORDS;
  } catch {
    return INITIAL_DEMO_RECORDS;
  }
}

// 로컬스토리지 백업 데이터 저장
export function saveLocalRecord(record: StudentRecord): StudentRecord[] {
  const records = getLocalRecords();
  const newRecords = [record, ...records];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  } catch {
    // quota exceeded fallback
  }
  return newRecords;
}

/**
 * Google Apps Script Web App에 성적 기록 저장
 * 전송 포맷: { action: "save", name: "이름", score: 점수, time: 시간 }
 */
export async function saveRecordToGAS(record: {
  name: string;
  score: number;
  time: number;
  date?: string;
}): Promise<{ success: boolean; message: string; fromGAS: boolean }> {
  const targetUrl = getActiveWebAppUrl();
  const recordWithMeta: StudentRecord = {
    id: 'rec_' + Date.now(),
    name: record.name,
    score: record.score,
    time: record.time,
    date: record.date || new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  // 항상 로컬에도 안전하게 백업 저장
  saveLocalRecord(recordWithMeta);

  // GAS URL이 유효하지 않으면 로컬 저장으로 성공 처리
  if (!targetUrl || targetUrl === '여기에_웹앱_URL_입력' || !targetUrl.startsWith('http')) {
    return {
      success: true,
      message: '로컬 브라우저 저장소에 성공적으로 저장되었습니다. (GAS 연동 URL이 설정되면 실시간 스프레드시트로도 동기화됩니다.)',
      fromGAS: false,
    };
  }

  try {
    const payload = {
      action: 'save',
      name: record.name,
      score: record.score,
      time: record.time,
      date: recordWithMeta.date,
    };

    // Apps Script의 CORS 제약을 방지하기 위해 mode: 'no-cors' 또는 standard POST
    // 일반적으로 웹앱은 Content-Type text/plain으로 전송할 때 프리플라이트 문제 없이 잘 수신함
    await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Google Apps Script (스프레드시트)에 점수가 성공적으로 전송되었습니다!',
      fromGAS: true,
    };
  } catch (err) {
    console.warn('GAS Save failed, using local backup:', err);
    return {
      success: true,
      message: '로컬에 안전하게 저장되었습니다. (네트워크 상태 또는 GAS 배포 설정을 확인해주세요)',
      fromGAS: false,
    };
  }
}

/**
 * Google Apps Script Web App으로부터 전체 기록 불러오기
 * 요청 포맷: { action: "get" } 또는 GET 파라미터 ?action=get
 */
export async function getRecordsFromGAS(): Promise<{
  records: StudentRecord[];
  fromGAS: boolean;
  message?: string;
}> {
  const targetUrl = getActiveWebAppUrl();

  if (!targetUrl || targetUrl === '여기에_웹앱_URL_입력' || !targetUrl.startsWith('http')) {
    return {
      records: getLocalRecords(),
      fromGAS: false,
      message: '로컬 데이터가 로드되었습니다.',
    };
  }

  try {
    const fetchUrl = new URL(targetUrl);
    fetchUrl.searchParams.set('action', 'get');
    fetchUrl.searchParams.set('_t', Date.now().toString()); // 캐시 방지

    const res = await fetch(fetchUrl.toString(), {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return { records: data, fromGAS: true };
    } else if (data && Array.isArray(data.records)) {
      return { records: data.records, fromGAS: true };
    } else if (data && Array.isArray(data.data)) {
      return { records: data.data, fromGAS: true };
    }

    return { records: getLocalRecords(), fromGAS: false };
  } catch (err) {
    console.warn('Failed to fetch from GAS, using local storage fallback:', err);
    return {
      records: getLocalRecords(),
      fromGAS: false,
      message: '원격 서버 연결 실패로 로컬 저장소 기록을 표시합니다.',
    };
  }
}

/**
 * 교사용 Google Apps Script 소스코드 템플릿 생성기
 */
export const GAS_SCRIPT_CODE_TEMPLATE = `/**
 * [원소 기호 & 이온식 마스터 게임용 Google Apps Script 백엔드]
 * 1. 스프레드시트에서 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 아래 코드를 붙여넣기 후 저장 (Ctrl+S)
 * 3. [배포] -> [새 배포] -> 유형 선택(톱니바퀴): '웹 앱'
 *    - 설명: 원소기호 퀴즈 백엔드
 *    - 다음 사용자 권한으로 실행: '나(My account)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' (중요!)
 * 4. 생성된 '웹 앱 URL'을 복사하여 앱에 입력하세요.
 */

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
    var postData = JSON.parse(e.postData.contents);
    
    if (postData.action === "save") {
      var dateStr = postData.date || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
      sheet.appendRow([
        dateStr,
        postData.name || "익명",
        Number(postData.score) || 0,
        Number(postData.time) || 0
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "저장 완료"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "지원하지 않는 action입니다."
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var values = sheet.getDataRange().getValues();
    var records = [];
    
    // 1행은 헤더이므로 2행부터 읽음
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row[1]) { // 이름이 있는 행만
        records.push({
          id: "gas_" + i,
          date: String(row[0]),
          name: String(row[1]),
          score: Number(row[2]) || 0,
          time: Number(row[3]) || 0
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      records: records
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      records: [],
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("퀴즈기록");
  if (!sheet) {
    sheet = ss.insertSheet("퀴즈기록");
    sheet.appendRow(["기록일시", "학생 닉네임", "최종 점수", "소요 시간(초)"]);
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e0f2fe");
  }
  return sheet;
}
`;
