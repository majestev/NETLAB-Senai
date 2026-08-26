import type { Metadata } from "next";
import { ToolPage } from "@/components/netlab/tool-page";
import { SubnetCalculator } from "@/components/netlab/subnet-calculator";
import { getSimulator } from "@/lib/content/practice";

const SIM = getSimulator("/simuladores/subnetting")!;

export const metadata: Metadata = {
  title: SIM.title,
  description: SIM.summary,
  alternates: { canonical: "/simuladores/subnetting" },
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
      lessonHref="/curso/roteamento-ip/classful-classless"
    >
      <SubnetCalculator />
    </ToolPage>
  );
}
