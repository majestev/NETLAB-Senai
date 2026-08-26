import { ALL_LESSONS, CURRICULUM } from "@/lib/content/curriculum";
import { LABS, SIMULATORS } from "@/lib/content/practice";

export const ROTAS: string[] = [
  "/",
  "/curso",
  "/simuladores",
  "/laboratorios",
  "/exercicios",
  "/quiz",
  "/glossario",
  "/referencias",
  "/busca",
  "/progresso",
  ...CURRICULUM.map((m) => m.href),
  ...ALL_LESSONS.map((l) => l.href),
  ...SIMULATORS.map((s) => s.href),
  ...LABS.map((l) => l.href),
];
