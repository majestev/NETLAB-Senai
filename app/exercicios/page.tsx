import type { Metadata } from "next";
import { PageHeader } from "@/components/netlab/page-header";
import { SourceNotice } from "@/components/netlab/source-badge";
import { ExerciseRunner } from "@/components/netlab/exercise-runner";

export const metadata: Metadata = {
  title: "Exercícios",
  description:
    "Exercícios de subnetting, VLSM, identificação de rota, tabela CAM, VLAN e RIP, com enunciados que mudam a cada rodada.",
  alternates: { canonical: "/exercicios" },
};

export default function Page() {
  return (
    <div className="max-w-3xl" data-netlab-tool>
      <PageHeader
        title="Exercícios"
        summary="Enunciados gerados a cada rodada, com gabarito calculado pela mesma biblioteca que alimenta os simuladores, o que garante que a resposta esperada está correta."
        trail={[{ href: "/exercicios", label: "Exercícios" }]}
      />
      <SourceNotice className="mb-6" />
      <ExerciseRunner initialSeed={20260820} />
    </div>
  );
}
