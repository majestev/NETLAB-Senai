"use client";

import Link from "next/link";
import { ArrowRight, Check, FlaskConical, SlidersHorizontal } from "lucide-react";
import { useProgress } from "@/components/progress-provider";
import { CURRICULUM, type CourseModule, type Lesson } from "@/lib/content/curriculum";
import { getLab, getSimulator } from "@/lib/content/practice";
import { cn } from "@/lib/utils";

export function CourseOutline() {
  const { isCompleted, loading, nextLesson } = useProgress();

  return (
    <ol className="space-y-4">
      {CURRICULUM.map((modulo) => (
        <li key={modulo.id}>
          <Modulo
            modulo={modulo}
            isCompleted={isCompleted}
            loading={loading}
            proximaHref={loading ? undefined : nextLesson?.href}
          />
        </li>
      ))}
    </ol>
  );
}

export function ModuleLessonList({ modulo }: { modulo: CourseModule }) {
  const { isCompleted, loading, nextLesson } = useProgress();
  const proximaHref = loading ? undefined : nextLesson?.href;

  return (
    <ol className="overflow-hidden rounded-md border border-rail bg-panel">
      {modulo.lessons.map((aula, i) => (
        <Aula
          key={aula.href}
          aula={aula}
          ordem={i + 1}
          concluida={!loading && isCompleted(aula.href)}
          proxima={aula.href === proximaHref}
        />
      ))}
    </ol>
  );
}

function Modulo({
  modulo,
  isCompleted,
  loading,
  proximaHref,
}: {
  modulo: CourseModule;
  isCompleted: (href: string) => boolean;
  loading: boolean;
  proximaHref?: string;
}) {
  const total = modulo.lessons.length;
  const feitas = modulo.lessons.filter((l) => isCompleted(l.href)).length;
  const completo = !loading && feitas === total && total > 0;

  return (
    <section
      aria-labelledby={`modulo-${modulo.id}`}
      className="overflow-hidden rounded-md border border-rail bg-panel"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rail px-5 py-4">
        <span
          aria-hidden
          className={cn(
            "font-mono text-sm tabular-nums",
            completo ? "text-signal" : "text-copper",
          )}
        >
          {modulo.number}
        </span>
        <h2 id={`modulo-${modulo.id}`} className="text-lg font-semibold">
          <Link href={modulo.href} className="rounded-sm hover:text-copper">
            {modulo.title}
          </Link>
        </h2>
        <p className="w-full text-sm text-muted-foreground sm:w-auto sm:flex-1">
          {modulo.tagline}
        </p>

        <span className="silkscreen shrink-0">
          {loading || feitas === 0
            ? `${total} ${total === 1 ? "aula" : "aulas"}`
            : `${feitas} de ${total}`}
        </span>
      </div>

      <ol>
        {modulo.lessons.map((aula, i) => (
          <Aula
            key={aula.href}
            aula={aula}
            ordem={i + 1}
            concluida={!loading && isCompleted(aula.href)}
            proxima={aula.href === proximaHref}
          />
        ))}
      </ol>
    </section>
  );
}

function Aula({
  aula,
  ordem,
  concluida,
  proxima,
}: {
  aula: Lesson;
  ordem: number;
  concluida: boolean;
  proxima: boolean;
}) {
  const sim = aula.simulator ? getSimulator(aula.simulator) : undefined;
  const lab = aula.lab ? getLab(aula.lab) : undefined;

  return (
    <li className="border-t border-rail first:border-t-0">
      <Link
        href={aula.href}
        aria-current={proxima ? "step" : undefined}
        className={cn(
          "group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-panel-raised sm:gap-4",
          proxima && "bg-copper-soft/60",
        )}
      >

        <span className="flex w-6 shrink-0 justify-center pt-0.5">
          {concluida ? (
            <Check className="size-4 text-signal" aria-label="Concluída" />
          ) : (
            <span
              aria-hidden
              className="font-mono text-xs tabular-nums text-muted-foreground"
            >
              {String(ordem).padStart(2, "0")}
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-sm font-medium">{aula.title}</span>
            {proxima && <span className="silkscreen text-copper">Continue aqui</span>}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {aula.objective}
          </span>
          {(sim || lab) && (
            <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {sim && (
                <span className="flex items-center gap-1.5 text-xs text-fiber">
                  <SlidersHorizontal className="size-3" aria-hidden />
                  {sim.title}
                </span>
              )}
              {lab && (
                <span className="flex items-center gap-1.5 text-xs text-copper">
                  <FlaskConical className="size-3" aria-hidden />
                  {lab.short}
                </span>
              )}
            </span>
          )}
        </span>

        <ArrowRight
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </Link>
    </li>
  );
}
