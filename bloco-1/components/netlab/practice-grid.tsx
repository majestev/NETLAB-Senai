import Link from "next/link";
import { ArrowRight, Clock, ListChecks } from "lucide-react";
import type { PracticeCategory, PracticeItem } from "@/lib/content/practice";
import { getLessonByHref } from "@/lib/content/curriculum";
import { CardPreview } from "./card-preview";
import { cn } from "@/lib/utils";

const NIVEL_ROTULO = {
  1: "Introdutório",
  2: "Intermediário",
  3: "Avançado",
} as const;

function NivelBarras({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className="flex items-end gap-[2px]">
        {([1, 2, 3] as const).map((n) => (
          <span
            key={n}
            className={cn(
              "w-[3px] rounded-[1px]",
              n === 1 && "h-1.5",
              n === 2 && "h-2.5",
              n === 3 && "h-3.5",
              n <= level ? "bg-fiber" : "bg-rail-strong",
            )}
          />
        ))}
      </span>
      <span className="silkscreen">{NIVEL_ROTULO[level]}</span>
    </span>
  );
}

function PracticeRow({ item }: { item: PracticeItem }) {
  const aula = item.lesson ? getLessonByHref(item.lesson) : undefined;

  return (
    <Link
      href={item.href}
      className="group flex flex-col gap-3 rounded-md border border-rail bg-panel p-4 transition-colors hover:bg-panel-raised sm:flex-row sm:items-center sm:gap-5 sm:p-5"
    >
      <span className="flex w-fit shrink-0 items-center justify-center rounded-sm border border-rail bg-panel-sunken px-3 py-2.5">
        <CardPreview
          href={item.href}
          className="h-10 w-20 transition-transform duration-300 ease-panel group-hover:scale-[1.06] sm:h-11 sm:w-22"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight">
          {item.title}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {item.tagline}
        </span>
        {aula && (
          <span className="mt-1.5 block text-xs text-muted-foreground">
            <span className="silkscreen mr-1.5">Pratica</span>
            {aula.title}
          </span>
        )}
      </span>

      <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-rail pt-3 sm:w-44 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1.5 sm:border-0 sm:pt-0">
        <NivelBarras level={item.level} />
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {item.minutes} min
        </span>
        {item.tasks !== undefined && (
          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <ListChecks className="size-3.5" aria-hidden />
            {item.tasks} tarefas corrigidas
          </span>
        )}
        <ArrowRight
          aria-hidden
          className="ml-auto size-4 shrink-0 text-fiber transition-transform group-hover:translate-x-0.5 sm:ml-0 sm:hidden"
        />
      </span>

      <ArrowRight
        aria-hidden
        className="hidden size-4 shrink-0 text-fiber transition-transform group-hover:translate-x-0.5 sm:block"
      />
    </Link>
  );
}

export function PracticeGrid({ items }: { items: readonly PracticeItem[] }) {
  const categorias = [...new Set(items.map((i) => i.category))] as PracticeCategory[];

  return (
    <div className="space-y-9">
      {categorias.map((categoria) => {
        const daCategoria = items
          .filter((i) => i.category === categoria)
          .sort((a, b) => a.level - b.level);
        return (
          <section key={categoria} aria-labelledby={`cat-${categoria}`}>
            <h2
              id={`cat-${categoria}`}
              className="silkscreen mb-3 flex items-center gap-3"
            >
              {categoria}
              <span aria-hidden className="h-px flex-1 bg-rail" />
              <span className="font-mono tabular-nums">
                {String(daCategoria.length).padStart(2, "0")}
              </span>
            </h2>
            <ul className="space-y-2">
              {daCategoria.map((item) => (
                <li key={item.href}>
                  <PracticeRow item={item} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
