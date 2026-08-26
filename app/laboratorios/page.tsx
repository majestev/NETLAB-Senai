import type { Metadata } from "next";
import { PageHeader } from "@/components/netlab/page-header";
import { PracticeGrid } from "@/components/netlab/practice-grid";
import { LABS } from "@/lib/content/practice";

export const metadata: Metadata = {
  title: "Laboratórios",
  description:
    "Cenários guiados de roteamento estático, VLSM, RIP, comutação, VLAN e redes sem fio, com validação automática e explicação de cada resposta.",
  alternates: { canonical: "/laboratorios" },
};

export default function Page() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Laboratórios"
        summary={`${LABS.length} cenários que pedem uma decisão sua, corrigem o que você respondeu e explicam por quê.`}
        trail={[{ href: "/laboratorios", label: "Laboratórios" }]}
      />
      <PracticeGrid items={LABS} />
    </div>
  );
}
