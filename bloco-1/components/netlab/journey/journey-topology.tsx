"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { DEVICE_SYMBOL, DeviceSymbols } from "@/components/netlab/device-symbols";
import { JOURNEY_DEVICES, JOURNEY_SEGMENTS, getDevice } from "@/lib/net/journey";
import { SEM_L2, type JourneyEvent } from "@/lib/net/journey-events";
import { cn } from "@/lib/utils";

const X: Record<string, number> = { pc: 84, sw: 288, r1: 492, r2: 696, srv: 896 };
const Y = 82;
const BOX = 56;

const TRAVESSIA_S = 1.15;

export function JourneyTopology({
  evento,
  onSelecionarEquipamento,
  equipamentoSelecionado,
}: {
  evento: JourneyEvent;
  onSelecionarEquipamento: (id: string | null) => void;
  equipamentoSelecionado: string | null;
}) {
  const reduzir = useReducedMotion();
  const x = useMotionValue(X.pc!);

  const emTransito = evento.kind === "transmitindo";
  const comQuadro = evento.packet.sourceMac !== SEM_L2;

  useEffect(() => {
    const destino = emTransito
      ? X[evento.travel!.toDeviceId]!
      : X[evento.deviceId]!;

    if (!emTransito) {
      const controles = animate(x, destino, {
        duration: reduzir ? 0 : 0.25,
        ease: [0.16, 1, 0.3, 1],
      });
      return () => controles.stop();
    }

    x.set(X[evento.travel!.fromDeviceId]!);
    const controles = animate(x, destino, {
      duration: reduzir ? 0 : TRAVESSIA_S,
      ease: "linear",
    });
    return () => controles.stop();
  }, [evento, emTransito, reduzir, x]);

  const ativo = emTransito ? evento.travel!.toDeviceId : evento.deviceId;
  const enlaceAtivo = emTransito ? evento.travel! : null;

  return (
    <div
      className="scroll-x"
      tabIndex={0}
      role="region"
      aria-label="Topologia da jornada do pacote (rolável)"
    >
      <DeviceSymbols />
      <svg
        viewBox="0 0 980 148"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full min-w-[44rem]"
        role="group"
        aria-labelledby="jornada-titulo jornada-desc"
      >
        <title id="jornada-titulo">
          Caminho de um pacote de PC1 até o servidor
        </title>
        <desc id="jornada-desc">
          Topologia em linha com cinco equipamentos: PC1 ligado a um switch, o
          switch a um roteador R1, R1 a um roteador R2 por um enlace WAN, e R2
          ao servidor. O registro de eventos e a tabela abaixo do diagrama
          trazem os mesmos dados em texto.
        </desc>

        {JOURNEY_SEGMENTS.map((s) => {
          const x1 = X[s.fromDeviceId]! + BOX / 2;
          const x2 = X[s.toDeviceId]! - BOX / 2;
          const ativoAqui =
            enlaceAtivo?.fromDeviceId === s.fromDeviceId &&
            enlaceAtivo?.toDeviceId === s.toDeviceId;
          return (
            <g key={s.id}>
              <line
                x1={x1}
                y1={Y}
                x2={x2}
                y2={Y}
                stroke={ativoAqui ? "var(--copper)" : "var(--rail-strong)"}
                strokeWidth={ativoAqui ? 2.5 : 1.5}
              />
              <text
                x={(x1 + x2) / 2}
                y={Y + 28}
                textAnchor="middle"
                className="font-mono"
                fontSize="11"
                fill={ativoAqui ? "var(--copper)" : "var(--muted-foreground)"}
              >
                {s.network}
              </text>
            </g>
          );
        })}

        {JOURNEY_DEVICES.map((d) => (
          <g key={`${d.id}-rot`} aria-hidden>
            <text
              x={X[d.id]}
              y={Y + BOX / 2 + 24}
              textAnchor="middle"
              className="font-mono"
              fontSize="12"
              fontWeight="600"
              fill="var(--foreground)"
            >
              {d.name}
            </text>
            <text
              x={X[d.id]}
              y={Y - BOX / 2 - 12}
              textAnchor="middle"
              fontSize="10"
              letterSpacing="0.14em"
              fill="var(--muted-foreground)"
            >
              {`L${d.layer}`}
            </text>
          </g>
        ))}

        {JOURNEY_DEVICES.map((d) => {
          const aqui = d.id === ativo;
          const selecionado = d.id === equipamentoSelecionado;
          const consultando =
            aqui &&
            (evento.kind === "consulta-cam" || evento.kind === "consulta-rota");
          const entregando = aqui && evento.kind === "entregue";

          return (
            <g
              key={d.id}
              role="button"
              tabIndex={0}
              aria-label={`${d.name}, ${d.role}, camada ${d.layer}. Ver interfaces.`}
              aria-pressed={selecionado}
              className="cursor-pointer outline-none [&:focus-visible>rect.moldura]:stroke-fiber [&:focus-visible>rect.moldura]:stroke-[3]"
              onClick={() =>
                onSelecionarEquipamento(selecionado ? null : d.id)
              }
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onSelecionarEquipamento(selecionado ? null : d.id);
                }
              }}
            >
              <rect
                className="moldura"
                x={X[d.id]! - BOX / 2}
                y={Y - BOX / 2}
                width={BOX}
                height={BOX}
                rx="6"
                fill="var(--panel)"
                stroke={
                  selecionado
                    ? "var(--fiber)"
                    : aqui
                      ? "var(--copper)"
                      : "var(--rail-strong)"
                }
                strokeWidth={selecionado || aqui ? 2 : 1.25}
              />

              {consultando && !reduzir && (
                <motion.line
                  x1={X[d.id]! - BOX / 2 + 3}
                  x2={X[d.id]! + BOX / 2 - 3}
                  stroke="var(--fiber)"
                  strokeWidth="2"
                  initial={{ y1: Y - BOX / 2 + 4, y2: Y - BOX / 2 + 4, opacity: 0.9 }}
                  animate={{ y1: Y + BOX / 2 - 4, y2: Y + BOX / 2 - 4, opacity: 0.9 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                />
              )}

              {entregando && (
                <motion.rect
                  x={X[d.id]! - BOX / 2 - 5}
                  y={Y - BOX / 2 - 5}
                  width={BOX + 10}
                  height={BOX + 10}
                  rx="9"
                  fill="none"
                  stroke="var(--signal)"
                  strokeWidth="2"
                  initial={reduzir ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ transformOrigin: `${X[d.id]}px ${Y}px` }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              )}

              <use
                href={DEVICE_SYMBOL[d.kind]}
                x={X[d.id]! - 16}
                y={Y - 16}
                width="32"
                height="32"
                stroke={aqui ? "var(--copper)" : "var(--foreground)"}
                fill="none"
              />
            </g>
          );
        })}

        <motion.g style={{ x }} aria-hidden>

          {comQuadro && (
            <motion.rect
              x={-40}
              y={Y - 19}
              width="80"
              height="38"
              rx="5"
              fill="none"
              stroke="var(--layer2)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              initial={reduzir ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{ transformOrigin: `0px ${Y}px` }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          <rect
            x={-26}
            y={Y - 12}
            width="52"
            height="24"
            rx="4"
            fill="var(--copper)"
          />
          <text
            x={0}
            y={Y + 4}
            textAnchor="middle"
            className="font-mono"
            fontSize="11"
            fontWeight="600"
            fill="var(--primary-foreground)"
          >
            {`TTL ${evento.packet.ttl}`}
          </text>
        </motion.g>
      </svg>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-2xs text-muted-foreground">
        {[
          { cor: "bg-copper", texto: "pacote e enlace em uso" },
          { cor: "bg-fiber", texto: "consulta em andamento" },
          { cor: "bg-signal", texto: "entrega concluída" },
          { cor: "bg-layer2", texto: "invólucro de camada 2", tracejado: true },
        ].map((i) => (
          <li key={i.texto} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-xs",
                i.tracejado ? "border border-dashed border-layer2" : i.cor,
              )}
            />
            {i.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeviceCard({ id }: { id: string }) {
  const d = getDevice(id);
  if (!d) return null;

  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-mono text-base font-semibold">{d.name}</h3>
        <span className="text-sm text-muted-foreground">{d.role}</span>
        <span className="silkscreen ml-auto">{`Camada ${d.layer}`}</span>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {d.interfaces.map((i) => (
          <div key={i.name} className="rounded-sm bg-panel-sunken p-2.5">
            <dt className="font-mono text-xs text-copper">{i.name}</dt>
            <dd className="mt-1 font-mono text-sm">{i.ip ?? "sem endereço IP"}</dd>
            <dd className="font-mono text-xs text-muted-foreground">
              {i.mac !== SEM_L2 ? i.mac : (i.note ?? "")}
            </dd>
            {i.ip && i.note && (
              <dd className="mt-1 text-xs text-muted-foreground">{i.note}</dd>
            )}
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">{d.behavior}</p>
    </div>
  );
}
