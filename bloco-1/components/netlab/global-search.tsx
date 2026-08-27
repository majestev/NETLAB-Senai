"use client";

import { useMemo, useState } from "react";
import { useParamState } from "@/lib/hooks/use-param-state";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KIND_LABEL, search, type SearchKind } from "@/lib/search";

const FILTROS: SearchKind[] = ["aula", "modulo", "simulador", "laboratorio", "termo"];

export function GlobalSearch() {
  const [consulta, setConsulta] = useParamState("q", "");
  const [ativos, setAtivos] = useState<SearchKind[]>([...FILTROS]);

  const resultados = useMemo(
    () => (consulta.trim() ? search(consulta, ativos) : []),
    [consulta, ativos],
  );

  return (
    <div>
      <div className="panel p-4">
        <Label htmlFor="busca" className="text-sm font-medium">
          O que você procura?
        </Label>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="busca"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="VLAN, sub-rede, convergência, CAM…"
            className="pl-9"
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <div className="mt-4">
          <p className="silkscreen mb-2">Filtrar por tipo</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar resultados por tipo">
            {FILTROS.map((kind) => {
              const ativo = ativos.includes(kind);
              return (
                <Button
                  key={kind}
                  size="sm"
                  variant={ativo ? "default" : "outline"}
                  className="h-7 text-xs"
                  aria-pressed={ativo}
                  onClick={() =>
                    setAtivos((atual) =>
                      ativo
                        ? atual.length > 1
                          ? atual.filter((k) => k !== kind)
                          : atual
                        : [...atual, kind],
                    )
                  }
                >
                  {KIND_LABEL[kind]}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6" aria-live="polite">
        {!consulta.trim() ? (
          <p className="text-sm text-muted-foreground">
            Digite para buscar em aulas, módulos, simuladores, laboratórios e no
            glossário. A busca ignora acentos: “comutacao” encontra “comutação”.
          </p>
        ) : resultados.length === 0 ? (
          <p className="panel p-6 text-sm text-muted-foreground">
            Nada encontrado para{" "}
            <span className="font-mono text-foreground">{consulta}</span> nos
            tipos selecionados.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
            </p>
            <ul className="space-y-2">
              {resultados.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    className="panel group flex items-start gap-4 p-4 transition-colors hover:bg-panel-raised"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="silkscreen block">{KIND_LABEL[r.kind]}</span>
                      <span className="mt-1 block font-medium">{r.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {r.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
