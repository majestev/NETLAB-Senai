import type { Metadata } from "next";
import { PageHeader } from "@/components/netlab/page-header";
import { GlobalSearch } from "@/components/netlab/global-search";

export const metadata: Metadata = {
  title: "Busca",
  description:
    "Busque aulas, módulos, simuladores, laboratórios e termos do glossário do NETLAB.",
  alternates: { canonical: "/busca" },
};

export default function Page() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Busca"
        summary="Procure em todo o conteúdo do NETLAB. O atalho Ctrl+K (ou ⌘K) abre a mesma busca de qualquer página."
        trail={[{ href: "/busca", label: "Busca" }]}
      />
      <GlobalSearch />
    </div>
  );
}
