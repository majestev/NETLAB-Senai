import type { Metadata } from "next";
import { PageHeader } from "@/components/netlab/page-header";
import { SourceNotice } from "@/components/netlab/source-badge";
import { QuizRunner } from "@/components/netlab/quiz-runner";
import { QUIZ } from "@/lib/content/quiz";

export const metadata: Metadata = {
  title: "Quiz",
  description:
    "Questões de múltipla escolha sobre roteamento, comutação, VLAN e redes sem fio, com explicação de por que cada alternativa está certa ou errada.",
  alternates: { canonical: "/quiz" },
};

export default function Page() {
  return (
    <div className="max-w-3xl" data-netlab-tool>
      <PageHeader
        title="Quiz"
        summary={`${QUIZ.length} questões cobrindo os seis módulos. Cada alternativa traz a explicação de por que está certa ou errada. O feedback é o momento de ensino, não o placar.`}
        trail={[{ href: "/quiz", label: "Quiz" }]}
      />
      <SourceNotice className="mb-6" />
      <QuizRunner />
    </div>
  );
}
