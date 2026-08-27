"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Scissors } from "lucide-react";
import {
  formatIpv4,
  parseCidr,
  totalAddresses,
} from "@/lib/net/ipv4";
import { vlsmSteps, type VlsmRequirement } from "@/lib/net/vlsm";
import { segmentStyle } from "./block-division";
import { useMotionOk } from "./motion/use-motion-ok";
import {
  SimulationControls,
  type Velocidade,
} from "./journey/simulation-controls";
import { cn } from "@/lib/utils";

const PASSO_MS = 2000;

const BLOCO_PADRAO = "192.168.10.0/24";

const REQUISITOS_PADRAO: VlsmRequirement[] = [
  { id: "lan-a", label: "LAN A", hosts: 60 },
  { id: "lan-b", label: "LAN B", hosts: 28 },
  { id: "lan-c", label: "LAN C", hosts: 12 },
  { id: "lan-d", label: "LAN D", hosts: 10 },
  { id: "wan-1", label: "WAN 1", hosts: 2 },
  { id: "wan-2", label: "WAN 2", hosts: 2 },
];

export function VlsmSplitVisual({
  block = BLOCO_PADRAO,
  requirements = REQUISITOS_PADRAO,
  className,
}: {
  block?: string;
  requirements?: VlsmRequirement[];
  className?: string;
}) {
  const animar = useMotionOk();

  const parsed = parseCidr(block);
  const padrao = parseCidr(BLOCO_PADRAO);
  const rede =
    parsed.ok ? parsed.value : padrao.ok ? padrao.value : { address: 0, prefix: 24 };
  const { steps } = vlsmSteps(rede, requirements);
  const tamanhoBloco = totalAddresses(rede.prefix);

  const [i, setI] = useState(0);
  const [tocarPedido, setTocarPedido] = useState<boolean | null>(null);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);

  const indice = Math.min(i, steps.length - 1);
  const atual = steps[indice]!;
  const ultimo = indice >= steps.length - 1;
  const tocando = (tocarPedido ?? false) && !ultimo;

  useEffect(() => {
    if (!tocando) return;
    const t = window.setTimeout(
      () => setI((v) => Math.min(steps.length - 1, v + 1)),
      PASSO_MS / velocidade,
    );
    return () => window.clearTimeout(t);
  }, [tocando, indice, velocidade, steps.length]);

  function ir(n: number) {
    setTocarPedido(false);
    setI(Math.max(0, Math.min(steps.length - 1, n)));
  }

  const usados = tamanhoBloco - atual.remainingAddresses;
  const aproveitamento = Math.round((usados / tamanhoBloco) * 100);

  return (
    <div className={cn("space-y-3", className)}>
      <figure className="panel overflow-hidden">
        <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rail bg-panel-sunken px-3 py-2">
          <span className="silkscreen">Bloco</span>
          <span className="font-mono text-sm font-semibold">
            {formatIpv4(rede.address)}/{rede.prefix}
          </span>
          <span className="ml-auto font-mono text-2xs tabular-nums text-muted-foreground">
            {usados.toLocaleString("pt-BR")} de{" "}
            {tamanhoBloco.toLocaleString("pt-BR")} endereços · {aproveitamento}%
          </span>
        </figcaption>

        <div className="p-3">

          <div
            className="flex h-10 w-full overflow-hidden rounded-sm border border-rail"
            role="img"
            aria-label={
              atual.allocation
                ? `${atual.title}. ${atual.narrative}`
                : atual.narrative
            }
          >
            {steps
              .slice(1)
              .map((passo, idx) => {
                const alocacao = passo.allocation!;
                const visivel = idx < indice;
                const recem = idx === indice - 1;
                const { cor, hachura } = segmentStyle(idx);
                const largura =
                  (totalAddresses(alocacao.prefix) / tamanhoBloco) * 100;
                return (
                  <motion.span
                    key={alocacao.requirement.id}
                    className={cn(
                      "flex min-w-0 items-center justify-center overflow-hidden border-r border-rail last:border-r-0",
                      cor,
                      hachura,
                      recem && "ring-2 ring-inset ring-copper",
                    )}
                    initial={false}
                    animate={{ width: visivel ? `${largura}%` : "0%" }}
                    transition={{
                      duration: animar ? 0.5 : 0,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                );
              })}

            <motion.span
              className="min-w-0 bg-panel-sunken"
              initial={false}
              animate={{
                width: `${(atual.remainingAddresses / tamanhoBloco) * 100}%`,
              }}
              transition={{ duration: animar ? 0.5 : 0, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="relative mt-1 h-4" aria-hidden>
            <span className="absolute left-0 font-mono text-[0.5625rem] text-muted-foreground">
              {formatIpv4(rede.address)}
            </span>
            {atual.nextFreeAddress !== null && indice > 0 && (
              <motion.span
                className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[0.5625rem] text-copper"
                initial={false}
                animate={{ left: `${(usados / tamanhoBloco) * 100}%` }}
                transition={{ duration: animar ? 0.5 : 0, ease: [0.16, 1, 0.3, 1] }}
              >
                {formatIpv4(atual.nextFreeAddress)}
              </motion.span>
            )}
            <span className="absolute right-0 font-mono text-[0.5625rem] text-muted-foreground">
              /{rede.prefix}
            </span>
          </div>

          <ul className="mt-3 grid gap-x-5 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {steps.slice(1).map((passo, idx) => {
              const alocacao = passo.allocation!;
              const { cor, hachura } = segmentStyle(idx);
              const feito = idx < indice;
              return (
                <li
                  key={alocacao.requirement.id}
                  className={cn(
                    "flex items-baseline gap-2 text-xs transition-opacity",
                    feito ? "opacity-100" : "opacity-35",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 size-3 shrink-0 rounded-xs border border-rail",
                      feito ? cor : "bg-panel-sunken",
                      feito && hachura,
                    )}
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{alocacao.requirement.label}</span>{" "}
                    <span className="font-mono text-muted-foreground">
                      {formatIpv4(alocacao.network)}/{alocacao.prefix}
                    </span>
                    <span className="block text-muted-foreground">
                      {alocacao.requirement.hosts} de {alocacao.usable} utilizáveis
                      {alocacao.waste > 0 && ` · ${alocacao.waste} de folga`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-rail px-3 py-2.5">
          <SimulationControls
            tocando={tocando}
            onTocar={(t) => setTocarPedido(t)}
            onPassoAtras={() => ir(indice - 1)}
            onPassoFrente={() => ir(indice + 1)}
            onReiniciar={() => ir(0)}
            podeVoltar={indice > 0}
            podeAvancar={!ultimo}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
        </div>
      </figure>

      <div
        role="status"
        aria-live="polite"
        className={cn("panel p-3.5", ultimo && "border-signal/40 bg-signal-soft")}
      >
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-mono text-2xs tabular-nums text-muted-foreground">
            {indice + 1}/{steps.length}
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {atual.allocation && (
              <Scissors className="size-3.5 shrink-0 text-copper" aria-hidden />
            )}
            {atual.title}
          </span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{atual.narrative}</p>
        {ultimo && (
          <p className="mt-2.5 border-t border-rail pt-2.5 text-sm">
            As demandas foram atendidas da maior para a menor, e cada sub-rede
            caiu colada na anterior. Alocar na ordem em que foram escritas
            deixaria buracos: um /26 não pode começar no meio de um bloco de
            oito endereços.
          </p>
        )}
      </div>
    </div>
  );
}
