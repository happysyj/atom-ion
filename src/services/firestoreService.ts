import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  limit,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { StudentRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore connection offline. Please check your network or config.');
    }
    return false;
  }
}

/**
 * Save student quiz record to Firestore
 */
export async function saveRecordToFirestore(record: {
  name: string;
  score: number;
  time: number;
  date?: string;
}): Promise<StudentRecord> {
  const sanitizedName = (record.name || '익명').slice(0, 50).trim() || '익명';
  const cleanScore = Math.max(0, Math.min(10000, Math.round(record.score)));
  const cleanTime = Math.max(0, Math.min(86400, Math.round(record.time)));
  const cleanDate = (
    record.date ||
    new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  ).slice(0, 50);

  const recordId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const docPath = `records/${recordId}`;

  const payload: StudentRecord = {
    id: recordId,
    name: sanitizedName,
    score: cleanScore,
    time: cleanTime,
    date: cleanDate,
  };

  try {
    const docRef = doc(db, 'records', recordId);
    await setDoc(docRef, payload);
    return payload;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
  }
}

/**
 * Fetch all quiz records from Firestore
 */
export async function fetchRecordsFromFirestore(): Promise<StudentRecord[]> {
  const collectionPath = 'records';
  try {
    const recordsCol = collection(db, collectionPath);
    const q = query(recordsCol, limit(100));
    const snapshot = await getDocs(q);

    const list: StudentRecord[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as Partial<StudentRecord>;
      list.push({
        id: d.id,
        name: data.name || '익명',
        score: typeof data.score === 'number' ? data.score : 0,
        time: typeof data.time === 'number' ? data.time : 0,
        date: data.date || '',
      });
    });

    // Sort by score desc, then time asc
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });

    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, collectionPath);
  }
}

/**
 * Subscribe to realtime updates for leaderboard
 */
export function subscribeToRecords(
  onData: (records: StudentRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  const collectionPath = 'records';
  const q = query(collection(db, collectionPath), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StudentRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Partial<StudentRecord>;
        list.push({
          id: d.id,
          name: data.name || '익명',
          score: typeof data.score === 'number' ? data.score : 0,
          time: typeof data.time === 'number' ? data.time : 0,
          date: data.date || '',
        });
      });

      list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
      });

      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

/**
 * Delete a quiz record from Firestore
 */
export async function deleteRecordFromFirestore(recordId: string): Promise<void> {
  const docPath = `records/${recordId}`;
  try {
    const docRef = doc(db, 'records', recordId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}
