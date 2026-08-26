import { ChevronRight } from "lucide-react";
import { slugify } from "@/lib/content/outline";
import { cn } from "@/lib/utils";

export function DeepDive({
  title,
  teaser,
  paragraphs,
}: {
  title: string;
  teaser: string;
  paragraphs: string[];
}) {
  return (
    <details className="group panel border-l-2 border-l-copper open:bg-panel-sunken">
      <summary
        id={slugify(title)}
        className={cn(
          "flex cursor-pointer scroll-mt-20 list-none flex-wrap items-baseline gap-x-2.5 gap-y-1 px-4 py-3",
          "transition-colors hover:bg-panel-raised focus-visible:bg-panel-raised",
        )}
      >
        <ChevronRight
          className="size-3.5 shrink-0 self-center text-copper transition-transform group-open:rotate-90"
          aria-hidden
        />
        <span className="silkscreen text-copper">Aprofundamento</span>
        <span className="w-full text-base font-semibold sm:w-auto">{title}</span>

        <span className="w-full text-sm text-muted-foreground group-open:hidden">
          {teaser}
        </span>
      </summary>

      <div className="reading space-y-4 border-t border-rail px-4 py-4">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </details>
  );
}
