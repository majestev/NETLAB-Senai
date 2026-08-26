import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ModuleLessonList } from "@/components/netlab/course-outline";
import { PageHeader } from "@/components/netlab/page-header";
import { CURRICULUM } from "@/lib/content/curriculum";

export function generateStaticParams() {
  return CURRICULUM.map((m) => ({ modulo: m.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/curso/[modulo]">): Promise<Metadata> {
  const { modulo } = await params;
  const found = CURRICULUM.find((m) => m.id === modulo);
  if (!found) return {};
  return {
    title: found.title,
    description: found.summary,
    alternates: { canonical: found.href },
  };
}

export default async function Page({ params }: PageProps<"/curso/[modulo]">) {
  const { modulo } = await params;
  const indice = CURRICULUM.findIndex((m) => m.id === modulo);
  if (indice === -1) notFound();

  const found = CURRICULUM[indice];
  const anterior = CURRICULUM[indice - 1];
  const proximo = CURRICULUM[indice + 1];

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={`Módulo ${found.number} de ${CURRICULUM.length}`}
        title={found.title}
        summary={found.summary}
        trail={[
          { href: "/curso", label: "Curso" },
          { href: found.href, label: found.short },
        ]}
      />

      <ModuleLessonList modulo={found} />

      <nav
        aria-label="Navegação entre módulos"
        className="mt-6 grid gap-2 sm:grid-cols-2"
      >
        {anterior ? (
          <Link
            href={anterior.href}
            className="panel group flex items-center gap-3 p-4 transition-colors hover:bg-panel-raised"
          >
            <ArrowRight
              className="size-4 shrink-0 rotate-180 text-muted-foreground transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            <span className="min-w-0">
              <span className="silkscreen block">Módulo anterior</span>
              <span className="block truncate text-sm font-medium">
                {anterior.short}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {proximo && (
          <Link
            href={proximo.href}
            className="panel group flex items-center justify-end gap-3 p-4 text-right transition-colors hover:bg-panel-raised"
          >
            <span className="min-w-0">
              <span className="silkscreen block">Próximo módulo</span>
              <span className="block truncate text-sm font-medium">
                {proximo.short}
              </span>
            </span>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </nav>
    </div>
  );
}
