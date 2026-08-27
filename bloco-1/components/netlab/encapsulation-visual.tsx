"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  ENCAP_LAYERS,
  ENCAP_STEPS,
  PAYLOAD_BYTES,
  layerInfo,
  type Layer,
} from "@/lib/net/encapsulation";
import { useMotionOk } from "./motion/use-motion-ok";
import {
  SimulationControls,
  type Velocidade,
} from "./journey/simulation-controls";
import { cn } from "@/lib/utils";

const PASSO_MS = 1700;

const COR_CAMADA: Record<Layer, string> = {
  7: "border-layer7 bg-layer7/12 text-layer7",
  4: "border-layer4 bg-layer4/12 text-layer4",
  3: "border-layer3 bg-layer3/12 text-layer3",
  2: "border-layer2 bg-layer2/12 text-layer2",
  1: "border-rail-strong bg-panel-sunken text-muted-foreground",
};

const PONTO_CAMADA: Record<Layer, string> = {
  7: "bg-layer7",
  4: "bg-layer4",
  3: "bg-layer3",
  2: "bg-layer2",
  1: "bg-rail-strong",
};

export function EncapsulationVisual({ className }: { className?: string }) {
  const animar = useMotionOk();
  const passos = ENCAP_STEPS;

  const [i, setI] = useState(0);
  const [tocarPedido, setTocarPedido] = useState<boolean | null>(null);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);

  const atual = passos[i]!;
  const ultimo = i >= passos.length - 1;
  const tocando = (tocarPedido ?? false) && !ultimo;

  useEffect(() => {
    if (!tocando) return;
    const t = window.setTimeout(
      () => setI((v) => Math.min(passos.length - 1, v + 1)),
      PASSO_MS / velocidade,
    );
    return () => window.clearTimeout(t);
  }, [tocando, i, velocidade, passos.length]);

  function ir(n: number) {
    setTocarPedido(false);
    setI(Math.max(0, Math.min(passos.length - 1, n)));
  }

  const descendo = atual.direction === "descendo";
  const info = layerInfo(atual.layer);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="panel overflow-hidden">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-rail bg-panel-sunken px-3 py-2">
          {descendo ? (
            <ArrowDown className="size-3.5 shrink-0 text-copper" aria-hidden />
          ) : (
            <ArrowUp className="size-3.5 shrink-0 text-fiber" aria-hidden />
          )}
          <span className="silkscreen">
            {descendo ? "Host de origem — encapsulando" : "Host de destino — desencapsulando"}
          </span>
          <span className="ml-auto font-mono text-2xs tabular-nums text-muted-foreground">
            {atual.totalBytes} bytes
          </span>
        </p>

        <div className="grid gap-px bg-rail sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">

          <ol className="bg-panel">
            {ENCAP_LAYERS.map((camada) => {
              const ativa = camada.layer === atual.layer;
              const envolvida = atual.wrapped.includes(camada.layer);
              return (
                <li
                  key={camada.layer}
                  aria-current={ativa ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 border-b border-rail px-3 py-2 last:border-b-0 transition-colors",
                    ativa && (descendo ? "bg-copper-soft" : "bg-fiber-soft"),
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full transition-opacity",
                      PONTO_CAMADA[camada.layer],
                      envolvida ? "opacity-100" : "opacity-25",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {camada.name}
                    </span>
                    <span className="block truncate font-mono text-[0.5625rem] text-muted-foreground">
                      {camada.pdu}
                    </span>
                  </span>
                  <span className="font-mono text-2xs text-muted-foreground">
                    L{camada.layer}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col justify-center gap-3 bg-panel p-3">
            <div
              className="scroll-x"
              tabIndex={0}
              role="region"
              aria-label="A unidade de dados neste ponto, com os cabeçalhos já adicionados"
            >
              <div className="flex min-w-[20rem] items-stretch gap-px" aria-hidden>
                <AnimatePresence initial={false} mode="popLayout">
                  {atual.wrapped
                    .filter((l) => layerInfo(l).headerBytes > 0)
                    .map((l) => {
                      const c = layerInfo(l);
                      return (
                        <motion.span
                          key={`h-${l}`}
                          layout={animar}
                          initial={animar ? { opacity: 0, width: 0 } : false}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={animar ? { opacity: 0, width: 0 } : undefined}
                          transition={{ duration: animar ? 0.36 : 0, ease: [0.16, 1, 0.3, 1] }}
                          className={cn(
                            "flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-xs border px-2 py-2.5",
                            COR_CAMADA[l],
                          )}
                        >
                          <span className="whitespace-nowrap font-mono text-[0.5625rem] font-semibold">
                            L{l}
                          </span>
                          <span className="whitespace-nowrap font-mono text-[0.5rem] opacity-80">
                            {c.headerBytes} B
                          </span>
                        </motion.span>
                      );
                    })}
                </AnimatePresence>

                <motion.span
                  layout={animar}
                  className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xs border border-layer7 bg-layer7/12 px-2 py-2.5 text-layer7"
                >
                  <span className="truncate font-mono text-[0.5625rem] font-semibold">
                    Dados da aplicação
                  </span>
                  <span className="font-mono text-[0.5rem] opacity-80">
                    {PAYLOAD_BYTES} B
                  </span>
                </motion.span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{info.pdu}</span> ·{" "}
              {info.keyField.name}:{" "}
              <span className="font-mono">{info.keyField.value}</span>
            </p>
          </div>
        </div>

        <div className="border-t border-rail px-3 py-2.5">
          <SimulationControls
            tocando={tocando}
            onTocar={(t) => setTocarPedido(t)}
            onPassoAtras={() => ir(i - 1)}
            onPassoFrente={() => ir(i + 1)}
            onReiniciar={() => ir(0)}
            podeVoltar={i > 0}
            podeAvancar={!ultimo}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "panel p-3.5",
          ultimo && "border-signal/40 bg-signal-soft",
        )}
      >
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-mono text-2xs tabular-nums text-muted-foreground">
            {i + 1}/{passos.length}
          </span>
          <span className="text-sm font-semibold">{atual.title}</span>
          <span
            className={cn(
              "rounded-sm border px-1.5 py-0.5 font-mono text-2xs",
              atual.change === "adiciona"
                ? "border-copper/50 bg-copper-soft text-copper"
                : "border-fiber/50 bg-fiber-soft text-fiber",
            )}
          >
            {atual.change === "adiciona" ? "+" : "−"}
            {layerInfo(atual.layer).headerBytes} B
          </span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{atual.narrative}</p>
      </div>
    </div>
  );
}
