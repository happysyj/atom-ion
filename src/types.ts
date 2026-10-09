export type GameStage = 'start' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'result' | 'teacher';

export interface StageScoreDetail {
  baseScore: number;
  penalties: number;
  bonus: number;
  timeSpent: number; // in seconds
  completed: boolean;
}

export interface StudentRecord {
  id?: string;
  name: string;
  score: number;
  time: number; // total time in seconds
  date?: string;
  stageDetails?: {
    stage1?: StageScoreDetail;
    stage2?: StageScoreDetail;
    stage3?: StageScoreDetail;
    stage4?: StageScoreDetail;
  };
}

export interface GASResponse {
  status: 'success' | 'error';
  message?: string;
  data?: StudentRecord[];
}
