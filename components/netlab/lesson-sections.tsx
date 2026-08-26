import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "./code-block";
import { Callout } from "./callout";
import { DataTable } from "./data-table";
import { LabTopology } from "./lab-topology";
import { DeepDive } from "./deep-dive";
import { LessonVisual } from "./lesson-visual";
import { slugify } from "@/lib/content/outline";
import type { LessonSection } from "@/lib/content/lessons/types";

export function LessonSections({ sections }: { sections: LessonSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => {
        switch (section.kind) {
          case "prose":
            return (
              <section key={index}>
                {section.title && (
                  <h2
                    id={slugify(section.title)}
                    className="mb-3 scroll-mt-20 text-xl font-semibold"
                  >
                    {section.title}
                  </h2>
                )}
                <Prose paragraphs={section.paragraphs} />
              </section>
            );

          case "table":
            return (
              <section key={index}>
                <h2
                  id={slugify(section.title)}
                  className="mb-3 scroll-mt-20 text-xl font-semibold"
                >
                  {section.title}
                </h2>
                <DataTable
                  caption={section.caption}
                  headers={section.headers}
                  rows={section.rows}
                  monoColumns={section.monoColumns}
                />
              </section>
            );

          case "code":
            return (
              <section key={index}>
                <CodeBlock
                  title={section.title}
                  code={section.code}
                  caption={section.caption}
                  explanations={section.explanations}
                />
              </section>
            );

          case "callout":
            return (
              <Callout key={index} tone={section.tone} title={section.title}>
                <p>{section.body}</p>
              </Callout>
            );

          case "list":
            return (
              <section key={index}>
                <h2
                  id={slugify(section.title)}
                  className="mb-3 scroll-mt-20 text-xl font-semibold"
                >
                  {section.title}
                </h2>
                {section.ordered ? (
                  <Steps items={section.items} />
                ) : (
                  <ul className="space-y-2">
                    {section.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-[1.0625rem] leading-relaxed"
                      >
                        <span
                          aria-hidden
                          className="mt-2.5 size-1.5 shrink-0 rounded-full bg-copper"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );

          case "topology":
            return (
              <section key={index}>
                <h2
                  id={slugify(section.title)}
                  className="mb-3 scroll-mt-20 text-xl font-semibold"
                >
                  {section.title}
                </h2>
                <LabTopology kind={section.topology} />
              </section>
            );

          case "deep-dive":
            return (
              <DeepDive
                key={index}
                title={section.title}
                teaser={section.teaser}
                paragraphs={section.paragraphs}
              />
            );

          case "routing-table":
          case "vlsm-worked":
          case "prefix-match":
          case "vlsm-split":
          case "encapsulation":
          case "cam-story":
          case "dot1q":
          case "wireless-assoc":
          case "wireless-spectrum":
          case "cli-modes":
          case "gui-vs-cli":

            return (
              <section
                key={index}
                id={slugify(section.title)}
                data-netlab-tool
                aria-labelledby={`${slugify(section.title)}-titulo`}
                className="scroll-mt-20"
              >
                <h2
                  id={`${slugify(section.title)}-titulo`}
                  className="mb-3 text-xl font-semibold"
                >
                  {section.title}
                </h2>
                <LessonVisual kind={section.kind} />
              </section>
            );

          case "simulator":
            return (
              <Link
                key={index}
                href={section.href}
                className="panel group flex items-center gap-4 border-fiber/40 bg-fiber-soft p-4 transition-colors hover:bg-fiber-soft"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{section.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {section.invite}
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-fiber transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            );
        }
      })}
    </div>
  );
}

function Prose({ paragraphs }: { paragraphs: string[] }) {
  const [primeiro, ...resto] = paragraphs;
  const corte = primeiro ? primeiro.search(/[.:?!]\s/) : -1;
  const destacar = corte > 0 && corte <= 180;

  return (
    <div className="reading space-y-4">
      {primeiro &&
        (destacar ? (
          <p>
            <strong className="font-semibold text-foreground">
              {primeiro.slice(0, corte + 1)}
            </strong>{" "}
            <span className="text-foreground/85">
              {primeiro.slice(corte + 2)}
            </span>
          </p>
        ) : (
          <p>{primeiro}</p>
        ))}
      {resto.map((p, i) => (
        <p key={i} className="text-foreground/85">
          {p}
        </p>
      ))}
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="relative space-y-4">
      {items.map((item, i) => (
        <li key={i} className="relative flex gap-4 pl-0">
          <span className="relative flex flex-col items-center">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-copper/50 bg-panel font-mono text-xs tabular-nums text-copper"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {i < items.length - 1 && (
              <span aria-hidden className="mt-1 w-px flex-1 bg-rail-strong" />
            )}
          </span>
          <span className="pb-1 pt-0.5 text-[1.0625rem] leading-relaxed">
            {item}
          </span>
        </li>
      ))}
    </ol>
  );
}
