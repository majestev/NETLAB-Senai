import { notFound } from "next/navigation";
import { Target } from "lucide-react";
import { ToolPage } from "./tool-page";
import { LabTopology } from "./lab-topology";
import { LabRunner } from "./lab-runner";
import { getLabDefinition } from "@/lib/content/labs-data";
import { getLab } from "@/lib/content/practice";
import { TopologyBuilderLoader } from "./topology-builder-loader";

export function LabPage({ href }: { href: string }) {
  const meta = getLab(href);
  const lab = getLabDefinition(href);
  if (!meta || !lab) notFound();

  return (
    <ToolPage
      eyebrow="Laboratório"
      title={meta.title}
      summary={meta.summary}
      trail={[
        { href: "/laboratorios", label: "Laboratórios" },
        { href: meta.href, label: meta.short },
      ]}
      lessonHref={meta.lesson}
      showSourceNotice={lab.source === "complementar"}
    >
      <section className="panel mb-6 border-copper/40 p-5">
        <p className="flex items-center gap-2">
          <Target className="size-4 text-copper" aria-hidden />
          <span className="silkscreen">Objetivo</span>
        </p>
        <p className="mt-2 text-base">{lab.objective}</p>
      </section>

      <section className="mb-6">
        <h2 className="silkscreen mb-2">Cenário</h2>
        <p className="reading text-muted-foreground">{lab.scenario}</p>
      </section>

      <section className="mb-8">
        <h2 className="silkscreen mb-3">
          {lab.builder ? "Monte a topologia" : "Topologia"}
        </h2>
        {lab.builder ? (
          <TopologyBuilderLoader />
        ) : (
          <LabTopology kind={lab.topology} />
        )}
      </section>

      <section>
        <h2 className="silkscreen mb-3">Tarefas</h2>
        <LabRunner lab={lab} />
      </section>
    </ToolPage>
  );
}
