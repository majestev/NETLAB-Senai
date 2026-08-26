import { CURRICULUM } from "@/lib/content/curriculum";
import { LABS, SIMULATORS } from "@/lib/content/practice";
import { GLOSSARY } from "@/lib/content/glossary";

export type SearchKind = "aula" | "modulo" | "simulador" | "laboratorio" | "termo";

export interface SearchDoc {
  id: string;
  href: string;
  title: string;
  kind: SearchKind;
  description: string;

  keywords: string[];
}

export const SEARCH_INDEX: SearchDoc[] = [
  ...CURRICULUM.map<SearchDoc>((m) => ({
    id: `modulo:${m.id}`,
    href: m.href,
    title: m.title,
    kind: "modulo",
    description: m.summary,
    keywords: [m.number, m.short],
  })),
  ...CURRICULUM.flatMap((m) =>
    m.lessons.map<SearchDoc>((l) => ({
      id: `aula:${l.href}`,
      href: l.href,
      title: l.title,
      kind: "aula",
      description: l.objective,
      keywords: [m.title, m.short, l.short],
    })),
  ),
  ...SIMULATORS.map<SearchDoc>((s) => ({
    id: `sim:${s.href}`,
    href: s.href,
    title: s.title,
    kind: "simulador",
    description: s.summary,
    keywords: [s.short, "simulador"],
  })),
  ...LABS.map<SearchDoc>((l) => ({
    id: `lab:${l.href}`,
    href: l.href,
    title: l.title,
    kind: "laboratorio",
    description: l.summary,
    keywords: [l.short, "laboratório", "laboratorio", "prática"],
  })),
  ...GLOSSARY.map<SearchDoc>((g) => ({
    id: `termo:${g.term}`,
    href: `/glossario#${slugifyTerm(g.term)}`,
    title: g.term,
    kind: "termo",
    description: g.definition,
    keywords: [...(g.aliases ?? []), "glossário", "glossario", "termo"],
  })),
];

export function slugifyTerm(term: string): string {
  return normalize(term).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface SearchResult extends SearchDoc {
  score: number;
}

export function search(query: string, kinds?: SearchKind[]): SearchResult[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const results: SearchResult[] = [];

  for (const doc of SEARCH_INDEX) {
    if (kinds && kinds.length > 0 && !kinds.includes(doc.kind)) continue;

    const title = normalize(doc.title);
    const description = normalize(doc.description);
    const keywords = doc.keywords.map(normalize);

    let score = 0;
    for (const term of terms) {
      if (title === term) score += 100;
      else if (title.startsWith(term)) score += 60;
      else if (title.includes(term)) score += 40;

      if (keywords.some((k) => k === term)) score += 45;
      else if (keywords.some((k) => k.includes(term))) score += 20;

      if (description.includes(term)) score += 10;
    }

    if (score > 0) results.push({ ...doc, score });
  }

  return results.sort(
    (a, b) => b.score - a.score || a.title.localeCompare(b.title, "pt-BR"),
  );
}

export const KIND_LABEL: Record<SearchKind, string> = {
  aula: "Aula",
  modulo: "Módulo",
  simulador: "Simulador",
  laboratorio: "Laboratório",
  termo: "Glossário",
};
