import Link from "next/link";
import {
  ArrowRight,
  FlaskConical,
  GraduationCap,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "./page-header";
import { SourceNotice } from "./source-badge";
import type { Crumb } from "./breadcrumbs";
import { getLessonByHref } from "@/lib/content/curriculum";
import { LABS, SIMULATORS } from "@/lib/content/practice";

export function ToolPage({
  eyebrow,
  title,
  summary,
  trail,
  lessonHref,
  children,
  showSourceNotice = false,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  trail: Crumb[];
  lessonHref?: string;
  children: React.ReactNode;
  showSourceNotice?: boolean;
}) {
  const lesson = lessonHref ? getLessonByHref(lessonHref) : undefined;

  const aqui = trail.at(-1)?.href;

  const lab = lessonHref
    ? LABS.find((l) => l.lesson === lessonHref && l.href !== aqui)
    : undefined;
  const sim = lessonHref
    ? SIMULATORS.find((s) => s.lesson === lessonHref && s.href !== aqui)
    : undefined;

  return (
    <article className="max-w-5xl" data-netlab-tool>
      <PageHeader eyebrow={eyebrow} title={title} summary={summary} trail={trail} />

      {showSourceNotice && <SourceNotice className="mb-6" />}

      {children}

      {(lesson || lab || sim) && (
        <section className="mt-10 border-t border-rail pt-6">
          <p className="silkscreen mb-3">Continue por aqui</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {lesson && (
              <li>
                <Link
                  href={lesson.href}
                  className="panel group flex items-center gap-3 p-3 transition-colors hover:bg-panel-raised"
                >
                  <GraduationCap className="size-4 shrink-0 text-fiber" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{lesson.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      Aula relacionada
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            )}
            {lab && (
              <li>
                <Link
                  href={lab.href}
                  className="panel group flex items-center gap-3 p-3 transition-colors hover:bg-panel-raised"
                >
                  <FlaskConical className="size-4 shrink-0 text-copper" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{lab.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      Laboratório relacionado
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            )}

            {sim && (
              <li>
                <Link
                  href={sim.href}
                  className="panel group flex items-center gap-3 p-3 transition-colors hover:bg-panel-raised"
                >
                  <SlidersHorizontal
                    className="size-4 shrink-0 text-fiber"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{sim.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      Simulador relacionado
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}
    </article>
  );
}
