"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, Filter, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CAPTURE,
  CAPTURE_NOTES,
  layerSpans,
  type CapturedPacket,
} from "@/lib/net/capture";
import { useMotionOk } from "./motion/use-motion-ok";
import { cn } from "@/lib/utils";

const PROTO_CLASS: Record<CapturedPacket["protocol"], string> = {
  ARP: "text-layer4",
  TCP: "text-layer3",
  HTTP: "text-layer7",
};

const LAYER_CLASS: Record<number, string> = {
  2: "bg-layer2",
  3: "bg-layer3",
  4: "bg-layer4",
  7: "bg-layer7",
};

const LAYER_HATCH: Record<number, string> = {
  2: "hatch-0",
  3: "hatch-1",
  4: "hatch-2",
  7: "hatch-3",
};

const FILTROS = ["Todos", "ARP", "TCP", "HTTP"] as const;

export function ProtocolAnalyzer() {
  const [selecionado, setSelecionado] = useState<number>(6);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todos");

  const [camadaAberta, setCamadaAberta] = useState<number | null>(null);
  const animar = useMotionOk();

  const visiveis =
    filtro === "Todos" ? CAPTURE : CAPTURE.filter((p) => p.protocol === filtro);

  const pacote =
    visiveis.find((p) => p.no === selecionado) ?? visiveis[0] ?? CAPTURE[0]!;
  const faixas = layerSpans(pacote);

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <Filter className="size-4 text-muted-foreground" aria-hidden />
        <span className="silkscreen">Filtro</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por protocolo">
          {FILTROS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filtro === f ? "default" : "outline"}
              className="h-7 text-xs"
              aria-pressed={filtro === f}
              onClick={() => setFiltro(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {visiveis.length} de {CAPTURE.length} pacotes
        </span>
      </div>

      <div
        className="panel scroll-x"
        tabIndex={0}
        role="region"
        aria-label="Lista de pacotes capturados"
      >
        <table className="w-full min-w-max text-sm">
          <caption className="sr-only">
            Pacotes capturados; selecione uma linha para ver os detalhes por camada
          </caption>
          <thead>
            <tr className="border-b border-rail bg-panel-sunken text-left">
              {["No", "Tempo", "Origem", "Destino", "Protocolo", "Tam.", "Info"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((p) => {
              const ativo = p.no === selecionado;
              return (
                <tr
                  key={p.no}
                  className={cn(
                    "cursor-pointer border-b border-rail last:border-b-0 hover:bg-panel-raised",
                    ativo && "bg-copper-soft hover:bg-copper-soft",
                  )}
                  onClick={() => setSelecionado(p.no)}
                  aria-selected={ativo}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="font-mono text-xs tabular-nums underline-offset-2 hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelecionado(p.no);
                      }}
                      aria-label={`Ver detalhes do pacote ${p.no}: ${p.info}`}
                    >
                      {p.no}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums text-muted-foreground">
                    {p.time.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.source}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.destination}</td>
                  <td className={cn("px-3 py-2 font-mono text-xs font-semibold", PROTO_CLASS[p.protocol])}>
                    {p.protocol}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs tabular-nums">{p.length}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.info}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel p-4" aria-live="polite">
        <p className="mb-3 flex items-center gap-2">
          <Layers className="size-4 text-copper" aria-hidden />
          <span className="text-sm font-semibold">
            Packet Details — pacote {pacote.no}
          </span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {pacote.length} bytes
          </span>
        </p>

        <div
          className="mb-3"
          role="img"
          aria-label={`Mapa do pacote ${pacote.no}, ${pacote.length} bytes: ${faixas
            .map((f) => `${f.title}, ${f.bytes} bytes`)
            .join("; ")}.`}
        >
          <div className="flex h-6 w-full overflow-hidden rounded-sm border border-rail">
            {faixas.map((faixa) => (
              <button
                key={faixa.layer}
                type="button"
                onClick={() =>
                  setCamadaAberta((c) => (c === faixa.layer ? null : faixa.layer))
                }
                aria-label={`Camada ${faixa.layer}, ${faixa.title}: bytes ${faixa.start} a ${faixa.start + faixa.bytes - 1}`}
                className={cn(
                  "min-w-0 border-r border-rail transition-opacity last:border-r-0 hover:opacity-100 focus-visible:opacity-100",
                  LAYER_CLASS[faixa.layer],
                  LAYER_HATCH[faixa.layer],
                  camadaAberta !== null && camadaAberta !== faixa.layer
                    ? "opacity-45"
                    : "opacity-100",
                )}
                style={{ width: `${(faixa.bytes / pacote.length) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-2xs text-muted-foreground" aria-hidden>
            <span>byte 0</span>
            <span>byte {pacote.length - 1}</span>
          </div>
        </div>

        <div className="space-y-2">
          {pacote.layers.map((layer) => {
            const faixa = faixas.find((f) => f.layer === layer.layer)!;

            const aberta = camadaAberta === null || camadaAberta === layer.layer;
            const id = `camada-${pacote.no}-${layer.layer}`;
            return (
              <div key={layer.title} className="panel overflow-hidden bg-panel-sunken">
                <h3>
                  <button
                    type="button"
                    aria-expanded={aberta}
                    aria-controls={id}
                    onClick={() =>
                      setCamadaAberta((c) => (c === layer.layer ? null : layer.layer))
                    }
                    className="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-panel-raised focus-visible:bg-panel-raised"
                  >
                    <ChevronRight
                      className={cn(
                        "size-3.5 shrink-0 text-muted-foreground transition-transform",
                        aberta && "rotate-90",
                      )}
                      aria-hidden
                    />
                    <span
                      aria-hidden
                      className={cn("h-3 w-1 rounded-full", LAYER_CLASS[layer.layer])}
                    />
                    <span className="text-sm font-medium">{layer.title}</span>
                    <span className="font-mono text-2xs text-muted-foreground">
                      bytes {faixa.start}–{faixa.start + faixa.bytes - 1}
                    </span>
                    <span className="silkscreen ml-auto">{`Camada ${layer.layer}`}</span>
                  </button>
                </h3>

                <motion.div
                  id={id}
                  hidden={!aberta}
                  initial={false}
                  animate={{ opacity: aberta ? 1 : 0 }}
                  transition={{ duration: animar ? 0.18 : 0 }}
                >
                  <p className="border-t border-rail px-3 py-2 font-mono text-xs text-muted-foreground">
                    {layer.summary}
                  </p>
                  <dl className="border-t border-rail px-3 py-2">
                    {layer.fields.map((field) => (
                      <div
                        key={field.label}
                        className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-rail py-1.5 last:border-b-0"
                      >
                        <dt className="text-sm text-muted-foreground">
                          {field.label}
                          {field.size && (
                            <span className="ml-2 font-mono text-2xs">{field.size}</span>
                          )}
                        </dt>
                        <dd className="text-right">
                          <span className="font-mono text-sm">{field.value}</span>
                          {field.note && (
                            <span className="block max-w-md text-xs text-muted-foreground">
                              {field.note}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel p-4">
        <p className="silkscreen mb-2">Como ler esta captura</p>
        <ul className="space-y-2">
          {CAPTURE_NOTES.map((nota) => (
            <li key={nota} className="flex gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-copper" />
              {nota}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
