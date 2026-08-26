export type ContentSource = "disciplina" | "complementar";

export const SOURCE_LABEL: Record<ContentSource, string> = {
  disciplina: "Material da disciplina",
  complementar: "Conteúdo complementar",
};

export const SOURCE_LABEL_SHORT: Record<ContentSource, string> = {
  disciplina: "Disciplina",
  complementar: "Complementar",
};

export const DISCIPLINE_MATERIAL_INTEGRATED = false;
