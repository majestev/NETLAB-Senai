import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileWarning } from "lucide-react";
import { PageHeader } from "@/components/netlab/page-header";
import { REFERENCES } from "@/lib/content/references";
import { SYLLABUS } from "@/lib/content/syllabus";
import { DISCIPLINE_MATERIAL_INTEGRATED } from "@/lib/content/source";

export const metadata: Metadata = {
  title: "Referências",
  description:
    "Fonte principal do curso e as normas do IETF e do IEEE usadas como referência técnica complementar, com as aulas em que cada uma aparece.",
  alternates: { canonical: "/referencias" },
};

export default function Page() {
  const ietf = REFERENCES.filter((r) => r.organization === "IETF");
  const ieee = REFERENCES.filter((r) => r.organization === "IEEE");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Referências"
        summary="Duas categorias, deliberadamente separadas: a fonte principal do curso e as normas técnicas usadas como complemento. Misturar as duas faria parecer que toda afirmação tem o mesmo peso de origem."
        trail={[{ href: "/referencias", label: "Referências" }]}
      />

      <section className="mb-10">
        <h2 className="mb-1 text-xl font-semibold">Fonte principal</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          O material da disciplina. Quando integrado, é ele que prevalece
          sobre qualquer outra fonte em caso de divergência.
        </p>

        {DISCIPLINE_MATERIAL_INTEGRATED ? (
          <div className="panel p-5">
            <p className="text-sm font-semibold">
              Redes de Computadores — Roteamento, Comutação e Redes Sem Fio
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Material da disciplina, integrado ao projeto e usado como fonte
              primária das aulas.
            </p>
          </div>
        ) : (
          <div className="panel border-caution/40 bg-caution-soft p-5">
            <p className="flex items-start gap-2.5">
              <FileWarning className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden />
              <span>
                <span className="block text-sm font-semibold">
                  O material da disciplina ainda não está no projeto.
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Nenhuma página do NETLAB declara conteúdo vindo dele, porque seria
                  atribuir ao material uma redação que não é dele. Todo o
                  conteúdo atual está marcado como complementar e foi elaborado
                  a partir das normas listadas abaixo, cada uma citada na aula
                  correspondente.
                </span>
              </span>
            </p>
          </div>
        )}

        <div className="panel mt-4 p-5">
          <p className="silkscreen mb-3">Estrutura do programa coberta</p>
          <ol className="space-y-1.5">
            {SYLLABUS.map((s) => (
              <li key={s.code} className="flex gap-3 text-sm">
                <span className="w-9 shrink-0 font-mono text-xs text-copper">
                  {s.code}
                </span>
                {s.lesson ? (
                  <Link href={s.lesson} className="text-fiber underline-offset-4 hover:underline">
                    {s.title}
                  </Link>
                ) : (
                  <span className="font-medium">{s.title}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold">
          Referência técnica complementar
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Normas do IETF e do IEEE. Servem para fundamentar e conferir
          afirmações técnicas, não substituem o material da disciplina.
        </p>

        {[
          { titulo: "IETF — RFC", lista: ietf },
          { titulo: "IEEE", lista: ieee },
        ].map((grupo) => (
          <div key={grupo.titulo} className="mb-8">
            <h3 className="silkscreen mb-3">{grupo.titulo}</h3>
            <ul className="space-y-2">
              {grupo.lista.map((ref) => (
                <li key={ref.code} className="panel p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-sm font-semibold text-copper">
                      {ref.code}
                    </span>
                    <span className="text-sm">{ref.title}</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center gap-1 text-sm text-fiber underline-offset-4 hover:underline"
                    >
                      Abrir
                      <ExternalLink className="size-3" aria-hidden />
                      <span className="sr-only">(abre em nova aba)</span>
                    </a>
                  </div>
                  {ref.lessons.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>Citada em:</span>
                      {ref.lessons.map((lesson) => (
                        <Link
                          key={lesson.href}
                          href={lesson.href}
                          className="text-fiber underline-offset-4 hover:underline"
                        >
                          {lesson.title}
                        </Link>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
