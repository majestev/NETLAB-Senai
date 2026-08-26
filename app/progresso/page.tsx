import type { Metadata } from "next";
import { PageHeader } from "@/components/netlab/page-header";
import { ProgressDashboard } from "@/components/netlab/progress-dashboard";

export const metadata: Metadata = {
  title: "Progresso",
  description:
    "Acompanhe quais aulas você concluiu, seus resultados nos laboratórios e no quiz, e qual é a próxima aula da trilha.",
  alternates: { canonical: "/progresso" },
};

export default function Page() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Progresso"
        summary="Tudo é salvo localmente no seu navegador. Nada é enviado a servidor nenhum."
        trail={[{ href: "/progresso", label: "Progresso" }]}
      />
      <ProgressDashboard />
    </div>
  );
}
