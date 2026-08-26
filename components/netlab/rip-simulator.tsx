"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Unplug, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SimulationControls,
  type Velocidade,
} from "./journey/simulation-controls";
import { DEVICE_SYMBOL, DeviceSymbols } from "./device-symbols";
import { DeviceStatus } from "./motion/device-status";
import { parseIpv4 } from "@/lib/net/ipv4";
import {
  RIP_INFINITY,
  formatNetworkKey,
  isReachable,
  networkKey,
  poisonRoutesOverLink,
  runRip,
  type RipChange,
  type RipIteration,
  type RipTables,
  type RipTopology,
} from "@/lib/net/rip";
import { cn } from "@/lib/utils";

const ip = (v: string) => {
  const r = parseIpv4(v);
  if (!r.ok) throw new Error(v);
  return r.value;
};

const MAX_ITERACOES = 30;

function topologia(l12: boolean, l23: boolean): RipTopology {
  return {
    routers: [
      { id: "r1", name: "R1" },
      { id: "r2", name: "R2" },
      { id: "r3", name: "R3" },
    ],
    links: [
      { id: "lan1", a: "r1", b: "r1", network: ip("192.168.1.0"), prefix: 24, up: true },
      { id: "l12", a: "r1", b: "r2", network: ip("10.0.12.0"), prefix: 30, up: l12 },
      { id: "l23", a: "r2", b: "r3", network: ip("10.0.23.0"), prefix: 30, up: l23 },
      { id: "lan3", a: "r3", b: "r3", network: ip("192.168.3.0"), prefix: 24, up: true },
    ],
  };
}

const REDE_OBSERVADA = networkKey(ip("192.168.3.0"), 24);

interface Fase {
  id: string;
  rotulo: string;
  topo: RipTopology;
  iteracoes: RipIteration[];

  envenenadas: RipChange[];
}

function faseInicial(splitHorizon: boolean): Fase {
  const topo = topologia(true, true);
  return {
    id: "inicial",
    rotulo: "Convergência inicial",
    topo,
    iteracoes: runRip(topo, { splitHorizon }, MAX_ITERACOES),
    envenenadas: [],
  };
}

export function RipSimulator() {
  const [splitHorizon, setSplitHorizon] = useState(true);
  const [envenenamento, setEnvenenamento] = useState(true);
  const [fases, setFases] = useState<Fase[]>(() => [faseInicial(true)]);
  const [faseIdx, setFaseIdx] = useState(0);
  const [iteracao, setIteracao] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);

  const fase = fases[faseIdx];
  const topo = fase.topo;
  const l12 = topo.links.find((l) => l.id === "l12")!.up;
  const l23 = topo.links.find((l) => l.id === "l23")!.up;

  const atual = fase.iteracoes[Math.min(iteracao, fase.iteracoes.length - 1)];
  const ultima = iteracao >= fase.iteracoes.length - 1;
  const convergiu = fase.iteracoes.at(-1)?.converged ?? false;

  const rodando = tocando && !ultima;

  useEffect(() => {
    if (!rodando) return;
    const t = window.setTimeout(
      () => setIteracao((i) => Math.min(fase.iteracoes.length - 1, i + 1)),
      1400 / velocidade,
    );
    return () => window.clearTimeout(t);
  }, [rodando, iteracao, velocidade, fase.iteracoes.length]);

  function irPara(n: number) {
    setTocando(false);
    setIteracao(Math.max(0, Math.min(fase.iteracoes.length - 1, n)));
  }

  const reiniciar = useCallback(
    (split = splitHorizon) => {
      setFases([faseInicial(split)]);
      setFaseIdx(0);
      setIteracao(0);
    },
    [splitHorizon],
  );

  function alternarEnlace(linkId: "l12" | "l23") {
    const derrubando = linkId === "l12" ? l12 : l23;
    const novaTopo = topologia(
      linkId === "l12" ? !l12 : l12,
      linkId === "l23" ? !l23 : l23,
    );
    const nome = linkId === "l12" ? "R1–R2" : "R2–R3";

    let semente: RipTables = atual.tables;
    let envenenadas: RipChange[] = [];
    if (derrubando) {
      const r = poisonRoutesOverLink(
        atual.tables,
        linkId,
        envenenamento ? "envenenar" : "expirar",
      );
      semente = r.tables;
      envenenadas = r.changes;
    }

    const nova: Fase = {
      id: `${linkId}-${fases.length}`,
      rotulo: derrubando
        ? `Queda do enlace ${nome}`
        : `Enlace ${nome} restabelecido`,
      topo: novaTopo,
      iteracoes: runRip(novaTopo, { splitHorizon }, MAX_ITERACOES, semente),
      envenenadas,
    };

    setFases((f) => [...f.slice(0, faseIdx + 1), nova]);
    setFaseIdx(faseIdx + 1);
    setIteracao(0);
  }

  const serie = useMemo(
    () =>
      fase.iteracoes.map((it) => ({
        index: it.index,
        r1: it.tables.r1?.find((r) => r.key === REDE_OBSERVADA)?.metric ?? null,
        r2: it.tables.r2?.find((r) => r.key === REDE_OBSERVADA)?.metric ?? null,
      })),
    [fase],
  );

  const contandoAoInfinito = useMemo(() => {
    const vals = serie.map((s) => s.r2).filter((m): m is number => m !== null);
    const finitos = vals.filter((m) => m < RIP_INFINITY);
    return finitos.length > 2 && finitos.some((m, i) => i > 0 && m > finitos[i - 1]!);
  }, [serie]);

  return (
    <div className="space-y-5">
      <DeviceSymbols />

      <figure className="panel overflow-hidden bg-panel-sunken">
        <div className="scroll-x" tabIndex={0} role="region" aria-label="Topologia RIP (rolável)">
          <svg
            viewBox="0 0 660 170"
            className="h-auto w-full min-w-[34rem]"
            role="group"
            aria-labelledby="rip-topo-title rip-topo-desc"
          >
            <title id="rip-topo-title">Topologia RIP com três roteadores</title>
            <desc id="rip-topo-desc">
              R1 conectado a R2 pela rede 10.0.12.0/30 e R2 conectado a R3 pela
              rede 10.0.23.0/30. R1 tem a LAN 192.168.1.0/24 e R3 tem a LAN
              192.168.3.0/24. As tabelas de roteamento abaixo trazem os mesmos
              dados em texto.
            </desc>

            {[
              { id: "l12", from: "r1", to: "r2", rede: "10.0.12.0/30", up: l12 },
              { id: "l23", from: "r2", to: "r3", rede: "10.0.23.0/30", up: l23 },
            ].map((l) => (
              <g key={l.id}>
                <line
                  x1={X[l.from] + 30}
                  y1={70}
                  x2={X[l.to] - 30}
                  y2={70}
                  stroke={l.up ? "var(--signal)" : "var(--fault)"}
                  strokeWidth={l.up ? 2.5 : 2}
                  strokeDasharray={l.up ? undefined : "5 4"}
                />
                {!l.up && (
                  <g transform={`translate(${(X[l.from] + X[l.to]) / 2}, 70)`}>
                    <circle r="11" fill="var(--panel)" stroke="var(--fault)" strokeWidth="2" />
                    <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="var(--fault)" strokeWidth="2" strokeLinecap="round" />
                  </g>
                )}
                <text
                  x={(X[l.from] + X[l.to]) / 2}
                  y={l.up ? 60 : 100}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="11"
                  fill={l.up ? "var(--muted-foreground)" : "var(--fault)"}
                >
                  {l.up ? l.rede : `${l.rede} — enlace caído`}
                </text>
              </g>
            ))}

            {topo.routers.map((r) => {
              const isolado =
                (r.id === "r1" && !l12) ||
                (r.id === "r3" && !l23) ||
                (r.id === "r2" && !l12 && !l23);
              return (
                <g key={r.id}>
                  <rect
                    x={X[r.id] - 26}
                    y={44}
                    width="52"
                    height="52"
                    rx="5"
                    fill="var(--panel)"
                    stroke={isolado ? "var(--fault)" : "var(--rail-strong)"}
                    strokeWidth="1.5"
                  />
                  <use
                    href={DEVICE_SYMBOL.router}
                    x={X[r.id] - 16}
                    y={54}
                    width="32"
                    height="32"
                    stroke={isolado ? "var(--fault)" : "var(--foreground)"}
                    fill="none"
                  />
                  <text
                    x={X[r.id]}
                    y={118}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize="12"
                    fontWeight="600"
                    fill="var(--foreground)"
                  >
                    {r.name}
                  </text>
                </g>
              );
            })}

            {[
              { r: "r1", rede: "192.168.1.0/24" },
              { r: "r3", rede: "192.168.3.0/24" },
            ].map((lan) => (
              <text
                key={lan.r}
                x={X[lan.r]}
                y={136}
                textAnchor="middle"
                className="font-mono"
                fontSize="10"
                fill="var(--muted-foreground)"
              >
                {lan.rede}
              </text>
            ))}
          </svg>
        </div>

        <figcaption className="flex flex-wrap items-center gap-2 border-t border-rail px-3 py-2">
          <Button
            size="sm"
            variant={l12 ? "outline" : "destructive"}
            className="hit-44 gap-1.5 text-xs"
            onClick={() => alternarEnlace("l12")}
          >
            <Unplug className="size-3.5" aria-hidden />
            {l12 ? "Derrubar R1–R2" : "Restabelecer R1–R2"}
          </Button>
          <Button
            size="sm"
            variant={l23 ? "outline" : "destructive"}
            className="hit-44 gap-1.5 text-xs"
            onClick={() => alternarEnlace("l23")}
          >
            <Unplug className="size-3.5" aria-hidden />
            {l23 ? "Derrubar R2–R3" : "Restabelecer R2–R3"}
          </Button>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto">
            <DeviceStatus state={l12 ? "online" : "offline"} label={`R1–R2 ${l12 ? "ativo" : "caído"}`} />
            <DeviceStatus state={l23 ? "online" : "offline"} label={`R2–R3 ${l23 ? "ativo" : "caído"}`} />
          </span>
        </figcaption>
      </figure>

      <fieldset className="panel p-4">
        <legend className="silkscreen px-1">Mecanismos de proteção</legend>
        <p className="mb-3 text-sm text-muted-foreground">
          Os dois são desligáveis de propósito. A contagem ao infinito só
          aparece quando os dois estão desligados, e é assim que se enxerga
          para que cada um serve.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer gap-3 rounded-sm border border-rail p-3 transition-colors hover:border-rail-strong">
            <input
              type="checkbox"
              checked={splitHorizon}
              onChange={(e) => {
                setSplitHorizon(e.target.checked);
                reiniciar(e.target.checked);
              }}
              className="hit-44 mt-0.5 size-4 shrink-0 accent-[var(--copper)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Split horizon</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Não reanunciar uma rota de volta para o vizinho que a ensinou.
                Impede o laço de dois roteadores.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-sm border border-rail p-3 transition-colors hover:border-rail-strong">
            <input
              type="checkbox"
              checked={envenenamento}
              onChange={(e) => {
                setEnvenenamento(e.target.checked);
                reiniciar();
              }}
              className="hit-44 mt-0.5 size-4 shrink-0 accent-[var(--copper)]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">
                Envenenamento de rota
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Ao cair o enlace, anunciar a rota com métrica 16 na hora, em vez
                de esperar o temporizador <span className="font-mono">invalid</span>{" "}
                vencer em silêncio.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rail pt-3">
          <p className="min-w-[15rem] flex-1 text-xs text-muted-foreground">
            {!splitHorizon && !envenenamento
              ? "Configuração vulnerável: derrube o enlace R2–R3 e acompanhe a métrica de R2 subir de salto em salto até 16."
              : splitHorizon && envenenamento
                ? "Configuração protegida por dois mecanismos independentes. A queda de um enlace converge em poucas rodadas."
                : splitHorizon
                  ? "Split horizon sozinho já basta nesta topologia em linha: R1 não devolve a R2 a rota que aprendeu dele."
                  : "Sem split horizon, só o envenenamento evita o laço, e ele depende de o anúncio chegar antes do vizinho reanunciar."}
          </p>
          <Button size="sm" variant="ghost" className="hit-44 gap-1.5" onClick={() => reiniciar()}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reiniciar cenário
          </Button>
        </div>
      </fieldset>

      {fases.length > 1 && (
        <nav aria-label="Fases da simulação" className="panel p-3">
          <p className="silkscreen mb-2">Linha do tempo</p>
          <ol className="flex flex-wrap gap-2">
            {fases.map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    setTocando(false);
                    setFaseIdx(i);
                    setIteracao(0);
                  }}
                  aria-current={i === faseIdx ? "step" : undefined}
                  className={cn(
                    "hit-44 rounded-sm border px-2.5 py-1.5 text-xs transition-colors",
                    i === faseIdx
                      ? "border-copper bg-copper-soft text-copper"
                      : "border-rail text-muted-foreground hover:border-rail-strong hover:text-foreground",
                  )}
                >
                  <span className="font-mono">{i + 1}.</span> {f.rotulo}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="panel space-y-2.5 p-3">
        <SimulationControls
          tocando={rodando}
          onTocar={setTocando}
          onPassoAtras={() => irPara(iteracao - 1)}
          onPassoFrente={() => irPara(iteracao + 1)}
          onReiniciar={() => irPara(0)}
          podeVoltar={iteracao > 0}
          podeAvancar={!ultima}
          velocidade={velocidade}
          onVelocidade={setVelocidade}

          passoLabel="Rodada"
        />

        <div className="flex flex-wrap items-baseline gap-3 border-t border-rail pt-2.5">

          <p
            className="min-w-[15rem] flex-1 text-sm text-muted-foreground"
            aria-live="polite"
          >
            <span className="silkscreen mr-2">
              {fase.rotulo} · iteração {atual.index} de {fase.iteracoes.length - 1}
            </span>
            {atual.index === 0
              ? fase.envenenadas.length > 0
                ? `${fase.envenenadas.length} ${fase.envenenadas.length === 1 ? "rota passou" : "rotas passaram"} a inalcançável no instante da falha.`
                : "Estado inicial: cada roteador só conhece as redes conectadas."
              : atual.converged
                ? "Nenhuma mudança nesta rodada: a rede convergiu."
                : `${atual.changes.length} ${atual.changes.length === 1 ? "mudança" : "mudanças"} nesta rodada.`}
          </p>
          {convergiu && ultima && (
            <span className="flex items-center gap-1.5 text-sm text-signal">
              <Zap className="size-4" aria-hidden />
              Convergida em {fase.iteracoes.length - 1}{" "}
              {fase.iteracoes.length - 1 === 1 ? "iteração" : "iterações"}
            </span>
          )}
        </div>
      </div>

      <MetricaAoLongoDoTempo
        serie={serie}
        iteracaoAtual={atual.index}
        contandoAoInfinito={contandoAoInfinito}
        protegido={splitHorizon || envenenamento}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {topo.routers.map((r) => {
          const tabela = atual.tables[r.id] ?? [];
          const mudouAgora = new Set(
            atual.changes.filter((c) => c.routerId === r.id).map((c) => c.networkKey),
          );
          return (
            <div key={r.id} className="panel overflow-hidden">
              <p className="border-b border-rail bg-panel-sunken px-3 py-2 font-mono text-sm font-semibold">
                {r.name}
              </p>
              <div className="scroll-x" tabIndex={0} role="region" aria-label={`Tabela de roteamento de ${r.name}`}>
                <table className="w-full min-w-max text-sm">
                  <caption className="sr-only">
                    Tabela de roteamento de {r.name} na iteração {atual.index}
                  </caption>
                  <thead>
                    <tr className="border-b border-rail text-left">
                      <th scope="col" className="px-3 py-2 font-medium">Rede</th>
                      <th scope="col" className="px-3 py-2 font-medium">Saltos</th>
                      <th scope="col" className="px-3 py-2 font-medium">Via</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabela.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-3 text-sm text-muted-foreground">
                          Sem rotas.
                        </td>
                      </tr>
                    )}
                    {tabela.map((rota) => {
                      const inalcancavel = !isReachable(rota);
                      return (
                        <tr
                          key={rota.key}
                          className={cn(
                            "border-b border-rail last:border-b-0",
                            mudouAgora.has(rota.key) && "bg-copper-soft",
                          )}
                        >
                          <td className="px-3 py-2 font-mono text-xs">
                            {formatNetworkKey(rota.key)}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs tabular-nums">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1",
                                inalcancavel && "text-fault",
                                rota.metric === 0 && "text-signal",
                              )}
                            >
                              {inalcancavel ? "16" : rota.metric}
                              {inalcancavel && (
                                <span className="text-2xs font-semibold uppercase tracking-wider">
                                  inalcançável
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {rota.via === null
                              ? "conectada"
                              : topo.routers.find((x) => x.id === rota.via)?.name}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {(atual.changes.length > 0 || (atual.index === 0 && fase.envenenadas.length > 0)) && (
        <div className="panel p-4">
          <p className="silkscreen mb-3">
            {atual.index === 0 ? "O que a falha invalidou" : "O que mudou nesta rodada"}
          </p>
          <ul className="space-y-2">
            {(atual.index === 0 ? fase.envenenadas : atual.changes).map((c, i) => (
              <li key={`${c.routerId}-${c.networkKey}-${i}`} className="text-sm">
                <span className="font-mono text-xs text-copper">
                  {topo.routers.find((r) => r.id === c.routerId)?.name}
                </span>{" "}
                <span className="text-muted-foreground">
                  {c.reason === "rota-nova" && "aprendeu"}
                  {c.reason === "metrica-melhor" && "melhorou a métrica de"}
                  {c.reason === "atualizacao-do-proximo-salto" &&
                    "recebeu atualização do próximo salto para"}
                  {c.reason === "envenenada" && "marcou como inalcançável"}
                </span>{" "}
                <span className="font-mono text-xs">{formatNetworkKey(c.networkKey)}</span>{" "}
                <span className="text-muted-foreground">
                  {c.from === null ? "" : `de ${c.from} `}
                  para {c.to === RIP_INFINITY ? "16 (inalcançável)" : c.to}{" "}
                  {c.to === 1 ? "salto" : "saltos"}
                  {c.via && ` via ${topo.routers.find((r) => r.id === c.via)?.name}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TemporizadoresRip />

      <p className="text-sm text-muted-foreground">
        A métrica do RIP é a contagem de saltos, e o valor 16 significa
        inalcançável: é esse teto que impede a contagem ao infinito de crescer
        para sempre. Para ver o problema que os mecanismos acima resolvem,
        desligue os dois, avance até a rede convergir e então derrube o enlace
        R2–R3.
      </p>
    </div>
  );
}

const X: Record<string, number> = { r1: 110, r2: 330, r3: 550 };

function MetricaAoLongoDoTempo({
  serie,
  iteracaoAtual,
  contandoAoInfinito,
  protegido,
}: {
  serie: Array<{ index: number; r1: number | null; r2: number | null }>;
  iteracaoAtual: number;
  contandoAoInfinito: boolean;
  protegido: boolean;
}) {
  const visivel = serie.filter((s) => s.index <= iteracaoAtual);
  const temDado = visivel.some((s) => s.r2 !== null);

  return (
    <div className="panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="silkscreen">
          Métrica de R2 para 192.168.3.0/24, rodada a rodada
        </p>
        {contandoAoInfinito && (
          <span className="text-xs font-semibold text-caution">
            Contagem ao infinito em curso
          </span>
        )}
      </div>

      {!temDado ? (
        <p className="py-4 text-sm text-muted-foreground">
          R2 ainda não conhece essa rede. Avance uma rodada de anúncios para
          que ela apareça.
        </p>
      ) : (
        <>
          <ol className="flex items-end gap-1.5" style={{ height: 96 }}>
            {visivel.map((s) => {
              const m = s.r2;
              const inalcancavel = m !== null && m >= RIP_INFINITY;
              const altura = m === null ? 0 : Math.max(6, (m / RIP_INFINITY) * 88);
              return (
                <li
                  key={s.index}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  style={{ height: "100%" }}
                >
                  <span
                    className={cn(
                      "font-mono text-2xs tabular-nums",
                      inalcancavel ? "text-fault" : "text-muted-foreground",
                    )}
                  >
                    {m === null ? "—" : m}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "w-full rounded-t-[2px]",
                      inalcancavel
                        ? "bg-fault"
                        : s.index === iteracaoAtual
                          ? "bg-copper"
                          : "bg-rail-strong",
                    )}
                    style={{ height: altura }}
                  />
                </li>
              );
            })}
          </ol>
          <div className="mt-2 flex items-center justify-between border-t border-rail pt-2">
            <p className="text-xs text-muted-foreground">
              Rodada 0 a {iteracaoAtual}
            </p>
            <p className="text-xs text-muted-foreground">
              Teto do RIP: <span className="font-mono text-fault">16</span>
            </p>
          </div>
          <p className="sr-only">
            Série da métrica por rodada:{" "}
            {visivel
              .map((s) => `rodada ${s.index}: ${s.r2 === null ? "sem rota" : s.r2}`)
              .join("; ")}
            .
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {contandoAoInfinito
              ? "A métrica sobe porque R2 reaprende de R1 uma rota que R1 só conhecia através do próprio R2. Cada rodada soma um salto, até o teto de 16."
              : protegido
                ? "Os mecanismos de proteção estão fazendo o trabalho deles: a métrica não tem por onde subir."
                : "Sem eventos de falha, a métrica apenas se estabiliza no menor número de saltos."}
          </p>
        </>
      )}
    </div>
  );
}

const TEMPORIZADORES = [
  { nome: "Update", valor: "30 s", papel: "Intervalo entre anúncios periódicos completos da tabela." },
  { nome: "Invalid", valor: "180 s", papel: "Sem notícia de uma rota por esse tempo, ela é marcada com métrica 16." },
  { nome: "Holddown", valor: "180 s", papel: "Período em que o roteador ignora informação pior sobre uma rota suspeita." },
  { nome: "Flush", valor: "240 s", papel: "Prazo até a rota ser removida de vez da tabela." },
] as const;

function TemporizadoresRip() {
  return (
    <div className="panel p-4">
      <p className="silkscreen mb-1">Temporizadores do RIP</p>
      <p className="mb-3 text-sm text-muted-foreground">
        Este simulador avança por rodadas de anúncio, não por relógio: cada
        clique equivale a um ciclo de update. Os valores padrão da RFC 2453
        estão abaixo para dar a escala de tempo real.
      </p>
      <div className="scroll-x" tabIndex={0} role="region" aria-label="Temporizadores padrão do RIP">
        <table className="w-full min-w-max text-sm">
          <caption className="sr-only">
            Temporizadores padrão do RIP conforme a RFC 2453
          </caption>
          <thead>
            <tr className="border-b border-rail text-left">
              <th scope="col" className="px-3 py-2 font-medium">Temporizador</th>
              <th scope="col" className="px-3 py-2 font-medium">Padrão</th>
              <th scope="col" className="px-3 py-2 font-medium">O que faz</th>
            </tr>
          </thead>
          <tbody>
            {TEMPORIZADORES.map((t) => (
              <tr key={t.nome} className="border-b border-rail last:border-b-0">
                <td className="px-3 py-2 font-mono text-xs">{t.nome}</td>
                <td className="px-3 py-2 font-mono text-xs tabular-nums text-copper">{t.valor}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.papel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
