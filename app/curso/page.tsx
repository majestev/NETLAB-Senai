import type { Metadata } from "next";
import { CourseOutline } from "@/components/netlab/course-outline";
import { PageHeader } from "@/components/netlab/page-header";
import { CourseJsonLd } from "@/components/netlab/structured-data";
import { CURRICULUM, TOTAL_LESSONS } from "@/lib/content/curriculum";
import { LABS, SIMULATORS } from "@/lib/content/practice";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Curso",
  description:
    "Trilha completa de redes de computadores: roteamento IP, interfaces de configuração, analisadores de protocolos, ativos de rede, comutação e redes sem fio.",
  alternates: { canonical: "/curso" },
};

export default function Page() {
  return (
    <div className="max-w-4xl">
      <CourseJsonLd
        name={`${SITE.title} — ${SITE.subtitle}`}
        description={SITE.description}
        url="/curso"
      />
      <PageHeader
        title="Curso"
        summary={`${CURRICULUM.length} módulos, ${TOTAL_LESSONS} aulas em sequência. Cada aula declara o que você consegue fazer ao final e aponta o simulador ou o laboratório que a exercita.`}
        trail={[{ href: "/curso", label: "Curso" }]}
      />

      <CourseOutline />

      <p className="mt-6 text-sm text-muted-foreground">
        A trilha se apoia em {SIMULATORS.length} simuladores e {LABS.length}{" "}
        laboratórios, indicados aula por aula acima.
      </p>
    </div>
  );
}
