"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Ban, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIpv4, parseIpv4 } from "@/lib/net/ipv4";
import { decideRoute, routeRangeLabel } from "@/lib/net/routing";
import { DEMO_ROUTES, DEMO_SCENARIOS } from "@/lib/net/routing-demo";
import { PrefixMatchVisual } from "./prefix-match-visual";
import { cn } from "@/lib/utils";

export function RoutingDecision() {
  const [destinoRaw, setDestinoRaw] = useState("10.1.1.5");
  const [passo, setPasso] = useState<number | null>(null);

  const destino = useMemo(() => parseIpv4(destinoRaw), [destinoRaw]);
  const decisao = useMemo(
    () => (destino.ok ? decideRoute(destino.value, DEMO_ROUTES) : null),
    [destino],
  );

  const passoAtual =
    decisao && passo !== null
      ? decisao.steps[Math.min(passo, decisao.steps.length - 1)]
      : null;

  const sobreviventes = passoAtual
    ? new Set(passoAtual.survivorIds)
    : new Set(decisao?.chosen.map((r) => r.id) ?? []);

  function calcular() {
    setPasso(0);
  }

  return (
    <div className="space-y-6">
      <div className="panel p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <Label htmlFor="destino" className="text-sm font-medium">
              IP de destino
            </Label>
            <Input
              id="destino"
              value={destinoRaw}
              onChange={(e) => {
                setDestinoRaw(e.target.value);
                setPasso(null);
              }}
              className="mt-2 max-w-56 font-mono"
              spellCheck={false}
              aria-invalid={!destino.ok}
              aria-describedby={!destino.ok ? "destino-erro" : undefined}
            />
          </div>
          <Button onClick={calcular} disabled={!destino.ok} className="gap-2">
            <RouteIcon className="size-4" aria-hidden />
            Calcular melhor rota
          </Button>
        </div>
        {!destino.ok && (
          <p id="destino-erro" role="alert" className="mt-2 text-sm text-fault">
            {destino.error}
          </p>
        )}

        <div className="mt-4">
          <p className="silkscreen mb-2">Cenários</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_SCENARIOS.map((c) => (
              <Button
                key={c.ip}
                size="sm"
                variant="outline"
                className="h-7 font-mono text-xs"
                title={c.porque}
                onClick={() => {
                  setDestinoRaw(c.ip);
                  setPasso(0);
                }}
              >
                {c.ip}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">

        <div
          className="panel scroll-x"
          tabIndex={0}
          role="region"
          aria-label="Tabela de roteamento de R1"
        >
          <table className="w-full min-w-max text-sm">
            <caption className="sr-only">
              Tabela de roteamento de R1, com as entradas eliminadas esmaecidas
              conforme o passo selecionado
            </caption>
            <thead>
              <tr className="border-b border-rail bg-panel-sunken text-left">
                {["Situação", "Prefixo", "Faixa", "Origem", "AD", "Métrica", "Próximo salto", "Interface"].map(
                  (h) => (
                    <th key={h} scope="col" className="px-3 py-2.5 font-semibold">

                      {h === "Situação" ? <span className="sr-only">{h}</span> : h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {DEMO_ROUTES.map((rota) => {
                const viva = sobreviventes.has(rota.id);
                const escolhida = decisao?.chosen.some((c) => c.id === rota.id);
                const mostrarEstado = passo !== null;
                return (
                  <tr
                    key={rota.id}
                    className={cn(
                      "border-b border-rail transition-opacity last:border-b-0",
                      mostrarEstado && !viva && "opacity-35",
                      mostrarEstado && escolhida && passoAtual === null && "bg-signal-soft",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      {mostrarEstado && (
                        <span
                          aria-hidden
                          className={cn(
                            "block size-2 rounded-full",
                            viva ? "bg-signal" : "bg-rail-strong",
                          )}
                        />
                      )}
                      <span className="sr-only">
                        {mostrarEstado
                          ? viva
                            ? "ainda candidata"
                            : "eliminada"
                          : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {formatIpv4(rota.network)}/{rota.prefix}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      {routeRangeLabel(rota)}
                    </td>
                    <td className="px-3 py-2.5">{rota.source}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{rota.ad}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{rota.metric}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {rota.nextHop === null ? "—" : formatIpv4(rota.nextHop)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{rota.iface}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3" aria-live="polite">
          {passo === null ? (
            <div className="panel p-4 text-sm text-muted-foreground">
              Informe um destino e calcule para ver a decisão passo a passo.
            </div>
          ) : (
            <>
              <ol className="space-y-2" aria-label="Passos da decisão">
                {decisao?.steps.map((s, index) => {
                  const ativo = index === passo;
                  const passado = index < passo;
                  return (
                    <li key={s.kind}>
                      <button
                        type="button"
                        onClick={() => setPasso(index)}
                        aria-current={ativo ? "step" : undefined}
                        className={cn(
                          "w-full rounded-sm border p-3 text-left transition-colors",
                          ativo
                            ? "border-copper bg-copper-soft"
                            : passado
                              ? "border-rail bg-panel"
                              : "border-rail bg-panel opacity-70 hover:opacity-100",
                        )}
                      >
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          <span className="font-mono text-xs text-copper">
                            {index + 1}
                          </span>
                          {s.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {s.explanation}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={passo === 0}
                  onClick={() => setPasso((p) => Math.max(0, (p ?? 0) - 1))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!decisao || passo >= decisao.steps.length - 1}
                  onClick={() =>
                    setPasso((p) =>
                      Math.min((decisao?.steps.length ?? 1) - 1, (p ?? 0) + 1),
                    )
                  }
                >
                  Próximo
                </Button>
              </div>

              {decisao && (
                <div
                  className={cn(
                    "panel p-4",
                    decisao.dropped ? "border-fault/40 bg-fault-soft" : "border-signal/40 bg-signal-soft",
                  )}
                >
                  <p className="silkscreen mb-2">Resultado</p>
                  {decisao.dropped ? (
                    <p className="flex items-start gap-2 text-sm">
                      <Ban className="mt-0.5 size-4 shrink-0 text-fault" aria-hidden />
                      Pacote descartado: nenhuma rota casa com{" "}
                      <span className="font-mono">{destinoRaw}</span>.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {decisao.chosen.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="size-3.5 shrink-0 text-signal" aria-hidden />
                          <span className="font-mono text-xs">
                            {formatIpv4(r.network)}/{r.prefix} via{" "}
                            {r.nextHop === null ? "conectada" : formatIpv4(r.nextHop)},{" "}
                            {r.iface}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {destino.ok && (
        <section>
          <h2 className="text-base font-semibold">
            Por que o prefixo mais longo vence
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            Os 32 bits do destino, revelados da esquerda para a direita. Cada
            rota acompanha enquanto a máscara dela alcançar; no bit em que
            diverge, ela cai.
          </p>
          <PrefixMatchVisual

            key={destino.value}
            destination={destino.value}
            routes={DEMO_ROUTES}
          />
        </section>
      )}
    </div>
  );
}
