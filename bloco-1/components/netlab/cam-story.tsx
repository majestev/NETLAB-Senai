"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lightbulb } from "lucide-react";
import {
  ACTION_LABEL,
  CAM_STORY,
  STORY_HOSTS,
  hostByMac,
  hostByPort,
  type CamStoryStep,
} from "@/lib/net/cam-story";
import { BROADCAST_MAC } from "@/lib/net/switching";
import { useMotionOk } from "./motion/use-motion-ok";
import {
  SimulationControls,
  type Velocidade,
} from "./journey/simulation-controls";
import { cn } from "@/lib/utils";

type Fase = "subindo" | "consulta" | "descendo" | "final";

const FASE_MS: Record<Exclude<Fase, "final">, number> = {
  subindo: 620,
  consulta: 620,
  descendo: 760,
};

const PAUSA_ENTRE_PASSOS = 1500;

const LARGURA = 620;
const ALTURA = 240;
const SW = { x: 50, y: 20, w: 520, h: 50 };
const HOST_W = 100;
const HOST_H = 52;
const HOST_Y = 160;

const PORTAS = STORY_HOSTS.map((h, i) => ({
  ...h,
  x: SW.x + (SW.w * (2 * i + 1)) / 8,
}));

function portaX(id: string): number {
  return PORTAS.find((p) => p.port === id)?.x ?? SW.x + SW.w / 2;
}

export function CamStory({ className }: { className?: string }) {
  const animar = useMotionOk();
  const passos = CAM_STORY;

  const [{ passo, fase }, setEstado] = useState<{ passo: number; fase: Fase }>({
    passo: 0,
    fase: "final",
  });
  const [tocarPedido, setTocarPedido] = useState<boolean | null>(null);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);

  const atual = passos[passo]!;
  const ultimo = passo >= passos.length - 1;
  const tocando = (tocarPedido ?? false) && !ultimo;

  useEffect(() => {
    if (fase === "final") return;
    const t = window.setTimeout(() => {
      setEstado((e) => ({
        ...e,
        fase:
          e.fase === "subindo"
            ? "consulta"
            : e.fase === "consulta"
              ? "descendo"
              : "final",
      }));
    }, FASE_MS[fase] / velocidade);
    return () => window.clearTimeout(t);
  }, [fase, passo, velocidade]);

  useEffect(() => {
    if (!tocando || fase !== "final") return;
    const t = window.setTimeout(() => {
      setEstado((e) => ({
        passo: Math.min(passos.length - 1, e.passo + 1),
        fase: animar ? "subindo" : "final",
      }));
    }, PAUSA_ENTRE_PASSOS / velocidade);
    return () => window.clearTimeout(t);
  }, [tocando, fase, velocidade, animar, passos.length]);

  function ir(n: number, comAnimacao = true) {
    setTocarPedido(false);
    const alvo = Math.max(0, Math.min(passos.length - 1, n));
    setEstado({
      passo: alvo,
      fase: animar && comAnimacao && passos[alvo]!.frame ? "subindo" : "final",
    });
  }

  const origem = atual.frame ? hostByMac(atual.frame.sourceMac) : undefined;
  const broadcast = atual.frame?.destinationMac === BROADCAST_MAC;
  const destino =
    atual.frame && !broadcast ? hostByMac(atual.frame.destinationMac) : undefined;

  const quadroVisivel = atual.frame !== null && fase !== "final";
  const camExibida = fase === "final" || fase === "descendo"
    ? atual.camAfter
    : atual.camBefore;

  return (
    <div className={cn("space-y-3", className)}>
      <figure className="panel overflow-hidden bg-panel-sunken">
        <svg
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Switch com quatro portas de acesso. ${atual.title}. ${atual.narrative}`}
        >

          {PORTAS.map((p) => (
            <line
              key={p.id}
              x1={p.x}
              y1={SW.y + SW.h}
              x2={p.x}
              y2={HOST_Y}
              className="stroke-rail-strong"
              strokeWidth={1.5}
            />
          ))}

          <rect
            x={SW.x}
            y={SW.y}
            width={SW.w}
            height={SW.h}
            rx={4}
            className="fill-panel stroke-rail-strong"
            strokeWidth={1.5}
          />
          <text
            x={SW.x + 14}
            y={SW.y + 30}
            className="fill-muted-foreground font-mono text-[11px]"
          >
            SW1
          </text>

          {fase === "consulta" && (
            <motion.rect
              x={SW.x}
              y={SW.y}
              width={26}
              height={SW.h}
              className="fill-copper/25"
              initial={animar ? { x: SW.x } : false}
              animate={{ x: SW.x + SW.w - 26 }}
              transition={{ duration: animar ? FASE_MS.consulta / 1000 : 0, ease: "linear" }}
            />
          )}

          {PORTAS.map((p) => {
            const entrada = atual.frame?.ingressPort === p.port;
            const saida = atual.egressPorts.includes(p.port) && fase !== "subindo";
            return (
              <g key={p.port}>
                <rect
                  x={p.x - 13}
                  y={SW.y + SW.h - 7}
                  width={26}
                  height={11}
                  rx={2}
                  className={cn(
                    "stroke-rail-strong",
                    entrada ? "fill-copper" : saida ? "fill-signal" : "fill-panel-sunken",
                  )}
                  strokeWidth={1}
                />
                <text
                  x={p.x}
                  y={SW.y + SW.h + 18}
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[9px]"
                >
                  {p.port}
                </text>
              </g>
            );
          })}

          {PORTAS.map((p) => {
            const ehOrigem = origem?.id === p.id;
            const ehDestino = destino?.id === p.id;
            const recebe = atual.egressPorts.includes(p.port);
            return (
              <g key={`host-${p.id}`}>
                <rect
                  x={p.x - HOST_W / 2}
                  y={HOST_Y}
                  width={HOST_W}
                  height={HOST_H}
                  rx={4}
                  className={cn(
                    "stroke-rail-strong",
                    ehOrigem
                      ? "fill-copper-soft"
                      : ehDestino && fase === "final"
                        ? "fill-signal-soft"
                        : "fill-panel",
                  )}
                  strokeWidth={ehOrigem || ehDestino ? 1.75 : 1.25}
                />
                <text
                  x={p.x}
                  y={HOST_Y + 21}
                  textAnchor="middle"
                  className="fill-foreground text-[12px] font-semibold"
                >
                  {p.name}
                </text>
                <text
                  x={p.x}
                  y={HOST_Y + 36}
                  textAnchor="middle"
                  className="fill-muted-foreground font-mono text-[8.5px]"
                >
                  {p.mac.slice(-5)}
                </text>

                {recebe && fase === "final" && !ehDestino && (
                  <text
                    x={p.x}
                    y={HOST_Y + HOST_H + 14}
                    textAnchor="middle"
                    className="fill-caution font-mono text-[8.5px]"
                  >
                    recebeu cópia
                  </text>
                )}
              </g>
            );
          })}

          {quadroVisivel && origem && fase === "subindo" && (
            <motion.g
              initial={animar ? { y: HOST_Y - 12 } : false}
              animate={{ y: SW.y + SW.h + 6 }}
              transition={{ duration: animar ? FASE_MS.subindo / 1000 : 0, ease: "linear" }}
            >
              <Quadro x={portaX(origem.port)} />
            </motion.g>
          )}

          {fase === "descendo" &&
            atual.egressPorts.map((porta) => (
              <motion.g
                key={porta}
                initial={animar ? { y: SW.y + SW.h + 6 } : false}
                animate={{ y: HOST_Y - 12 }}
                transition={{ duration: animar ? FASE_MS.descendo / 1000 : 0, ease: "linear" }}
              >
                <Quadro x={portaX(porta)} inundado={atual.action === "inundar"} />
              </motion.g>
            ))}
        </svg>

        <figcaption className="border-t border-rail bg-panel px-3 py-2.5">
          <SimulationControls
            tocando={tocando}
            onTocar={(t) => setTocarPedido(t)}
            onPassoAtras={() => ir(passo - 1, false)}
            onPassoFrente={() => ir(passo + 1)}
            onReiniciar={() => ir(0, false)}
            podeVoltar={passo > 0}
            podeAvancar={!ultimo}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
        </figcaption>
      </figure>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">

        <div className="space-y-3">
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "panel p-3.5",
              atual.action === "inundar" && "border-caution/40",
              atual.action === "encaminhar" && "border-signal/40",
            )}
          >
            <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="font-mono text-2xs tabular-nums text-muted-foreground">
                {passo + 1}/{passos.length}
              </span>
              <span className="text-sm font-semibold">{atual.title}</span>
              {atual.action && (
                <span
                  className={cn(
                    "rounded-sm border px-1.5 py-0.5 font-mono text-2xs",
                    atual.action === "inundar"
                      ? "border-caution/50 bg-caution-soft text-caution"
                      : "border-signal/50 bg-signal-soft text-signal",
                  )}
                >
                  {ACTION_LABEL[atual.action]}
                  {atual.action === "inundar" &&
                    ` · ${atual.egressPorts.length} portas`}
                </span>
              )}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{atual.narrative}</p>
            {atual.lesson && (
              <p className="mt-2.5 flex items-start gap-2 border-t border-rail pt-2.5 text-sm">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-copper" aria-hidden />
                <span>{atual.lesson}</span>
              </p>
            )}
          </div>

          <ol className="grid gap-px overflow-hidden rounded-md border border-rail bg-rail sm:grid-cols-2">
            {passos.map((p) => (
              <li key={p.id} className="bg-panel">
                <button
                  type="button"
                  onClick={() => ir(p.index, false)}
                  aria-current={p.index === passo ? "step" : undefined}
                  className={cn(
                    "flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm transition-colors",
                    p.index === passo
                      ? "bg-copper-soft font-medium"
                      : "hover:bg-panel-raised focus-visible:bg-panel-raised",
                  )}
                >
                  <span className="font-mono text-2xs tabular-nums text-muted-foreground">
                    {String(p.index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">{p.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <CamTable passo={atual} entradas={camExibida} />
      </div>
    </div>
  );
}

function Quadro({ x, inundado = false }: { x: number; inundado?: boolean }) {
  return (
    <g transform={`translate(${x - 11}, 0)`}>
      <rect
        width={22}
        height={12}
        rx={2}
        className={cn(
          "stroke-background",
          inundado ? "fill-caution" : "fill-copper",
        )}
        strokeWidth={1}
      />
    </g>
  );
}

function CamTable({
  passo,
  entradas,
}: {
  passo: CamStoryStep;
  entradas: { mac: string; port: string; vlan: number }[];
}) {
  const nova = passo.learned;

  return (
    <div className="panel h-max overflow-hidden">
      <p className="flex items-baseline gap-2 border-b border-rail bg-panel-sunken px-3 py-2">
        <span className="silkscreen">Tabela CAM</span>
        <span className="ml-auto font-mono text-2xs text-muted-foreground">
          {entradas.length}/4
        </span>
      </p>

      {entradas.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          Vazia. O switch ainda não sabe onde nenhum host está.
        </p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">
            Tabela CAM do switch no passo {passo.index + 1}: {passo.title}
          </caption>
          <thead>
            <tr className="border-b border-rail text-left">
              <th scope="col" className="px-3 py-1.5 font-medium text-muted-foreground">
                MAC
              </th>
              <th scope="col" className="px-3 py-1.5 font-medium text-muted-foreground">
                Porta
              </th>
              <th scope="col" className="px-3 py-1.5 font-medium text-muted-foreground">
                Host
              </th>
            </tr>
          </thead>
          <tbody>
            {entradas.map((e) => {
              const recem = nova?.mac === e.mac && nova?.port === e.port;
              return (
                <tr
                  key={`${e.mac}-${e.vlan}`}
                  className={cn(
                    "border-b border-rail last:border-b-0 transition-colors",
                    recem && "bg-copper-soft",
                  )}
                >
                  <td className="px-3 py-1.5 font-mono text-2xs">{e.mac}</td>
                  <td className="px-3 py-1.5 font-mono text-2xs">{e.port}</td>
                  <td className="px-3 py-1.5 text-xs">
                    {hostByPort(e.port)?.name ?? "—"}
                    {recem && (
                      <span className="ml-1.5 text-2xs font-semibold uppercase tracking-wider text-copper">
                        nova
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
