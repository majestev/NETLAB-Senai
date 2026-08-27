"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useProgress } from "@/components/progress-provider";

export function HomeContinue() {
  const { percent, completedCount, totalLessons, nextLesson, loading } =
    useProgress();

  const comecou = !loading && completedCount > 0;

  if (!nextLesson) {
    return (
      <div className="flex flex-col gap-4 rounded-md border border-signal/40 bg-signal-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="silkscreen text-signal">Curso concluído</p>
          <p className="mt-1.5 text-lg font-semibold leading-tight">
            As {totalLessons} aulas estão marcadas como concluídas.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            O quiz e os laboratórios continuam disponíveis para revisar.
          </p>
        </div>
        <Link
          href="/quiz"
          className="group flex shrink-0 items-center justify-center gap-2 rounded-sm border border-rail bg-panel px-5 py-3 text-sm font-semibold transition-colors hover:bg-panel-raised"
        >
          Testar no quiz
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-md border border-rail bg-panel p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
      <div className="min-w-0 flex-1">
        <p className="silkscreen">
          {comecou ? "Continuar de onde parou" : "Comece por aqui"}
        </p>
        <p className="mt-1.5 text-lg font-semibold leading-tight">
          {nextLesson.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {nextLesson.objective}
        </p>
      </div>

      {comecou && (
        <div className="w-full shrink-0 sm:w-48">
          <p className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl tabular-nums text-copper">
              {percent}%
            </span>
            <span className="text-xs text-muted-foreground">
              {completedCount} de {totalLessons} aulas
            </span>
          </p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-panel-sunken">
            <div
              className="h-full rounded-full bg-copper transition-[width] duration-500 ease-panel"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      <Link
        href={nextLesson.href}
        className="group flex shrink-0 items-center justify-center gap-2 rounded-sm bg-copper px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-copper/90"
      >
        {comecou ? "Retomar" : "Começar a aula 01"}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  );
}
