import type { Metadata } from "next";
import { PageHeader } from "@/components/netlab/page-header";
import { PracticeGrid } from "@/components/netlab/practice-grid";
import { SIMULATORS } from "@/lib/content/practice";

export const metadata: Metadata = {
  title: "Simuladores",
  description:
    "Calculadora de sub-redes, alocador VLSM, decisão de encaminhamento, convergência RIP, aprendizado de switch, VLAN e analisador de protocolos.",
  alternates: { canonical: "/simuladores" },
};

export default function Page() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Simuladores"
        summary={`${SIMULATORS.length} ferramentas que mostram o caminho até o resultado, não só o resultado. Cada uma pratica uma aula específica do curso.`}
        trail={[{ href: "/simuladores", label: "Simuladores" }]}
      />
      <PracticeGrid items={SIMULATORS} />
    </div>
  );
}
