import type { Metadata } from "next";
import { ToolPage } from "@/components/netlab/tool-page";
import { RoutingDecision } from "@/components/netlab/routing-decision";
import { getSimulator } from "@/lib/content/practice";

const SIM = getSimulator("/simuladores/roteamento")!;

export const metadata: Metadata = {
  title: SIM.title,
  description: SIM.summary,
  alternates: { canonical: "/simuladores/roteamento" },
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
      lessonHref="/curso/roteamento-ip/fundamentos"
    >
      <RoutingDecision />
    </ToolPage>
  );
}
