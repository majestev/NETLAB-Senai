export interface ScoreRecord {
  score: number;
  total: number;

  at: string;
}

export interface ProgressState {
  completedLessons: string[];
  quizScores: Record<string, ScoreRecord>;
  labScores: Record<string, ScoreRecord>;
  lastVisitedLesson: string | null;

  openedVideos: string[];

  watchLater: string[];
}

export const EMPTY_PROGRESS: ProgressState = {
  completedLessons: [],
  quizScores: {},
  labScores: {},
  lastVisitedLesson: null,
  openedVideos: [],
  watchLater: [],
};

export interface ProgressStore {
  load(): Promise<ProgressState>;
  save(state: ProgressState): Promise<void>;
}
