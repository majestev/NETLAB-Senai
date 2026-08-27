"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  localProgressStore,
  saveProgressNow,
} from "@/lib/progress/local-store";
import {
  EMPTY_PROGRESS,
  type ProgressState,
  type ScoreRecord,
} from "@/lib/progress/types";
import { ALL_LESSONS, TOTAL_LESSONS } from "@/lib/content/curriculum";

interface ProgressContextValue {
  state: ProgressState;

  loading: boolean;
  percent: number;
  completedCount: number;
  totalLessons: number;
  isCompleted: (href: string) => boolean;
  toggleLesson: (href: string) => void;
  markVisited: (href: string) => void;
  recordQuiz: (id: string, score: number, total: number) => void;
  recordLab: (id: string, score: number, total: number) => void;

  markVideoOpened: (href: string) => void;
  isVideoOpened: (href: string) => boolean;
  toggleWatchLater: (href: string) => void;
  isWatchLater: (href: string) => boolean;
  reset: () => void;

  nextLesson: (typeof ALL_LESSONS)[number] | undefined;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);

  const espelho = useRef(state);

  const pendentes = useRef<Array<(atual: ProgressState) => ProgressState>>([]);
  const carregando = useRef(true);

  useEffect(() => {
    let active = true;
    void localProgressStore.load().then((loaded) => {
      if (!active) return;
      const comPendentes = pendentes.current.reduce((acc, f) => f(acc), loaded);
      const houvePendentes = pendentes.current.length > 0;
      pendentes.current = [];
      espelho.current = comPendentes;
      carregando.current = false;
      setState(comPendentes);
      setLoading(false);
      if (houvePendentes) saveProgressNow(comPendentes);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    espelho.current = state;
    if (loading) return;
    void localProgressStore.save(state);
  }, [state, loading]);

  const update = useCallback(
    (next: (current: ProgressState) => ProgressState) => {
      const atualizado = next(espelho.current);
      espelho.current = atualizado;
      setState(atualizado);

      if (carregando.current) {
        pendentes.current.push(next);
        return;
      }

      saveProgressNow(atualizado);
    },
    [],
  );

  const toggleLesson = useCallback(
    (href: string) => {
      update((current) => {
        const done = current.completedLessons.includes(href);
        return {
          ...current,
          completedLessons: done
            ? current.completedLessons.filter((l) => l !== href)
            : [...current.completedLessons, href],
        };
      });
    },
    [update],
  );

  const markVisited = useCallback(
    (href: string) => {
      update((current) =>
        current.lastVisitedLesson === href
          ? current
          : { ...current, lastVisitedLesson: href },
      );
    },
    [update],
  );

  const record = useCallback(
    (bucket: "quizScores" | "labScores") =>
      (id: string, score: number, total: number) => {
        const entry: ScoreRecord = {
          score,
          total,
          at: new Date().toISOString(),
        };
        update((current) => {
          const previous = current[bucket][id];

          if (previous && previous.score >= score) return current;
          return { ...current, [bucket]: { ...current[bucket], [id]: entry } };
        });
      },
    [update],
  );

  const recordQuiz = useMemo(() => record("quizScores"), [record]);
  const recordLab = useMemo(() => record("labScores"), [record]);

  const markVideoOpened = useCallback(
    (href: string) => {
      update((current) =>
        current.openedVideos.includes(href)
          ? current
          : { ...current, openedVideos: [...current.openedVideos, href] },
      );
    },
    [update],
  );

  const toggleWatchLater = useCallback(
    (href: string) => {
      update((current) => ({
        ...current,
        watchLater: current.watchLater.includes(href)
          ? current.watchLater.filter((l) => l !== href)
          : [...current.watchLater, href],
      }));
    },
    [update],
  );

  const reset = useCallback(() => update(() => EMPTY_PROGRESS), [update]);

  const value = useMemo<ProgressContextValue>(() => {
    const valid = state.completedLessons.filter((href) =>
      ALL_LESSONS.some((l) => l.href === href),
    );
    return {
      state,
      loading,
      completedCount: valid.length,
      totalLessons: TOTAL_LESSONS,
      percent:
        TOTAL_LESSONS === 0
          ? 0
          : Math.round((valid.length / TOTAL_LESSONS) * 100),
      isCompleted: (href) => valid.includes(href),
      toggleLesson,
      markVisited,
      recordQuiz,
      recordLab,
      markVideoOpened,
      isVideoOpened: (href) => state.openedVideos.includes(href),
      toggleWatchLater,
      isWatchLater: (href) => state.watchLater.includes(href),
      reset,
      nextLesson: ALL_LESSONS.find((l) => !valid.includes(l.href)),
    };
  }, [
    state,
    loading,
    toggleLesson,
    markVisited,
    recordQuiz,
    recordLab,
    markVideoOpened,
    toggleWatchLater,
    reset,
  ]);

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress precisa estar dentro de <ProgressProvider>");
  }
  return context;
}
