import { BookOpen, ChevronRight, Info } from "lucide-react";
import {
  SOURCE_LABEL,
  SOURCE_LABEL_SHORT,
  type ContentSource,
} from "@/lib/content/source";
import { cn } from "@/lib/utils";

export function SourceBadge({
  source,
  className,
  compact = false,
}: {
  source: ContentSource;
  className?: string;
  compact?: boolean;
}) {
  const texto = compact ? SOURCE_LABEL_SHORT[source] : SOURCE_LABEL[source];

  if (source === "disciplina") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm border border-rail px-2 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-muted-foreground",
          className,
        )}
      >
        <BookOpen className="size-3" aria-hidden />
        {texto}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-caution/40 bg-caution-soft px-2 py-1 text-2xs font-semibold uppercase tracking-[0.12em] text-caution",
        className,
      )}
      title="Este conteúdo não veio do material da disciplina; foi elaborado a partir das normas citadas."
    >
      <Info className="size-3" aria-hidden />
      {texto}
    </span>
  );
}

export function SourceNotice({ className }: { className?: string }) {
  return (
    <details
      className={cn(
        "group panel border-caution/30 bg-caution-soft text-sm",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2">
        <ChevronRight
          className="size-3.5 shrink-0 text-caution transition-transform group-open:rotate-90"
          aria-hidden
        />
        <SourceBadge source="complementar" />
        <span className="text-muted-foreground">
          não veio do material da disciplina. Por quê?
        </span>
      </summary>
      <p className="border-t border-caution/25 px-3 py-3 text-muted-foreground">
        O material original da disciplina ainda não foi integrado ao projeto.
        O texto desta página foi elaborado a partir das normas citadas (RFC e
        IEEE) e está marcado como complementar. Quando o documento for
        integrado, a redação dele prevalece sobre esta.
      </p>
    </details>
  );
}
