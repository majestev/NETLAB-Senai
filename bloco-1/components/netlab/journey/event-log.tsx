"use client";

import { useEffect, useRef } from "react";
import type { JourneyEvent } from "@/lib/net/journey-events";
import { cn } from "@/lib/utils";

export function EventLog({
  eventos,
  atual,
  onIr,
  className,
}: {
  eventos: JourneyEvent[];
  atual: number;
  onIr: (index: number) => void;
  className?: string;
}) {
  const listaRef = useRef<HTMLOListElement>(null);
  const ativoRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const caixa = listaRef.current?.parentElement;
    const ativo = ativoRef.current;
    if (!caixa || !ativo) return;

    const l = caixa.getBoundingClientRect();
    const a = ativo.getBoundingClientRect();
    if (a.top < l.top || a.bottom > l.bottom) {
      caixa.scrollTop += a.top - l.top - caixa.clientHeight / 2 + a.height / 2;
    }
  }, [atual]);

  const visiveis = eventos.slice(0, atual + 1);

  return (
    <div className={cn("panel overflow-hidden", className)}>
      <p className="border-b border-rail bg-panel-sunken px-3 py-2">
        <span className="silkscreen">Registro de eventos</span>
      </p>

      <div
        className="max-h-64 overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label="Registro de eventos da simulação"
      >
      <ol ref={listaRef}>
        {visiveis.map((e) => {
          const ativo = e.index === atual;
          return (
            <li key={e.id} ref={ativo ? ativoRef : undefined}>
              <button
                type="button"
                onClick={() => onIr(e.index)}
                aria-current={ativo ? "step" : undefined}
                className={cn(
                  "flex w-full items-baseline gap-2.5 border-b border-rail px-3 py-2 text-left transition-colors last:border-b-0",
                  ativo
                    ? "bg-copper-soft"
                    : "hover:bg-panel-raised focus-visible:bg-panel-raised",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-2xs tabular-nums",
                    ativo ? "text-copper" : "text-muted-foreground",
                  )}
                >
                  {String(e.index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm",
                      ativo ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {e.title}
                  </span>
                </span>
                <span
                  className={cn(
                    "font-mono text-2xs",
                    e.layer === 2 && "text-layer2",
                    e.layer === 3 && "text-layer3",
                    e.layer === 7 && "text-layer7",
                  )}
                >
                  L{e.layer}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      </div>
    </div>
  );
}
