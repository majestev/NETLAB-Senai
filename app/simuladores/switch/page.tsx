import type { Metadata } from "next";
import { ToolPage } from "@/components/netlab/tool-page";
import { SwitchSimulator } from "@/components/netlab/switch-simulator";
import { getSimulator } from "@/lib/content/practice";

const SIM = getSimulator("/simuladores/switch")!;

export const metadata: Metadata = {
  title: SIM.title,
  description: SIM.summary,
  alternates: { canonical: "/simuladores/switch" },
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
      lessonHref="/curso/comutacao/cam"
    >
      <SwitchSimulator mode="cam" />
    </ToolPage>
  );
}
