"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { CURRICULUM } from "@/lib/content/curriculum";
import { PRACTICE_LINKS, REFERENCE_LINKS } from "@/lib/content/practice";
import { useProgress } from "@/components/progress-provider";
import { cn } from "@/lib/utils";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="silkscreen px-3 pb-2 pt-5 first:pt-0">{children}</p>;
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isCompleted } = useProgress();

  return (
    <nav aria-label="Navegação do curso" className="pb-10">
      <SectionLabel>Curso</SectionLabel>
      <ul className="space-y-0.5">
        {CURRICULUM.map((module) => {
          const moduleActive = pathname.startsWith(module.href);
          return (
            <li key={module.id}>
              <Link
                href={module.href}
                onClick={onNavigate}
                aria-current={pathname === module.href ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
                  "hover:bg-sidebar-accent",
                  pathname === module.href
                    ? "bg-sidebar-accent font-semibold text-foreground"
                    : "text-foreground/85",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "w-5 shrink-0 font-mono text-2xs tabular-nums",
                    moduleActive ? "text-copper" : "text-muted-foreground",
                  )}
                >
                  {module.number}
                </span>
                <span className="min-w-0 truncate">{module.short}</span>
              </Link>

              {moduleActive && module.lessons.length > 0 && (
                <ul className="ml-[1.6rem] space-y-0.5 border-l border-rail pb-1 pl-0">
                  {module.lessons.map((lesson) => {
                    const active = pathname === lesson.href;
                    const done = isCompleted(lesson.href);
                    return (
                      <li key={lesson.href}>
                        <Link
                          href={lesson.href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-sm transition-colors",
                            active
                              ? "border-copper font-medium text-foreground"
                              : "border-transparent text-muted-foreground hover:border-rail-strong hover:text-foreground",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {lesson.short}
                          </span>
                          {done && (
                            <Check
                              className="size-3.5 shrink-0 text-signal"
                              aria-label="Aula concluída"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <SectionLabel>Prática</SectionLabel>
      <ul className="space-y-0.5">
        {PRACTICE_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "block rounded-sm px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                pathname.startsWith(item.href)
                  ? "bg-sidebar-accent font-semibold text-foreground"
                  : "text-foreground/85",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <SectionLabel>Referência</SectionLabel>
      <ul className="space-y-0.5">
        {REFERENCE_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "block rounded-sm px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                pathname.startsWith(item.href)
                  ? "bg-sidebar-accent font-semibold text-foreground"
                  : "text-foreground/85",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
