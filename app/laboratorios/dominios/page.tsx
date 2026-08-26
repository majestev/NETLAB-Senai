import type { Metadata } from "next";
import { LabPage } from "@/components/netlab/lab-page";
import { getLab } from "@/lib/content/practice";

const LAB = getLab("/laboratorios/dominios")!;

export const metadata: Metadata = {
  title: LAB.title,
  description: LAB.summary,
  alternates: { canonical: "/laboratorios/dominios" },
};

export default function Page() {
  return <LabPage href="/laboratorios/dominios" />;
}
