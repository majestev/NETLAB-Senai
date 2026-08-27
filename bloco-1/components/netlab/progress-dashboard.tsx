"use client";

import Link from "next/link";
import { ArrowRight, BookmarkCheck, PlayCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/components/progress-provider";
import { CURRICULUM, getLessonByHref } from "@/lib/content/curriculum";
import { LABS, getLab } from "@/lib/content/practice";
import { VIDEO_LESSONS } from "@/lib/content/videos";
import { cn } from "@/lib/utils";

export function ProgressDashboard() {
  const {
    state,
    loading,
    percent,
    completedCount,
    totalLessons,
    isCompleted,
    nextLesson,
    reset,
  } = useProgress();

  if (loading) {
    return (
      <p className="panel p-6 text-sm text-muted-foreground">
        Carregando seu progresso…
      </p>
    );
  }

  const ultimaAula = state.lastVisitedLesson
    ? getLessonByHref(state.lastVisitedLesson)
    : undefined;

  const laboratorios = Object.entries(state.labScores);
  const quizzes = Object.entries(state.quizScores);

  const ultimoLab = laboratorios
    .slice()
    .sort((a, b) => b[1].at.localeCompare(a[1].at))[0];

  const guardados = VIDEO_LESSONS.filter((v) =>
    state.watchLater.includes(v.lesson),
  );
  const abertos = state.openedVideos.filter((href) =>
    VIDEO_LESSONS.some((v) => v.lesson === href),
  ).length;

  return (
    <div className="space-y-6">

      <section className="panel p-5">
        <p className="silkscreen">Seu progresso</p>
        <p className="mt-2 flex items-baseline gap-3">
          <span className="font-mono text-4xl tabular-nums text-copper">
            {percent}%
          </span>
          <span className="text-sm text-muted-foreground">
            {completedCount} de {totalLessons} aulas concluídas
          </span>
        </p>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-panel-sunken"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso no curso"
        >
          <div
            className="h-full bg-copper transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="silkscreen">Próxima aula</p>
          {nextLesson ? (
            <Link
              href={nextLesson.href}
              className="group mt-2 flex items-start gap-2 text-sm font-medium"
            >
              <span className="min-w-0 flex-1">{nextLesson.title}</span>
              <ArrowRight
                className="mt-0.5 size-4 shrink-0 text-fiber transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ) : (
            <p className="mt-2 text-sm text-signal">Curso concluído.</p>
          )}
        </div>

        <div className="panel p-4">
          <p className="silkscreen">Última aula aberta</p>
          {ultimaAula ? (
            <Link
              href={ultimaAula.href}
              className="mt-2 block text-sm font-medium hover:text-fiber"
            >
              {ultimaAula.title}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhuma aula aberta ainda.
            </p>
          )}
        </div>

        <div className="panel p-4">
          <p className="silkscreen">Último laboratório</p>
          {ultimoLab ? (
            <Link
              href={ultimoLab[0]}
              className="mt-2 block text-sm font-medium hover:text-fiber"
            >
              {getLab(ultimoLab[0])?.title ?? ultimoLab[0]}
              <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                {ultimoLab[1].score}/{ultimoLab[1].total} tarefas
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum laboratório concluído.
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="silkscreen mb-3">Por módulo</h2>
        <ul className="space-y-2">
          {CURRICULUM.map((module) => {
            const feitas = module.lessons.filter((l) => isCompleted(l.href)).length;
            const pct = Math.round((feitas / module.lessons.length) * 100);
            return (
              <li key={module.id} className="panel p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={module.href} className="font-medium hover:text-fiber">
                    <span className="font-mono text-sm text-copper">
                      {module.number}
                    </span>{" "}
                    {module.title}
                  </Link>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {feitas}/{module.lessons.length}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-sunken">
                  <div
                    className={cn(
                      "h-full transition-[width]",
                      pct === 100 ? "bg-signal" : "bg-copper",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="panel p-4">
          <h2 className="silkscreen mb-3">Laboratórios</h2>
          {laboratorios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum laboratório concluído ainda.{" "}
              <Link href="/laboratorios" className="text-fiber hover:underline">
                Ver laboratórios
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {LABS.filter((l) => state.labScores[l.href]).map((l) => {
                const r = state.labScores[l.href];
                return (
                  <li key={l.href} className="flex items-baseline justify-between gap-3">
                    <Link href={l.href} className="text-sm hover:text-fiber">
                      {l.short}
                    </Link>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {r.score}/{r.total}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel p-4">
          <h2 className="silkscreen mb-3">Quiz</h2>
          {quizzes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum quiz concluído ainda.{" "}
              <Link href="/quiz" className="text-fiber hover:underline">
                Fazer o quiz
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {quizzes.map(([id, r]) => (
                <li key={id} className="flex items-baseline justify-between gap-3">
                  <span className="text-sm">
                    {id === "quiz:todos"
                      ? "Todos os módulos"
                      : CURRICULUM.find((m) => `quiz:${m.id}` === id)?.short ?? id}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {r.score}/{r.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <PlayCircle className="size-4 shrink-0 self-center text-copper" aria-hidden />
          <span className="text-sm font-semibold">Vídeos complementares</span>
          <span className="ml-auto font-mono text-sm tabular-nums text-muted-foreground">
            {abertos}/{VIDEO_LESSONS.length} abertos
          </span>
        </h2>

        <p className="mt-1.5 text-sm text-muted-foreground">
          Conta quantos players você chegou a abrir. Não há como saber daqui
          se o vídeo foi assistido até o fim: o player é do YouTube e não
          reporta nada para esta página.
        </p>

        {guardados.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nada guardado para depois. O botão <span className="font-medium">Ver
            depois</span>, na caixa do vídeo de cada aula, monta esta lista.
          </p>
        ) : (
          <>
            <p className="silkscreen mt-4 mb-2 flex items-center gap-1.5">
              <BookmarkCheck className="size-3.5 text-copper" aria-hidden />
              Guardados para depois
            </p>
            <ul className="grid gap-px overflow-hidden rounded-md border border-rail bg-rail sm:grid-cols-2">
              {guardados.map((v) => {
                const aula = getLessonByHref(v.lesson);
                return (
                  <li key={v.lesson} className="bg-panel">
                    <Link
                      href={`${v.lesson}#video-complementar`}
                      className="flex h-full flex-col gap-0.5 px-3 py-2.5 transition-colors hover:bg-panel-raised"
                    >
                      <span className="text-sm font-medium">{v.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {aula?.title ?? v.lesson}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="panel border-fault/30 p-4">
        <h2 className="text-sm font-semibold">Apagar progresso</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu progresso fica salvo apenas neste navegador, em localStorage.
          Apagar é imediato e não pode ser desfeito.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 gap-1.5 border-fault/50 bg-panel text-fault hover:bg-fault-soft"
          onClick={() => {
            if (
              window.confirm(
                "Apagar todo o progresso salvo neste navegador? Isso não pode ser desfeito.",
              )
            ) {
              reset();
            }
          }}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Apagar progresso
        </Button>
      </section>
    </div>
  );
}
