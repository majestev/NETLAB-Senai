"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Layers } from "lucide-react";
import { JOURNEY_SEGMENTS, getDevice } from "@/lib/net/journey";
import { JOURNEY_EVENTS } from "@/lib/net/journey-events";
import { useMotionOk } from "@/components/netlab/motion/use-motion-ok";
import { PacketInspector } from "@/components/netlab/packet-inspector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeviceCard, JourneyTopology } from "./journey-topology";
import { EventLog } from "./event-log";
import { PacketFields } from "./packet-fields";
import { SimulationControls, type Velocidade } from "./simulation-controls";

const DURACAO_MS: Record<string, number> = {
  transmitindo: 1300,
  criado: 1400,
  encapsulado: 1400,
  "consulta-cam": 1200,
  "consulta-rota": 1200,
  ttl: 1100,
  desencapsulado: 1200,
  reencapsulado: 1200,
  recebido: 700,
  encaminhado: 900,
  entregue: 2200,
};

export function PacketJourney() {
  const eventos = JOURNEY_EVENTS;
  const animar = useMotionOk();

  const [i, setI] = useState(0);

  const [tocarPedido, setTocarPedido] = useState<boolean | null>(null);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);
  const [equipamento, setEquipamento] = useState<string | null>(null);
  const [inspetorAberto, setInspetorAberto] = useState(false);

  const evento = eventos[i]!;
  const anterior = i > 0 ? eventos[i - 1]!.packet : undefined;
  const ultimo = i >= eventos.length - 1;
  const tocando = (tocarPedido ?? animar) && !ultimo;

  useEffect(() => {
    if (!tocando) return;
    const base = DURACAO_MS[evento.kind] ?? 1000;
    const t = window.setTimeout(
      () => setI((v) => Math.min(eventos.length - 1, v + 1)),
      base / velocidade,
    );
    return () => window.clearTimeout(t);
  }, [tocando, evento, velocidade, eventos.length]);

  const irPara = useCallback((n: number) => {
    setTocarPedido(false);
    setI(n);
  }, []);

  const trechoDoEvento = useMemo(() => {
    const alvo = evento.travel?.toDeviceId ?? evento.deviceId;
    const idx = JOURNEY_SEGMENTS.findIndex((s) => s.toDeviceId === alvo);
    return JOURNEY_SEGMENTS[idx === -1 ? 0 : idx]!;
  }, [evento]);

  const progresso = ((i + 1) / eventos.length) * 100;

  return (
    <div className="space-y-4">

      <figure className="panel overflow-hidden bg-panel-sunken">
        <div className="p-3 pb-1">
          <JourneyTopology
            evento={evento}
            equipamentoSelecionado={equipamento}
            onSelecionarEquipamento={setEquipamento}
          />
        </div>

        <figcaption className="border-t border-rail">

          <div className="h-0.5 w-full bg-rail" aria-hidden>
            <motion.div
              className="h-full bg-copper"
              animate={{ width: `${progresso}%` }}
              initial={false}
              transition={{ duration: animar ? 0.3 : 0, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="px-3 py-2.5">
            <SimulationControls
              tocando={tocando}
              onTocar={(t) => setTocarPedido(t)}
              onPassoAtras={() => irPara(Math.max(0, i - 1))}
              onPassoFrente={() => irPara(Math.min(eventos.length - 1, i + 1))}
              onReiniciar={() => irPara(0)}
              podeVoltar={i > 0}
              podeAvancar={!ultimo}
              velocidade={velocidade}
              onVelocidade={setVelocidade}
            />
          </div>
        </figcaption>
      </figure>

      <div
        role="status"
        aria-live="polite"
        aria-label="Evento atual da simulação"
        className="panel flex flex-wrap items-start gap-x-4 gap-y-2 border-copper/40 p-4"
      >
        <span
          className={cn(
            "shrink-0 rounded-sm px-2 py-1 font-mono text-2xs font-semibold uppercase tracking-wider",
            evento.layer === 2 && "bg-layer2/15 text-layer2",
            evento.layer === 3 && "bg-layer3/15 text-layer3",
            evento.layer === 7 && "bg-layer7/15 text-layer7",
          )}
        >
          {`Camada ${evento.layer}`}
        </span>
        <div className="min-w-[15rem] flex-1">
          <p className="text-sm font-semibold">
            <span className="mr-2 font-mono text-xs text-muted-foreground">
              {String(i + 1).padStart(2, "0")}/{eventos.length}
            </span>
            {evento.title}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">{evento.detail}</p>
          <p className="sr-only">
            {`TTL ${evento.packet.ttl}. IP ${evento.packet.sourceIp} para ${evento.packet.destinationIp}.`}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="hit-44 gap-1.5"
          onClick={() => setInspetorAberto(true)}
        >
          <Layers className="size-3.5" aria-hidden />
          Inspecionar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="panel overflow-hidden">
          <p className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rail bg-panel-sunken px-3 py-2">
            <span className="silkscreen">Campos do pacote</span>
            <span className="text-2xs text-muted-foreground">
              Observe o que muda e o que permanece
            </span>
          </p>
          <PacketFields
            packet={evento.packet}
            changed={evento.changed}
            anterior={anterior}
            className="m-3"
          />
        </div>

        <EventLog eventos={eventos} atual={i} onIr={irPara} />
      </div>

      {equipamento && <DeviceCard id={equipamento} />}

      <details className="panel p-0">
        <summary className="hit-44 cursor-pointer px-4 py-3 text-sm font-medium">
          Ver a jornada inteira em tabela
        </summary>
        <div
          className="scroll-x border-t border-rail"
          tabIndex={0}
          role="region"
          aria-label="Tabela da jornada do pacote"
        >
          <table className="w-full min-w-[38rem] text-sm">
            <caption className="sr-only">
              Estado do pacote em cada trecho do caminho de PC1 até o servidor
            </caption>
            <thead>
              <tr className="border-b border-rail text-left">
                <th scope="col" className="px-4 py-2 font-medium">Trecho</th>
                <th scope="col" className="px-4 py-2 font-medium">Rede</th>
                <th scope="col" className="px-4 py-2 font-medium">MAC origem para destino</th>
                <th scope="col" className="px-4 py-2 font-medium">IP origem para destino</th>
                <th scope="col" className="px-4 py-2 font-medium">TTL</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {JOURNEY_SEGMENTS.map((s) => (
                <tr
                  key={s.id}
                  className={cn(
                    "border-b border-rail last:border-b-0",
                    s.id === trechoDoEvento.id && "bg-copper-soft",
                  )}
                >
                  <td className="px-4 py-2">
                    {getDevice(s.fromDeviceId)?.name} para{" "}
                    {getDevice(s.toDeviceId)?.name}
                  </td>
                  <td className="px-4 py-2">{s.network}</td>
                  <td className="px-4 py-2">
                    {s.packet.sourceMac} para {s.packet.destinationMac}
                  </td>
                  <td className="px-4 py-2">
                    {s.packet.sourceIp} para {s.packet.destinationIp}
                  </td>
                  <td className="px-4 py-2 tabular-nums">{s.packet.ttl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <PacketInspector
        segment={trechoDoEvento}
        open={inspetorAberto}
        onOpenChange={setInspetorAberto}
      />
    </div>
  );
}
