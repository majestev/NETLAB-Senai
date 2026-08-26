import { ROTEAMENTO_LESSONS } from "./roteamento";
import { COMUTACAO_LESSONS } from "./comutacao";
import { DIVERSOS_LESSONS } from "./diversos";
import type { LessonContent } from "./types";

export type { LessonContent, LessonSection, CommonError } from "./types";

export const LESSON_CONTENT: LessonContent[] = [
  ...ROTEAMENTO_LESSONS,
  ...DIVERSOS_LESSONS,
  ...COMUTACAO_LESSONS,
];

export function getLessonContent(href: string): LessonContent | undefined {
  return LESSON_CONTENT.find((l) => l.href === href);
}
