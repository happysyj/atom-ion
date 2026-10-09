/**
 * Direct Google Sheets API integration using OAuth Bearer Token.
 * Allows teachers to export records directly into a new or existing Google Spreadsheet.
 */
import { getAccessToken } from './googleAuth';
import { StudentRecord } from '../types';

export async function createGoogleSpreadsheetWithRecords(
  title: string,
  records: StudentRecord[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google 로그인이 필요합니다.');
  }

  // 1. Create a new Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: '원소기호_성적기록',
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || '스프레드시트 생성 실패');
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate Header & Data
  const rows = [
    ['순번', '기록일시', '학생 닉네임', '최종 점수', '소요 시간(초)'],
    ...records.map((r, i) => [
      i + 1,
      r.date || new Date().toLocaleString(),
      r.name,
      r.score,
      r.time,
    ]),
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/원소기호_성적기록!A1:E${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `원소기호_성적기록!A1:E${rows.length}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Values insert warning');
  }

  return { spreadsheetId, spreadsheetUrl };
}
