import { EMPTY_PROGRESS, type ProgressState, type ProgressStore } from "./types";

const KEY = "netlab.progress.v1";

function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<ProgressState>;
  return (
    Array.isArray(v.completedLessons) &&
    typeof v.quizScores === "object" &&
    v.quizScores !== null &&
    typeof v.labScores === "object" &&
    v.labScores !== null
  );
}

export function saveProgressNow(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export const localProgressStore: ProgressStore = {
  async load() {
    if (typeof window === "undefined") return EMPTY_PROGRESS;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return EMPTY_PROGRESS;
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      if (!isProgressState(parsed)) return EMPTY_PROGRESS;

      return {
        ...EMPTY_PROGRESS,
        ...parsed,
        openedVideos: Array.isArray(parsed.openedVideos)
          ? parsed.openedVideos
          : [],
        watchLater: Array.isArray(parsed.watchLater) ? parsed.watchLater : [],
      };
    } catch {
      return EMPTY_PROGRESS;
    }
  },

  async save(state) {
    saveProgressNow(state);
  },
};
