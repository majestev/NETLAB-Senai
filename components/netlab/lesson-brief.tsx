import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function LessonConcept({
  objective,
  whatIs,
  whyExists,
}: {
  objective: string;
  whatIs: string;
  whyExists: string;
}) {
  return (
    <div className="mb-8">

      <p className="mb-4 flex items-start gap-2.5 border-l-2 border-copper pl-3 text-base leading-snug">
        <Target className="mt-1 size-4 shrink-0 text-copper" aria-hidden />
        <span>
          <span className="silkscreen mr-2 align-middle">Ao final você consegue</span>
          {objective}
        </span>
      </p>

      <div className="grid gap-px overflow-hidden rounded-md border border-rail bg-rail sm:grid-cols-2">
        <section className="bg-panel p-4">
          <h2 id="o-que-e" className="silkscreen scroll-mt-20 text-fiber">
            O que é
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-foreground/90">
            {whatIs}
          </p>
        </section>
        <section className="bg-panel p-4">
          <h2 id="por-que-existe" className="silkscreen scroll-mt-20 text-fiber">
            Por que existe
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-foreground/90">
            {whyExists}
          </p>
        </section>
      </div>
    </div>
  );
}

export function LessonKeyPoints({ points }: { points: string[] }) {
  if (points.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 id="pontos-chave" className="silkscreen mb-3 scroll-mt-20">
        Pontos-chave
      </h2>
      <ol className="grid gap-px overflow-hidden rounded-md border border-rail bg-rail sm:grid-cols-2">
        {points.map((point, i) => (
          <li
            key={point}
            className={cn(
              "flex gap-3 bg-panel p-4",

              points.length % 2 === 1 && i === points.length - 1 && "sm:col-span-2",
            )}
          >
            <span
              aria-hidden
              className="font-mono text-xs tabular-nums text-copper"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[0.9375rem] leading-relaxed">{point}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
