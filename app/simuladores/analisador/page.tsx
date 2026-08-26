import type { Metadata } from "next";
import { ToolPage } from "@/components/netlab/tool-page";
import { ProtocolAnalyzer } from "@/components/netlab/protocol-analyzer";
import { getSimulator } from "@/lib/content/practice";

const SIM = getSimulator("/simuladores/analisador")!;

export const metadata: Metadata = {
  title: SIM.title,
  description: SIM.summary,
  alternates: { canonical: "/simuladores/analisador" },
};

export default function Page() {
  return (
    <ToolPage
      eyebrow="Simulador"
      title={SIM.title}
      summary={SIM.summary}
      trail={[
        { href: "/simuladores", label: "Simuladores" },
        { href: SIM.href, label: SIM.short },
      ]}
      lessonHref="/curso/analisadores/captura"
      showSourceNotice
    >
      <ProtocolAnalyzer />
    </ToolPage>
  );
}
