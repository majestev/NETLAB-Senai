import Link from "next/link";
import { CURRICULUM } from "@/lib/content/curriculum";
import { PRACTICE_LINKS, REFERENCE_LINKS } from "@/lib/content/practice";
import { SITE } from "@/lib/site";
import { Wordmark } from "./wordmark";

const EXTRAS = [
  { href: "/busca", label: "Busca" },
  { href: "/progresso", label: "Progresso" },
] as const;

export function SiteFooter({ compacto = false }: { compacto?: boolean }) {
  if (compacto) {
    return (
      <footer className="mt-16 border-t border-rail py-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 sm:px-6">
          <Wordmark />
          <p className="text-sm text-muted-foreground">{SITE.subtitle}</p>
          <nav aria-label="Complementar" className="ml-auto">
            <ul className="flex flex-wrap items-center gap-x-5">
              {EXTRAS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-16 border-t border-rail py-10">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Wordmark />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {SITE.title} — {SITE.subtitle}.
          </p>
        </div>

        <nav aria-label="Módulos do curso">
          <p className="silkscreen pb-3">Curso</p>
          <ul className="space-y-2">
            {CURRICULUM.map((m) => (
              <li key={m.id}>
                <Link
                  href={m.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {m.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Prática">
          <p className="silkscreen pb-3">Prática</p>
          <ul className="space-y-2">
            {PRACTICE_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Referência">
          <p className="silkscreen pb-3">Referência</p>
          <ul className="space-y-2">
            {[...REFERENCE_LINKS, ...EXTRAS].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
