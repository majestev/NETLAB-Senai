import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { cn } from "@/lib/utils";
import { BreadcrumbJsonLd } from "./structured-data";

export function PageHeader({
  eyebrow,
  title,
  summary,
  trail,
  aside,
}: {
  eyebrow?: string;
  title: string;
  summary?: string;
  trail?: Crumb[];
  aside?: React.ReactNode;
}) {
  return (
    <header className="mb-8">

      {trail && trail.length > 0 && (
        <>
          <BreadcrumbJsonLd trail={trail} />
          <Breadcrumbs trail={trail} />
        </>
      )}

      {eyebrow && <p className="silkscreen mt-4">{eyebrow}</p>}
      <div className={cn("flex flex-wrap items-start justify-between gap-4", eyebrow ? "mt-2" : "mt-4")}>
        <h1 className="max-w-[24ch] text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {aside}
      </div>

      {summary && (
        <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
          {summary}
        </p>
      )}
    </header>
  );
}
