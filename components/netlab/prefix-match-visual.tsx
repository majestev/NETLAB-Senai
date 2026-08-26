"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Crown, Scale } from "lucide-react";
import {
  analyzePrefixMatch,
  maskLabel,
  prefixReach,
  type PrefixMatchRow,
} from "@/lib/net/prefix-match";
import { formatIpv4 } from "@/lib/net/ipv4";
import type { RouteEntry } from "@/lib/net/routing";
import { useMotionOk } from "./motion/use-motion-ok";
import {
  SimulationControls,
  type Velocidade,
} from "./journey/simulation-controls";
import { cn } from "@/lib/utils";

const MS_POR_BIT = 190;

export function PrefixMatchVisual({
  destination,
  routes,
  className,
}: {
  destination: number;
  routes: RouteEntry[];
  className?: string;
}) {
  const animar = useMotionOk();
  const analise = useMemo(
    () => analyzePrefixMatch(destination, routes),
    [destination, routes],
  );

  const [revelados, setRevelados] = useState(0);
  const [tocarPedido, setTocarPedido] = useState<boolean | null>(null);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);

  const fim = revelados >= 32;
  const tocando = (tocarPedido ?? false) && !fim;

  useEffect(() => {
    if (!tocando) return;
    const t = window.setTimeout(
      () => setRevelados((v) => Math.min(32, v + 1)),
      MS_POR_BIT / velocidade,
    );
    return () => window.clearTimeout(t);
  }, [tocando, revelados, velocidade]);

  function ir(n: number) {
    setTocarPedido(false);
    setRevelados(Math.max(0, Math.min(32, n)));
  }

  const estados = analise.rows.map((r) => estadoDaRota(r, revelados));
  const vivas = estados.filter((e) => e !== "eliminada").length;

  const vencedoras = analise.winners.map((w) => w.routeId);
  const mostrarVeredito = fim;

  return (
    <div className={cn("space-y-3", className)}>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rail bg-panel-sunken px-3 py-2">
          <span className="silkscreen">Destino do pacote</span>
          <span className="font-mono text-sm font-semibold">
            {formatIpv4(destination)}
          </span>
          <span className="ml-auto font-mono text-2xs tabular-nums text-muted-foreground">
            {revelados} de 32 bits comparados
          </span>
        </div>

        <div
          className="scroll-x px-3 py-3"
          tabIndex={0}
          role="region"
          aria-label="Comparação bit a bit entre o destino e cada rota"
        >
          <div className="min-w-max">

            <div className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-right font-mono text-2xs text-muted-foreground">
                destino
              </span>
              <FaixaDeBits
                aria-hidden
                bits={analise.destinationBits.map((bit, i) => ({
                  bit,
                  estado: i < revelados ? "destino-lido" : "destino-pendente",
                }))}
                revelados={revelados}
                animar={animar}
              />
              <span className="w-24 shrink-0 font-mono text-2xs text-muted-foreground">
                {formatIpv4(destination)}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-3" aria-hidden>
              <span className="w-32 shrink-0" />
              <div className="flex gap-[3px]">
                {[0, 1, 2, 3].map((o) => (
                  <span
                    key={o}
                    className="flex w-[calc(8*var(--bit)+7*1px)] justify-center border-t border-rail pt-0.5 font-mono text-[0.5625rem] text-muted-foreground"
                    style={{ ["--bit" as string]: "0.875rem" }}
                  >
                    {(destination >>> (24 - o * 8)) & 255}
                  </span>
                ))}
              </div>
              <span className="w-24 shrink-0" />
            </div>

            <ul className="mt-3 space-y-1">
              {analise.rows.map((rota, idx) => {
                const estado = estados[idx]!;
                return (
                  <li key={rota.routeId}>
                    <LinhaDaRota
                      rota={rota}
                      estado={estado}
                      revelados={revelados}
                      vencedora={mostrarVeredito && vencedoras.includes(rota.routeId)}
                      animar={animar}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border-t border-rail px-3 py-2.5">
          <SimulationControls
            tocando={tocando}
            onTocar={(t) => setTocarPedido(t)}
            onPassoAtras={() => ir(revelados - 1)}
            onPassoFrente={() => ir(revelados + 1)}
            onReiniciar={() => ir(0)}
            podeVoltar={revelados > 0}
            podeAvancar={!fim}
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
          mostrarVeredito && analise.winners.length > 0
            ? "border-signal/40 bg-signal-soft"
            : mostrarVeredito
              ? "border-fault/40 bg-fault-soft"
              : "",
        )}
      >
        {!mostrarVeredito ? (
          <p className="text-sm text-muted-foreground">
            {revelados === 0
              ? `${analise.rows.length} rotas na tabela. Avance os bits: cada rota acompanha o destino até onde a máscara dela alcança.`
              : `Bit ${revelados} de 32 · ${vivas} ${vivas === 1 ? "rota ainda acompanha" : "rotas ainda acompanham"} o destino.`}
          </p>
        ) : analise.winners.length === 0 ? (
          <p className="text-sm">
            Nenhuma rota contém{" "}
            <span className="font-mono">{formatIpv4(destination)}</span>. Sem
            rota padrão, o pacote é descartado.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <Crown className="size-4 shrink-0 text-signal" aria-hidden />
              Prefixo mais longo: /{analise.longestPrefix}
            </p>
            <p className="text-sm">
              {analise.winners.map((w) => w.label).join(", ")} examina{" "}
              {analise.longestPrefix} bits do destino e todos coincidem. É o
              maior número de bits entre as {analise.matching.length} rotas que
              casam — máscara{" "}
              <span className="font-mono">{maskLabel(analise.longestPrefix!)}</span>
              , faixa de {prefixReach(analise.longestPrefix!).toLocaleString("pt-BR")}{" "}
              endereços.
            </p>
            {!analise.decidedByBits && (
              <p className="flex items-start gap-2 border-t border-rail pt-2 text-sm text-muted-foreground">
                <Scale className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {analise.winners.length} rotas empatam neste prefixo. Os bits
                  não decidem daqui em diante: a escolha passa para a distância
                  administrativa e, se ela também empatar, para a métrica.
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      <details className="panel px-3.5 py-2.5">
        <summary className="cursor-pointer text-sm font-medium">
          Ver a comparação em texto
        </summary>
        <ul className="mt-2.5 space-y-1.5">
          {analise.rows.map((r) => (
            <li key={r.routeId} className="text-sm">
              <span className="font-mono">{r.label}</span>{" "}
              {r.matches ? (
                <>
                  : os {r.prefix} bits da máscara coincidem com o destino
                  {analise.winners.some((w) => w.routeId === r.routeId) &&
                    " (prefixo mais longo)"}
                  .
                </>
              ) : (
                <>
                  : difere do destino no bit {r.firstMismatch! + 1}, dentro dos{" "}
                  {r.prefix} bits da máscara: não contém este endereço.
                </>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

type EstadoRota = "pendente" | "acompanhando" | "casa" | "eliminada";

function estadoDaRota(rota: PrefixMatchRow, revelados: number): EstadoRota {
  if (rota.firstMismatch !== null && rota.firstMismatch < revelados) {
    return "eliminada";
  }
  if (revelados === 0) return "pendente";
  if (revelados >= rota.prefix) return "casa";
  return "acompanhando";
}

const ROTULO: Record<EstadoRota, string> = {
  pendente: "não comparada",
  acompanhando: "acompanhando",
  casa: "casa",
  eliminada: "eliminada",
};

function LinhaDaRota({
  rota,
  estado,
  revelados,
  vencedora,
  animar,
}: {
  rota: PrefixMatchRow;
  estado: EstadoRota;
  revelados: number;
  vencedora: boolean;
  animar: boolean;
}) {
  const eliminada = estado === "eliminada";

  return (
    <motion.div
      animate={{ opacity: eliminada ? 0.42 : 1 }}
      initial={false}
      transition={{ duration: animar ? 0.25 : 0 }}
      className="flex items-center gap-3"
    >
      <span className="flex w-32 shrink-0 items-baseline justify-end gap-1.5">
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            estado === "casa" && "bg-signal",
            estado === "acompanhando" && "bg-copper",
            estado === "eliminada" && "bg-fault",
            estado === "pendente" && "bg-rail-strong",
          )}
        />
        <span className="font-mono text-2xs">{rota.label}</span>
      </span>

      <FaixaDeBits
        aria-hidden
        bits={rota.bits.map((c, i) => ({
          bit: c.bit,
          estado: !c.inPrefix
            ? "fora"
            : i >= revelados
              ? "pendente"
              : c.matches
                ? "igual"
                : "diferente",
        }))}
        revelados={revelados}
        animar={animar}
      />

      <span className="flex w-24 shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "font-mono text-2xs",
            estado === "casa" && "text-signal",
            estado === "eliminada" && "text-fault",
            estado === "acompanhando" && "text-copper",
            estado === "pendente" && "text-muted-foreground",
          )}
        >
          {eliminada ? `bit ${rota.firstMismatch! + 1}` : `/${rota.prefix}`}
        </span>
        {vencedora && (
          <Crown className="size-3.5 shrink-0 text-signal" aria-hidden />
        )}
      </span>

      <span className="sr-only">
        {rota.label}: {ROTULO[estado]}
        {eliminada
          ? `, difere no bit ${rota.firstMismatch! + 1}`
          : estado === "casa"
            ? `, ${rota.prefix} bits conferem`
            : ""}
        {vencedora ? ", prefixo mais longo" : ""}
      </span>
    </motion.div>
  );
}

type EstadoBit =
  | "destino-lido"
  | "destino-pendente"
  | "fora"
  | "pendente"
  | "igual"
  | "diferente";

const CLASSE_BIT: Record<EstadoBit, string> = {
  "destino-lido": "border-rail-strong bg-panel-raised text-foreground",
  "destino-pendente": "border-rail bg-panel-sunken text-muted-foreground",

  fora: "border-transparent bg-transparent text-rail-strong",
  pendente: "border-rail bg-panel-sunken text-muted-foreground",
  igual: "border-signal/50 bg-signal-soft text-signal",
  diferente: "border-fault bg-fault text-background",
};

function FaixaDeBits({
  bits,
  revelados,
  animar,
  ...resto
}: {
  bits: Array<{ bit: 0 | 1; estado: EstadoBit }>;
  revelados: number;
  animar: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative flex gap-[3px]" {...resto}>
      {[0, 1, 2, 3].map((octeto) => (
        <div key={octeto} className="flex gap-px">
          {bits.slice(octeto * 8, octeto * 8 + 8).map((c, i) => (
            <span
              key={i}
              className={cn(
                "flex h-4 w-3.5 items-center justify-center rounded-xs border font-mono text-[0.5625rem] leading-none transition-colors duration-150",
                CLASSE_BIT[c.estado],
              )}
            >
              {c.bit}
            </span>
          ))}
        </div>
      ))}

      {revelados > 0 && revelados < 32 && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -top-0.5 bottom-[-2px] w-px bg-copper"
          animate={{ left: `calc(${revelados} * (0.875rem + 1px) + ${Math.floor(revelados / 8) * 2}px)` }}
          initial={false}
          transition={{ duration: animar ? 0.14 : 0, ease: "linear" }}
        />
      )}
    </div>
  );
}
