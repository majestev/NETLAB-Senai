import type { LessonSection } from "./lessons/types";

const KINDS_QUE_MOSTRAM = new Set<LessonSection["kind"]>([
  "prefix-match",
  "vlsm-split",
  "encapsulation",
  "cam-story",
  "dot1q",
  "wireless-assoc",
  "wireless-spectrum",
  "cli-modes",
  "gui-vs-cli",
  "routing-table",
  "vlsm-worked",
  "topology",
]);

export function orderedSections(sections: LessonSection[]): LessonSection[] {
  const i = sections.findIndex((s) => KINDS_QUE_MOSTRAM.has(s.kind));
  if (i <= 0) return sections;
  return [sections[i]!, ...sections.slice(0, i), ...sections.slice(i + 1)];
}
