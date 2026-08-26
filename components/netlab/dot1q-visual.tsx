"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tag, TagsIcon } from "lucide-react";
import {
  buildTagStages,
  fieldsAtStage,
  VLAN_ID_MAX,
  type FrameField,
  type TagStage,
} from "@/lib/net/dot1q";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useMotionOk } from "./motion/use-motion-ok";
import {
  SimulationControls,
  type Velocidade,
} from "./journey/simulation-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PASSO_MS = 2000;

const PESO: Record<string, number> = {
  dst: 6,
  src: 6,
  tpid: 2,
  pcp: 1,
  dei: 1,
  vid: 2,
  type: 2,
  payload: 22,
  fcs: 4,
};

const VLANS = [10, 20, 30] as const;

export function Dot1qVisual({ className }: { className?: string }) {
  const animar = useMotionOk();

  const hidratado = useHydrated();
  const [vlan, setVlan] = useState<number>(10);
  const [i, setI] = useState(0);
  const [tocarPedido, setTocarPedido] = useState<boolean | null>(null);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);

  const estagios = buildTagStages(vlan);
  const atual = estagios[Math.min(i, estagios.length - 1)]!;
  const ultimo = i >= estagios.length - 1;
  const tocando = (tocarPedido ?? false) && !ultimo;

  useEffect(() => {
    if (!tocando) return;
    const t = window.setTimeout(
      () => setI((v) => Math.min(estagios.length - 1, v + 1)),
      PASSO_MS / velocidade,
    );
    return () => window.clearTimeout(t);
  }, [tocando, i, velocidade, estagios.length]);

  function ir(n: number) {
    setTocarPedido(false);
    setI(Math.max(0, Math.min(estagios.length - 1, n)));
  }

  const campos = fieldsAtStage(atual, vlan);

  return (
    <div className={cn("space-y-3", className)}>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-rail bg-panel-sunken px-3 py-2">
          <span className="silkscreen">VLAN</span>
          <div className="flex gap-1" role="group" aria-label="VLAN do quadro">
            {VLANS.map((v) => (
              <Button
                key={v}
                size="sm"
                variant={v === vlan ? "default" : "outline"}
                className="h-7 px-2 font-mono text-xs"
                aria-pressed={v === vlan}
                onClick={() => setVlan(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <span className="ml-auto font-mono text-2xs text-muted-foreground">
            {atual.where}
          </span>
        </div>

        <Percurso estagio={atual} animar={animar} />

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

      <figure className="panel overflow-hidden">
        <figcaption className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rail bg-panel-sunken px-3 py-2">
          <span className="silkscreen">O quadro neste ponto</span>
          <motion.span
            key={atual.maxBytes}
            initial={animar && hidratado ? { opacity: 0, y: -3 } : false}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "font-mono text-xs tabular-nums",
              atual.tagged ? "font-semibold text-copper" : "text-muted-foreground",
            )}
          >
            máx. {atual.maxBytes} bytes
          </motion.span>
          {atual.changed && (
            <span
              className={cn(
                "rounded-sm border px-1.5 py-0.5 font-mono text-2xs",
                atual.changed === "inserida"
                  ? "border-copper/50 bg-copper-soft text-copper"
                  : "border-fiber/50 bg-fiber-soft text-fiber",
              )}
            >
              etiqueta {atual.changed}
            </span>
          )}
        </figcaption>

        <div
          className="scroll-x p-3"
          tabIndex={0}
          role="region"
          aria-label="Campos do quadro Ethernet neste ponto do percurso"
        >
          <div className="flex min-w-[34rem] gap-px" aria-hidden>
            <AnimatePresence initial={false} mode="popLayout">
              {campos.map((campo) => (
                <CampoDoQuadro
                  key={campo.id}
                  campo={campo}
                  animar={animar}
                />
              ))}
            </AnimatePresence>
          </div>
          <p className="mt-2 text-2xs text-muted-foreground" aria-hidden>
            Larguras proporcionais entre os cabeçalhos; o campo de dados não
            está em escala.
          </p>
        </div>

        <dl className="grid gap-px border-t border-rail bg-rail sm:grid-cols-2">
          {campos.map((campo) => (
            <div
              key={campo.id}
              className={cn(
                "bg-panel px-3 py-2",
                campo.tag && "bg-copper-soft",
              )}
            >
              <dt className="flex items-baseline gap-2 text-xs font-medium">
                {campo.tag && (
                  <Tag className="size-3 shrink-0 text-copper" aria-hidden />
                )}
                {campo.name}
                <span className="font-mono text-2xs text-muted-foreground">
                  {campo.size}
                </span>
                {campo.value && (
                  <span className="ml-auto font-mono text-2xs font-semibold text-copper">
                    {campo.value}
                  </span>
                )}
              </dt>
              <dd className="mt-0.5 text-xs text-muted-foreground">
                {campo.description}
              </dd>
            </div>
          ))}
        </dl>
      </figure>

      <div role="status" aria-live="polite" className="panel p-3.5">
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-mono text-2xs tabular-nums text-muted-foreground">
            {atual.index + 1}/{estagios.length}
          </span>
          <span className="text-sm font-semibold">{atual.title}</span>
          <span className="font-mono text-2xs text-muted-foreground">
            {atual.actor}
          </span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{atual.narrative}</p>
        {ultimo && (
          <p className="mt-2.5 flex items-start gap-2 border-t border-rail pt-2.5 text-sm">
            <TagsIcon className="mt-0.5 size-4 shrink-0 text-copper" aria-hidden />
            <span>
              A etiqueta existiu apenas no trecho entre SW1 e SW2. Doze bits de
              VID permitem {VLAN_ID_MAX.toLocaleString("pt-BR")} VLANs, e é
              esse mesmo campo que faz o quadro passar de 1518 para 1522 bytes
              no trunk.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

const PONTOS: Array<{ id: TagStage["id"]; rotulo: string; sub: string }> = [
  { id: "host-origem", rotulo: "PC-A", sub: "sem etiqueta" },
  { id: "porta-acesso-entrada", rotulo: "SW1 Fa0/1", sub: "acesso" },
  { id: "trunk", rotulo: "trunk", sub: "802.1Q" },
  { id: "porta-acesso-saida", rotulo: "SW2 Fa0/5", sub: "acesso" },
  { id: "host-destino", rotulo: "PC-B", sub: "sem etiqueta" },
];

function Percurso({ estagio, animar }: { estagio: TagStage; animar: boolean }) {
  return (
    <ol className="flex items-stretch gap-px overflow-hidden bg-rail">
      {PONTOS.map((ponto, idx) => {
        const ativo = ponto.id === estagio.id;
        const passado = idx < estagio.index;
        const comEtiqueta = ponto.id === "trunk";
        return (
          <li
            key={ponto.id}
            className={cn(
              "min-w-0 flex-1 bg-panel px-2 py-2.5 text-center transition-colors",
              ativo && "bg-copper-soft",
              !ativo && passado && "bg-panel-raised",
            )}
            aria-current={ativo ? "step" : undefined}
          >
            <span
              className={cn(
                "block truncate font-mono text-2xs",
                ativo ? "font-semibold text-copper" : "text-foreground",
              )}
            >
              {ponto.rotulo}
            </span>
            <span
              className={cn(
                "mt-0.5 block truncate text-[0.5625rem]",
                comEtiqueta ? "text-copper" : "text-muted-foreground",
              )}
            >
              {ponto.sub}
            </span>
            <motion.span
              aria-hidden
              className={cn(
                "mx-auto mt-1.5 block h-0.5 rounded-full",
                comEtiqueta ? "bg-copper" : "bg-rail-strong",
              )}
              animate={{ width: ativo ? "100%" : "28%" }}
              initial={false}
              transition={{ duration: animar ? 0.25 : 0 }}
            />
          </li>
        );
      })}
    </ol>
  );
}

function CampoDoQuadro({
  campo,
  animar,
}: {
  campo: FrameField;
  animar: boolean;
}) {
  return (
    <motion.span
      layout={animar ? true : false}
      initial={animar ? { opacity: 0, scaleX: 0.2 } : false}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={animar ? { opacity: 0, scaleX: 0.2 } : undefined}
      transition={{ duration: animar ? 0.42 : 0, ease: [0.16, 1, 0.3, 1] }}
      style={{ flexGrow: PESO[campo.id] ?? 2, flexBasis: 0 }}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center rounded-xs border px-1 py-2 text-center",
        campo.tag
          ? "border-copper bg-copper-soft"
          : "border-rail bg-panel-sunken",
      )}
    >
      <span
        className={cn(
          "block w-full truncate font-mono text-[0.5625rem] font-semibold",
          campo.tag ? "text-copper" : "text-foreground",
        )}
      >
        {campo.name}
      </span>
      <span className="block w-full truncate font-mono text-[0.5rem] text-muted-foreground">
        {campo.size}
      </span>
    </motion.span>
  );
}
