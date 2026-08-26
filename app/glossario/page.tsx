import type { Metadata } from "next";
import { PageHeader } from "@/components/netlab/page-header";
import { GlossaryBrowser } from "@/components/netlab/glossary-browser";
import { GLOSSARY } from "@/lib/content/glossary";

export const metadata: Metadata = {
  title: "Glossário",
  description:
    "Definições dos termos de redes usados no curso, com a camada do modelo OSI, exemplo e link para a aula que ensina cada conceito.",
  alternates: { canonical: "/glossario" },
};

export default function Page() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Glossário"
        summary={`${GLOSSARY.length} termos. O glossário é a fonte única: se uma aula divergir daqui, o erro está na aula.`}
        trail={[{ href: "/glossario", label: "Glossário" }]}
      />
      <GlossaryBrowser />
    </div>
  );
}
