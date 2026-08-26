import type { LessonContent } from "./lessons/types";
import { orderedSections } from "./lesson-order";

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface OutlineItem {
  id: string;
  title: string;
}

export function lessonOutline(
  content: LessonContent,
  temVideo = false,
): OutlineItem[] {
  const itens: OutlineItem[] = [
    { id: slugify("O que é"), title: "O que é" },
    { id: slugify("Por que existe"), title: "Por que existe" },
  ];

  if (content.summary.length > 0) {
    itens.push({ id: slugify("Pontos-chave"), title: "Pontos-chave" });
  }

  for (const secao of orderedSections(content.sections)) {
    const titulo = "title" in secao ? secao.title : undefined;
    if (!titulo) continue;

    if (secao.kind === "simulator") continue;
    itens.push({ id: slugify(titulo), title: titulo });
  }

  if (temVideo) {
    itens.push({ id: "video-complementar", title: "Vídeo complementar" });
  }

  if (content.commonErrors.length > 0) {
    itens.push({ id: slugify("Erros comuns"), title: "Erros comuns" });
  }

  const vistos = new Set<string>();
  return itens.filter((i) => {
    if (vistos.has(i.id)) return false;
    vistos.add(i.id);
    return true;
  });
}
