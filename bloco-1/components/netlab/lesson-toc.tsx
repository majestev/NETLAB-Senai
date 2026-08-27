"use client";

import { useEffect, useRef, useState } from "react";
import type { OutlineItem } from "@/lib/content/outline";
import { cn } from "@/lib/utils";

export function LessonToc({ items }: { items: OutlineItem[] }) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const [progresso, setProgresso] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (items.length < 3) return;

    const alvos = items
      .map((i) => document.getElementById(i.id))
      .filter((n): n is HTMLElement => n !== null);
    if (alvos.length === 0) return;

    const observador = new IntersectionObserver(
      () => {
        const limite = window.innerHeight * 0.3;
        let corrente: string | null = null;
        for (const alvo of alvos) {
          if (alvo.getBoundingClientRect().top <= limite) corrente = alvo.id;
        }
        setAtivo(corrente ?? alvos[0]!.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] },
    );
    for (const alvo of alvos) observador.observe(alvo);

    const artigo = document.getElementById("conteudo-da-aula");
    function medir() {
      if (!artigo) return;
      const caixa = artigo.getBoundingClientRect();
      const lido = -caixa.top + window.innerHeight * 0.5;
      setProgresso(Math.max(0, Math.min(1, lido / caixa.height)));
    }
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);

    return () => {
      observador.disconnect();
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav
      ref={navRef}
      aria-labelledby="sumario-da-aula"
      className="sticky top-[calc(var(--header-h)+1.5rem)] hidden max-h-[calc(100dvh-var(--header-h)-2.5rem)] w-56 shrink-0 overflow-y-auto xl:block"
    >
      <p id="sumario-da-aula" className="silkscreen mb-3">
        Nesta página
      </p>
      <div className="relative">

        <span
          aria-hidden
          className="absolute left-0 top-0 w-px bg-copper transition-[height] duration-150 ease-out"
          style={{ height: `${progresso * 100}%` }}
        />
        <ul className="space-y-0.5 border-l border-rail">
          {items.map((item) => {
            const corrente = item.id === ativo;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={corrente ? "location" : undefined}
                  className={cn(
                    "-ml-px block border-l-2 py-1.5 pl-3 text-sm leading-snug transition-colors",
                    corrente
                      ? "border-copper font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:border-copper hover:text-foreground focus-visible:border-copper focus-visible:text-foreground",
                  )}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
