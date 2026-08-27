"use client";

import { ArrowRight, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDevice, type JourneySegment } from "@/lib/net/journey";

function Field({
  label,
  value,
  changed,
  layer,
}: {
  label: string;
  value: string;
  changed?: boolean;
  layer: "layer2" | "layer3" | "routing";
}) {
  const accent =
    layer === "layer2"
      ? "text-layer2"
      : layer === "layer3"
        ? "text-layer3"
        : "text-layer4";

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rail py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className={`font-mono text-sm ${accent}`}>{value}</span>
        {changed !== undefined && (
          <span
            className={`silkscreen shrink-0 ${changed ? "text-caution" : "text-muted-foreground"}`}
          >
            {changed ? "reescrito" : "inalterado"}
          </span>
        )}
      </span>
    </div>
  );
}

function LayerBlock({
  title,
  layerLabel,
  color,
  children,
}: {
  title: string;
  layerLabel: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-4">
      <header className="mb-2 flex items-center gap-2">
        <span aria-hidden className={`h-3 w-1 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="silkscreen ml-auto">{layerLabel}</span>
      </header>
      {children}
    </section>
  );
}

export function PacketInspector({
  segment,
  open,
  onOpenChange,
}: {
  segment: JourneySegment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!segment) return null;

  const from = getDevice(segment.fromDeviceId);
  const to = getDevice(segment.toDeviceId);
  const changedFields = new Set(segment.changes.map((c) => c.field));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[min(46rem,calc(100vw-2rem))] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
            <span>Packet Inspector</span>
            <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
              {from?.name}
              <ArrowRight className="size-3.5" aria-hidden />
              {to?.name}
            </span>
          </DialogTitle>
          <DialogDescription>
            Estado do pacote no trecho {segment.label} — rede{" "}
            <span className="font-mono">{segment.network}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <LayerBlock title="Camada 2 — Enlace" layerLabel="Ethernet" color="bg-layer2">
            <Field
              label="MAC de origem"
              value={segment.packet.sourceMac}
              changed={changedFields.has("MAC de origem")}
              layer="layer2"
            />
            <Field
              label="MAC de destino"
              value={segment.packet.destinationMac}
              changed={changedFields.has("MAC de destino")}
              layer="layer2"
            />
          </LayerBlock>

          <LayerBlock title="Camada 3 — Rede" layerLabel="IPv4" color="bg-layer3">
            <Field label="IP de origem" value={segment.packet.sourceIp} changed={false} layer="layer3" />
            <Field
              label="IP de destino"
              value={segment.packet.destinationIp}
              changed={false}
              layer="layer3"
            />
            <Field
              label="TTL"
              value={String(segment.packet.ttl)}
              changed={changedFields.has("TTL")}
              layer="layer3"
            />
          </LayerBlock>

          <LayerBlock title="Encaminhamento" layerLabel="Decisão" color="bg-layer4">
            <Field
              label="Próximo salto"
              value={segment.packet.nextHop}
              changed={changedFields.has("Próximo salto")}
              layer="routing"
            />
            <Field
              label="Interface de saída"
              value={segment.packet.outgoingInterface}
              changed={changedFields.has("Interface de saída")}
              layer="routing"
            />
          </LayerBlock>

          <section className="panel bg-panel-sunken p-4">
            <h3 className="silkscreen mb-3">O que mudou neste salto</h3>
            {segment.changes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nada mudou ainda: este é o quadro como o host de origem o montou.
              </p>
            ) : (
              <ul className="space-y-3">
                {segment.changes.map((change) => (
                  <li key={change.field} className="text-sm">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{change.field}</span>
                      <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        <span className="line-through">{change.from}</span>
                        <ArrowRight className="size-3" aria-hidden />
                        <span className="text-caution">{change.to}</span>
                      </span>
                    </p>
                    <p className="mt-0.5 text-muted-foreground">{change.why}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 flex gap-2 border-t border-rail pt-3 text-sm text-muted-foreground">
              <Minus className="mt-1 size-3 shrink-0 text-layer3" aria-hidden />
              <span>{segment.unchanged}</span>
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
