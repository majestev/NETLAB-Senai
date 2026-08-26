import type { ContentSource } from "../source";
import type { CodeLineExplanation } from "@/components/netlab/code-block";

export type LessonSection =
  | { kind: "prose"; title?: string; paragraphs: string[] }
  | {
      kind: "table";
      title: string;
      caption: string;
      headers: string[];
      rows: string[][];
      monoColumns?: number[];
    }
  | {
      kind: "code";
      title: string;
      code: string;
      caption?: string;
      explanations?: CodeLineExplanation[];
    }
  | {
      kind: "callout";
      tone: "info" | "atencao" | "erro" | "dica";
      title: string;
      body: string;
    }
  | { kind: "list"; title: string; items: string[]; ordered?: boolean }
  | {
      kind: "topology";
      topology: "roteamento" | "vlsm" | "rip" | "switching" | "vlan" | "wireless";
      title: string;
    }
  | { kind: "simulator"; href: string; title: string; invite: string }
  | { kind: "routing-table"; title: string }
  | { kind: "vlsm-worked"; title: string }
  | { kind: "prefix-match"; title: string }
  | { kind: "vlsm-split"; title: string }
  | { kind: "encapsulation"; title: string }
  | { kind: "cam-story"; title: string }
  | { kind: "dot1q"; title: string }
  | { kind: "wireless-assoc"; title: string }
  | { kind: "wireless-spectrum"; title: string }
  | { kind: "cli-modes"; title: string }
  | { kind: "gui-vs-cli"; title: string }
  | {
      kind: "deep-dive";
      title: string;

      teaser: string;
      paragraphs: string[];
    };

export interface CommonError {
  mistake: string;
  why: string;
}

export interface LessonContent {
  href: string;
  source: ContentSource;
  whatIs: string;
  whyExists: string;
  sections: LessonSection[];
  commonErrors: CommonError[];
  summary: string[];

  references?: string[];
}
