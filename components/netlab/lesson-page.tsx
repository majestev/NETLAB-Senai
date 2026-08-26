import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import { PageHeader } from "./page-header";
import { SourceNotice, SourceBadge } from "./source-badge";
import { LessonSections } from "./lesson-sections";
import { LessonConcept, LessonKeyPoints } from "./lesson-brief";
import { LessonToc } from "./lesson-toc";
import { VideoLesson } from "./video-lesson";
import { getVideoForLesson } from "@/lib/content/videos";
import { lessonOutline } from "@/lib/content/outline";
import { LessonProgress } from "./lesson-progress";
import {
  LearningResourceJsonLd,
} from "./structured-data";
import {
  getLessonByHref,
  getLessonNeighbors,
  getModuleOfLesson,
} from "@/lib/content/curriculum";
import { getLessonContent } from "@/lib/content/lessons";
import { orderedSections } from "@/lib/content/lesson-order";
import { getLab, getSimulator } from "@/lib/content/practice";
import { cn } from "@/lib/utils";

export function LessonPage({ href }: { href: string }) {
  const lesson = getLessonByHref(href);
  const moduloAtual = getModuleOfLesson(href);
  const content = getLessonContent(href);
  if (!lesson || !moduloAtual || !content) notFound();

  const { previous, next } = getLessonNeighbors(href);
  const lab = lesson.lab ? getLab(lesson.lab) : undefined;
  const sim = lesson.simulator ? getSimulator(lesson.simulator) : undefined;

  const trail = [
    { href: "/curso", label: "Curso" },
    { href: moduloAtual.href, label: moduloAtual.short },
    { href: lesson.href, label: lesson.short },
  ];

  const video = getVideoForLesson(lesson.href);
  const sumario = lessonOutline(content, video !== undefined);

  return (
    <div className="flex gap-10">

      <article id="conteudo-da-aula" className="min-w-0 max-w-3xl flex-1">
      <LearningResourceJsonLd
        name={lesson.title}
        description={content.whatIs}
        url={lesson.href}
        module={moduloAtual.title}
      />

      <PageHeader
        eyebrow={`Módulo ${moduloAtual.number} · ${moduloAtual.title}`}
        title={lesson.title}
        trail={trail}
        aside={<SourceBadge source={content.source} compact />}
      />

      <LessonConcept
        objective={lesson.objective}
        whatIs={content.whatIs}
        whyExists={content.whyExists}
      />

      {content.source === "complementar" && <SourceNotice className="mb-8" />}

      <LessonKeyPoints points={content.summary} />

      <LessonSections sections={orderedSections(content.sections)} />

      {video && (
        <section id="video-complementar" className="mt-10 scroll-mt-20">
          <VideoLesson video={video} />
        </section>
      )}

      <section className="mt-10">
        <h2
          id="erros-comuns"
          className="mb-3 flex scroll-mt-20 items-center gap-2 text-xl font-semibold"
        >
          <TriangleAlert className="size-5 text-caution" aria-hidden />
          Erros comuns
        </h2>
        <ul className="grid gap-px overflow-hidden rounded-md border border-rail bg-rail sm:grid-cols-2">
          {content.commonErrors.map((error, i) => (
            <li
              key={error.mistake}
              className={cn(
                "bg-panel p-4",

                content.commonErrors.length % 2 === 1 &&
                  i === content.commonErrors.length - 1 &&
                  "sm:col-span-2",
              )}
            >
              <p className="flex gap-2 text-sm font-semibold">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-caution" />
                {error.mistake}
              </p>
              <p className="mt-1.5 pl-3.5 text-sm text-muted-foreground">{error.why}</p>
            </li>
          ))}
        </ul>
      </section>

      {content.references && content.references.length > 0 && (
        <section className="mt-8">
          <h2 className="silkscreen mb-2">Normas citadas</h2>
          <p className="font-mono text-sm text-muted-foreground">
            {content.references.join(" · ")}
          </p>
        </section>
      )}

      {(lab || sim) && (
        <section className="mt-10">
          <h2 className="silkscreen mb-3">Praticar</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {sim && (
              <li>
                <Link
                  href={sim.href}
                  className="panel group flex h-full flex-col gap-1 p-4 transition-colors hover:bg-panel-raised"
                >
                  <span className="silkscreen text-fiber">Simulador</span>
                  <span className="text-sm font-medium">{sim.title}</span>
                  <span className="text-sm text-muted-foreground">{sim.summary}</span>
                </Link>
              </li>
            )}
            {lab && (
              <li>
                <Link
                  href={lab.href}
                  className="panel group flex h-full flex-col gap-1 p-4 transition-colors hover:bg-panel-raised"
                >
                  <span className="silkscreen text-copper">Laboratório</span>
                  <span className="text-sm font-medium">{lab.title}</span>
                  <span className="text-sm text-muted-foreground">{lab.summary}</span>
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-rail pt-6">
        <LessonProgress href={href} />
        <Link
          href="/quiz"
          className="text-sm text-fiber underline-offset-4 hover:underline"
        >
          Testar no quiz
        </Link>
      </div>

      <nav
        aria-label="Navegação entre aulas"
        className="mt-6 grid gap-2 sm:grid-cols-2"
      >
        {previous ? (
          <Link
            href={previous.href}
            className="panel group flex items-center gap-3 p-4 transition-colors hover:bg-panel-raised"
          >
            <ArrowLeft
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            <span className="min-w-0">
              <span className="silkscreen block">Anterior</span>
              <span className="block truncate text-sm font-medium">
                {previous.short}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={next.href}
            className="panel group flex items-center justify-end gap-3 p-4 text-right transition-colors hover:bg-panel-raised"
          >
            <span className="min-w-0">
              <span className="silkscreen block">Próxima</span>
              <span className="block truncate text-sm font-medium">{next.short}</span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </nav>
      </article>

      <LessonToc items={sumario} />
    </div>
  );
}
