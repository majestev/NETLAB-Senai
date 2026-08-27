"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Wordmark } from "./wordmark";
import { ThemeToggle } from "./theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import { SearchTrigger } from "./search-trigger";
import {
  CommandPaletteLazy,
  prefetchCommandPalette,
} from "./command-palette-lazy";
import { useProgress } from "@/components/progress-provider";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/curso", label: "Curso" },
  { href: "/laboratorios", label: "Laboratórios" },
  { href: "/simuladores", label: "Simuladores" },
  { href: "/exercicios", label: "Exercícios" },
  { href: "/glossario", label: "Glossário" },
] as const;

function ProgressChip() {
  const { percent, loading } = useProgress();
  return (
    <Link
      href="/progresso"
      className="hidden h-9 items-center gap-2 rounded-sm border border-rail px-3 text-sm transition-colors hover:border-rail-strong md:flex"
      aria-label={
        loading ? "Ver seu progresso" : `Seu progresso: ${percent}% do curso`
      }
    >
      <span className="silkscreen">Progresso</span>
      <span className="font-mono text-sm tabular-nums text-copper">
        {loading ? "—" : `${percent}%`}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [paletteMontada, setPaletteMontada] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const raiz = document.documentElement;
    const aoRolar = () => {
      raiz.dataset.rolado = window.scrollY > 12 ? "true" : "false";
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      delete raiz.dataset.rolado;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteMontada(true);
        setPaletteOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="header-borda sticky top-0 z-20 border-b bg-background/95 backdrop-blur-[2px]">
        <div className="mx-auto flex h-[var(--header-h)] max-w-[1600px] items-center gap-2 px-4 transition-[height] duration-300 ease-panel sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden"
            aria-label="Abrir navegação do curso"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </Button>

          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent
              side="left"
              className="w-[19rem] overflow-y-auto p-0 sm:w-[21rem]"
            >
              <SheetHeader className="border-b border-rail px-4 py-3">
                <SheetTitle className="sr-only">Navegação do curso</SheetTitle>
                <Wordmark />
              </SheetHeader>
              <div className="px-2 py-3">
                <SidebarNav onNavigate={() => setDrawerOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Wordmark className="mr-1 shrink-0" />

          <a
            href={SITE.author.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 border-l border-rail py-1 pl-3 pr-1 text-sm text-muted-foreground transition-colors hover:text-foreground xl:block"
            title={`${SITE.author.name} no GitHub`}
          >
            {SITE.author.name}
          </a>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-sm px-3 py-2 text-sm transition-colors",
                        active
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SearchTrigger
              onOpen={() => {
                setPaletteMontada(true);
                setPaletteOpen(true);
              }}
              onPrefetch={prefetchCommandPalette}
            />
            <ProgressChip />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {paletteMontada && (
        <CommandPaletteLazy open={paletteOpen} onOpenChange={setPaletteOpen} />
      )}
    </>
  );
}
