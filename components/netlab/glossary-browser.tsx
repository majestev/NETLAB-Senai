"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceBadge } from "./source-badge";
import { GLOSSARY } from "@/lib/content/glossary";
import { slugifyTerm } from "@/lib/search";
import { getLessonByHref } from "@/lib/content/curriculum";
import { cn } from "@/lib/utils";

function normalizar(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function GlossaryBrowser() {
  const [consulta, setConsulta] = useState("");

  const origensMisturadas = useMemo(
    () => new Set(GLOSSARY.map((g) => g.source)).size > 1,
    [],
  );

  const resultados = useMemo(() => {
    const q = normalizar(consulta.trim());
    const lista = q
      ? GLOSSARY.filter(
          (e) =>
            normalizar(e.term).includes(q) ||
            e.aliases?.some((a) => normalizar(a).includes(q)) ||
            normalizar(e.definition).includes(q),
        )
      : GLOSSARY;
    return [...lista].sort((a, b) => a.term.localeCompare(b.term, "pt-BR"));
  }, [consulta]);

  const letras = useMemo(() => {
    const mapa = new Map<string, typeof resultados>();
    for (const entry of resultados) {
      const letra = normalizar(entry.term).charAt(0).toUpperCase();
      mapa.set(letra, [...(mapa.get(letra) ?? []), entry]);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [resultados]);

  return (
    <div>
      <div className="panel sticky top-[var(--header-h)] z-10 p-4">
        <Label htmlFor="glossario-busca" className="text-sm font-medium">
          Buscar termo
        </Label>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="glossario-busca"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="TTL, VLAN, CAM, split horizon…"
            className="pl-9"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
          {resultados.length} de {GLOSSARY.length} verbetes
        </p>
      </div>

      {resultados.length === 0 ? (
        <p className="panel mt-6 p-6 text-sm text-muted-foreground">
          Nenhum verbete corresponde a{" "}
          <span className="font-mono text-foreground">{consulta}</span>. Tente um
          termo mais curto ou a sigla.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {letras.map(([letra, verbetes]) => (
            <section key={letra} aria-labelledby={`letra-${letra}`}>

              <h2
                id={`letra-${letra}`}
                className="mb-2 flex items-center gap-3 font-mono text-lg font-semibold text-copper"
              >
                {letra}
                <span aria-hidden className="h-px flex-1 bg-rail" />
                <span className="silkscreen">
                  {verbetes.length} {verbetes.length === 1 ? "termo" : "termos"}
                </span>
              </h2>

              <dl className="overflow-hidden rounded-md border border-rail">
                {verbetes.map((entry, n) => {
                  const aula = entry.lesson
                    ? getLessonByHref(entry.lesson)
                    : undefined;
                  const temDetalhe =
                    Boolean(entry.example) || (entry.related?.length ?? 0) > 0;

                  return (
                    <div
                      key={entry.term}
                      id={slugifyTerm(entry.term)}
                      className={cn(
                        "scroll-mt-36 bg-panel px-4 py-3",
                        "sm:grid sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-5",
                        n > 0 && "border-t border-rail",
                      )}
                    >
                        <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="font-semibold">{entry.term}</span>
                          {entry.layer && (
                            <span className="silkscreen">{`L${entry.layer}`}</span>
                          )}
                          {entry.aliases && entry.aliases.length > 0 && (
                            <span className="w-full font-mono text-xs text-muted-foreground">
                              {entry.aliases.join(" · ")}
                            </span>
                          )}
                          {origensMisturadas && (
                            <SourceBadge source={entry.source} compact />
                          )}
                        </dt>

                        <dd className="mt-1.5 text-[0.9375rem] leading-relaxed sm:mt-0">
                          {entry.definition}

                          {aula && (
                            <span className="mt-1.5 block text-sm">
                              <Link
                                href={aula.href}
                                className="text-fiber underline-offset-4 hover:underline"
                              >
                                {aula.title}
                              </Link>
                            </span>
                          )}

                          {temDetalhe && (
                            <details className="group mt-1.5">
                              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-fiber">
                                <ChevronRight
                                  className="size-3 transition-transform group-open:rotate-90"
                                  aria-hidden
                                />
                                Exemplo e relacionados
                              </summary>
                              <div className="mt-2 space-y-2 border-l border-rail pl-3">
                                {entry.example && (
                                  <p className="text-sm text-muted-foreground">
                                    Exemplo:{" "}
                                    <span className="font-mono text-foreground">
                                      {entry.example}
                                    </span>
                                  </p>
                                )}
                                {entry.related && entry.related.length > 0 && (
                                  <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    Relacionados:
                                    {entry.related.map((termo) => (
                                      <a
                                        key={termo}
                                        href={`#${slugifyTerm(termo)}`}
                                        onClick={() => setConsulta("")}
                                        className="inline-flex min-h-6 items-center rounded-sm border border-rail px-2 py-1 text-xs text-fiber transition-colors hover:border-fiber hover:bg-fiber-soft"
                                      >
                                        {termo}
                                      </a>
                                    ))}
                                  </p>
                                )}
                              </div>
                            </details>
                          )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
