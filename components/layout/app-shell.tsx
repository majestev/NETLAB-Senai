"use client";

import { usePathname } from "next/navigation";
import { ProgressProvider } from "@/components/progress-provider";
import { PageTransition } from "@/components/netlab/motion/page-transition";
import { SiteHeader } from "./site-header";
import { SidebarNav } from "./sidebar-nav";
import { SiteFooter } from "./site-footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const withSidebar = pathname !== "/";

  return (
    <ProgressProvider>

      <div
        aria-hidden
        className="tech-grid tech-grid-drift pointer-events-none fixed inset-0 -z-10"
      />
      <a
        href="#conteudo"
        className="sr-only rounded-sm bg-copper px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50"
      >
        Ir para o conteúdo
      </a>

      <SiteHeader />

      {withSidebar ? (
        <div className="mx-auto flex w-full max-w-[1600px] px-4 sm:px-6">
          <aside
            className="sticky top-[var(--header-h)] hidden h-[calc(100dvh-var(--header-h))] w-64 shrink-0 overflow-y-auto border-r border-rail py-4 pr-3 lg:block"
            aria-label="Trilha do curso"
          >
            <SidebarNav />
          </aside>
          <div className="min-w-0 flex-1">
            <main id="conteudo" className="min-w-0 py-8 lg:pl-8">
              <PageTransition>{children}</PageTransition>
            </main>
            <SiteFooter compacto />
          </div>
        </div>
      ) : (
        <>
          <main id="conteudo">
            <PageTransition>{children}</PageTransition>
          </main>
          <SiteFooter />
        </>
      )}
    </ProgressProvider>
  );
}
