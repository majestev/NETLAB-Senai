"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useProgress } from "@/components/progress-provider";
import type { CourseModule } from "@/lib/content/curriculum";
import { cn } from "@/lib/utils";

export function ModuleCard({ module }: { module: CourseModule }) {
  const { isCompleted, loading } = useProgress();

  const total = module.lessons.length;
  const feitas = module.lessons.filter((l) => isCompleted(l.href)).length;
  const pct = total === 0 ? 0 : Math.round((feitas / total) * 100);
  const completo = !loading && feitas === total && total > 0;

  const proxima = module.lessons.find((l) => !isCompleted(l.href));
  const destino = loading || !proxima ? module.href : proxima.href;

  return (
    <Link
      href={destino}
      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-md border border-rail bg-panel p-5 transition-colors hover:bg-panel-raised"
    >

      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-copper transition-transform duration-300 ease-panel group-hover:scale-x-100"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm tabular-nums text-copper">
          {module.number}
        </span>
        {completo ? (
          <span className="flex items-center gap-1.5 text-signal">
            <Check className="size-3.5" aria-hidden />
            <span className="silkscreen text-signal">Concluído</span>
          </span>
        ) : (
          <span className="silkscreen">
            {total} {total === 1 ? "aula" : "aulas"}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold leading-tight">{module.title}</h3>
      <p className="text-sm text-muted-foreground">{module.tagline}</p>

      <div className="mt-auto pt-3">
        <div className="flex h-4 items-center justify-between">
          {!loading && feitas > 0 && (
            <>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {feitas}/{total}
              </span>
              <span className="font-mono text-xs tabular-nums text-fiber">
                {pct}%
              </span>
            </>
          )}
        </div>

        <div className="mt-1.5 h-1" role="presentation">
          {!loading && feitas > 0 && (
            <div className="h-full w-full overflow-hidden rounded-full bg-panel-sunken">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-panel",
                  completo ? "bg-signal" : "bg-copper",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        <span className="mt-3 flex items-center gap-1.5 text-sm text-fiber">
          {loading || feitas === 0 ? "Começar" : completo ? "Revisar" : "Continuar"}
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
