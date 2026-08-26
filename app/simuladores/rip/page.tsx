import type { Metadata } from "next";
import { ToolPage } from "@/components/netlab/tool-page";
import { RipSimulator } from "@/components/netlab/rip-simulator";
import { getSimulator } from "@/lib/content/practice";

const SIM = getSimulator("/simuladores/rip")!;

export const metadata: Metadata = {
  title: SIM.title,
  description: SIM.summary,
  alternates: { canonical: "/simuladores/rip" },
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
      lessonHref="/curso/roteamento-ip/rip"
    >
      <RipSimulator />
    </ToolPage>
  );
}
