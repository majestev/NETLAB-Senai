"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Send, Tag, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEVICE_SYMBOL, DeviceSymbols } from "./device-symbols";
import {
  BROADCAST_MAC,
  processFrame,
  type CamEntry,
  type ForwardResult,
  type SwitchPort,
} from "@/lib/net/switching";
import { useMotionOk } from "./motion/use-motion-ok";
import { cn } from "@/lib/utils";

export type SwitchMode = "cam" | "vlan";

interface Host {
  id: string;
  name: string;
  mac: string;
  portId: string;
  vlan: number;
}

const HOSTS_CAM: Host[] = [
  { id: "pc1", name: "PC1", mac: "00:11:11:11:11:11", portId: "fa1", vlan: 1 },
  { id: "pc2", name: "PC2", mac: "00:22:22:22:22:22", portId: "fa2", vlan: 1 },
  { id: "pc3", name: "PC3", mac: "00:33:33:33:33:33", portId: "fa3", vlan: 1 },
  { id: "pc4", name: "PC4", mac: "00:44:44:44:44:44", portId: "fa4", vlan: 1 },
];

const PORTAS_CAM: SwitchPort[] = [
  { id: "fa1", label: "Fa0/1", mode: "access", vlan: 1 },
  { id: "fa2", label: "Fa0/2", mode: "access", vlan: 1 },
  { id: "fa3", label: "Fa0/3", mode: "access", vlan: 1 },
  { id: "fa4", label: "Fa0/4", mode: "access", vlan: 1 },
];

const HOSTS_VLAN: Host[] = [
  { id: "pc1", name: "PC1", mac: "00:11:11:11:11:11", portId: "fa1", vlan: 10 },
  { id: "pc2", name: "PC2", mac: "00:22:22:22:22:22", portId: "fa2", vlan: 20 },
  { id: "pc3", name: "PC3", mac: "00:33:33:33:33:33", portId: "fa3", vlan: 10 },
  { id: "pc4", name: "PC4", mac: "00:44:44:44:44:44", portId: "fa4", vlan: 20 },
];

const PORTAS_VLAN: SwitchPort[] = [
  { id: "fa1", label: "Fa0/1", mode: "access", vlan: 10 },
  { id: "fa2", label: "Fa0/2", mode: "access", vlan: 20 },
  { id: "fa3", label: "Fa0/3", mode: "access", vlan: 10 },
  { id: "fa4", label: "Fa0/4", mode: "access", vlan: 20 },
  { id: "gi1", label: "Gi0/1", mode: "trunk", allowed: [10, 20], nativeVlan: 1 },
];

const VLAN_CLASS: Record<number, string> = {
  1: "text-muted-foreground",
  10: "text-vlan-10",
  20: "text-vlan-20",
};

interface LogEntry {
  id: number;
  origem: string;
  destino: string;
  vlan: number;
  resultado: ForwardResult;

  conclusao?: string;
}

export function SwitchSimulator({ mode }: { mode: SwitchMode }) {
  const hosts = mode === "vlan" ? HOSTS_VLAN : HOSTS_CAM;
  const portas = mode === "vlan" ? PORTAS_VLAN : PORTAS_CAM;

  const [cam, setCam] = useState<CamEntry[]>([]);
  const [origemId, setOrigemId] = useState(hosts[0].id);
  const [destinoId, setDestinoId] = useState<string>(hosts[1].id);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [tick, setTick] = useState(0);
  const animar = useMotionOk();

  const origem = hosts.find((h) => h.id === origemId)!;
  const destino =
    destinoId === "broadcast" ? null : hosts.find((h) => h.id === destinoId)!;

  const ultimo = log[0];
  const portasAtivas = useMemo(
    () => new Set(ultimo?.resultado.egressPorts ?? []),
    [ultimo],
  );
  const portasMarcadas = useMemo(
    () => new Set(ultimo?.resultado.taggedEgressPorts ?? []),
    [ultimo],
  );

  function enviar() {
    const proximo = tick + 1;
    const resultado = processFrame(
      cam,
      portas,
      {
        sourceMac: origem.mac,
        destinationMac: destino ? destino.mac : BROADCAST_MAC,
        ingressPort: origem.portId,
        vlan: origem.vlan,
        tagged: false,
      },
      proximo,
    );
    const vlansDiferentes =
      mode === "vlan" && destino != null && destino.vlan !== origem.vlan;

    setCam(resultado.cam);
    setTick(proximo);
    setLog((atual) => [
      {
        id: proximo,
        origem: origem.name,
        destino: destino ? destino.name : "broadcast",
        vlan: origem.vlan,
        resultado,
        conclusao: vlansDiferentes
          ? `${destino!.name} está na VLAN ${destino!.vlan} e o quadro só circula na VLAN ${origem.vlan}: a porta dele não aparece na lista de saída, e ele nunca vai receber este quadro. Duas VLANs só se comunicam através de um roteador ou de um switch de camada 3.`
          : undefined,
      },
      ...atual,
    ]);
  }

  function limpar() {
    setCam([]);
    setLog([]);
    setTick(0);
  }

  const larguraPorta = 108;
  const svgLargura = portas.length * larguraPorta + 60;

  return (
    <div className="space-y-5">
      <DeviceSymbols />

      <figure className="panel overflow-hidden bg-panel-sunken">
        <div className="scroll-x" tabIndex={0} role="region" aria-label="Diagrama do switch (rolável)">
          <svg
            viewBox={`0 0 ${svgLargura} 210`}
            className="h-auto w-full"
            style={{ minWidth: `${svgLargura / 16}rem` }}
            role="group"
            aria-labelledby="sw-title sw-desc"
          >
            <title id="sw-title">
              {mode === "vlan"
                ? "Switch com VLAN 10, VLAN 20 e um trunk 802.1Q"
                : "Switch com quatro hosts em uma mesma VLAN"}
            </title>
            <desc id="sw-desc">
              {mode === "vlan"
                ? "Quatro hosts em portas de acesso: PC1 e PC3 na VLAN 10, PC2 e PC4 na VLAN 20. A porta Gi0/1 é um trunk que transporta as duas VLANs marcadas com 802.1Q. A tabela CAM e o registro de encaminhamento abaixo trazem os mesmos dados em texto."
                : "Quatro hosts, PC1 a PC4, ligados às portas Fa0/1 a Fa0/4 de um switch. A tabela CAM e o registro de encaminhamento abaixo trazem os mesmos dados em texto."}
            </desc>

            <rect
              x="30"
              y="20"
              width={svgLargura - 60}
              height="46"
              rx="5"
              fill="var(--panel)"
              stroke="var(--rail-strong)"
              strokeWidth="1.5"
            />
            <use
              href={DEVICE_SYMBOL.switch}
              x="42"
              y="27"
              width="32"
              height="32"
              stroke="var(--foreground)"
              fill="none"
            />
            <text x="86" y="48" className="font-mono" fontSize="12" fontWeight="600" fill="var(--foreground)">
              SW1
            </text>

            {portas.map((porta, index) => {
              const x = 60 + index * larguraPorta + larguraPorta / 2;
              const host = hosts.find((h) => h.portId === porta.id);
              const ativa = portasAtivas.has(porta.id);
              const entrada = ultimo && porta.id === origem.portId;
              const marcada = portasMarcadas.has(porta.id);
              const vlan = porta.mode === "trunk" ? 0 : (porta.vlan ?? 1);

              return (
                <g key={porta.id}>
                  <line
                    x1={x}
                    y1={66}
                    x2={x}
                    y2={host ? 128 : 108}
                    stroke={
                      ativa
                        ? "var(--copper)"
                        : entrada
                          ? "var(--fiber)"
                          : "var(--rail-strong)"
                    }
                    strokeWidth={ativa || entrada ? 2.5 : 1.5}
                    strokeDasharray={porta.mode === "trunk" ? "6 4" : undefined}
                  />
                  <text
                    x={x + 6}
                    y={88}
                    className="font-mono"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                  >
                    {porta.label}
                  </text>
                  {marcada && (
                    <g transform={`translate(${x - 34}, 92)`}>
                      <rect width="30" height="14" rx="3" fill="var(--caution)" />
                      <text
                        x="15"
                        y="10.5"
                        textAnchor="middle"
                        className="font-mono"
                        fontSize="9"
                        fontWeight="700"
                        fill="var(--background)"
                      >
                        TAG
                      </text>
                    </g>
                  )}

                  {host ? (
                    <>
                      <rect
                        x={x - 26}
                        y={128}
                        width="52"
                        height="46"
                        rx="5"
                        fill="var(--panel)"
                        stroke={
                          entrada ? "var(--fiber)" : ativa ? "var(--copper)" : "var(--rail-strong)"
                        }
                        strokeWidth={ativa || entrada ? 2 : 1.25}
                      />
                      <use
                        href={DEVICE_SYMBOL.host}
                        x={x - 14}
                        y={136}
                        width="28"
                        height="28"
                        stroke="var(--foreground)"
                        fill="none"
                      />
                      <text
                        x={x}
                        y={190}
                        textAnchor="middle"
                        className="font-mono"
                        fontSize="11"
                        fontWeight="600"
                        fill="var(--foreground)"
                      >
                        {host.name}
                      </text>
                      {mode === "vlan" && (
                        <text
                          x={x}
                          y={204}
                          textAnchor="middle"
                          className="font-mono"
                          fontSize="10"
                          fill={
                            vlan === 10 ? "var(--vlan-10)" : "var(--vlan-20)"
                          }
                        >
                          VLAN {vlan}
                        </text>
                      )}
                    </>
                  ) : (
                    <>
                      <text
                        x={x}
                        y={124}
                        textAnchor="middle"
                        className="font-mono"
                        fontSize="10"
                        fill="var(--caution)"
                      >
                        TRUNK
                      </text>
                      <text
                        x={x}
                        y={138}
                        textAnchor="middle"
                        className="font-mono"
                        fontSize="9"
                        fill="var(--muted-foreground)"
                      >
                        802.1Q · 10,20
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </figure>

      <div className="panel flex flex-wrap items-end gap-4 p-4">
        <div>
          <Label htmlFor="origem" className="text-xs text-muted-foreground">
            Origem
          </Label>
          <select
            id="origem"
            value={origemId}
            onChange={(e) => setOrigemId(e.target.value)}
            className="mt-1 h-11 rounded-sm border border-input bg-panel px-2 text-sm"
          >
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
                {mode === "vlan" ? ` (VLAN ${h.vlan})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="destino" className="text-xs text-muted-foreground">
            Destino
          </Label>
          <select
            id="destino"
            value={destinoId}
            onChange={(e) => setDestinoId(e.target.value)}
            className="mt-1 h-11 rounded-sm border border-input bg-panel px-2 text-sm"
          >
            {hosts
              .filter((h) => h.id !== origemId)
              .map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {mode === "vlan" ? ` (VLAN ${h.vlan})` : ""}
                </option>
              ))}
            <option value="broadcast">Broadcast (ff:ff:ff:ff:ff:ff)</option>
          </select>
        </div>

        <Button onClick={enviar} className="hit-44 gap-2">
          <Send className="size-4" aria-hidden />
          Enviar quadro
        </Button>

        <Button
          variant="outline"
          onClick={limpar}
          disabled={log.length === 0}
          className="hit-44 gap-2"
        >
          <RotateCcw className="size-4" aria-hidden />
          Limpar CAM
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel overflow-hidden">
          <p className="border-b border-rail bg-panel-sunken px-3 py-2 text-sm font-semibold">
            Tabela CAM
            <span className="ml-2 font-normal text-muted-foreground">
              {cam.length} {cam.length === 1 ? "entrada" : "entradas"}
            </span>
          </p>
          {cam.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              A tabela começa vazia. O switch só aprende quando um quadro chega:
              ele registra o MAC de <em>origem</em> e a porta de entrada.
            </p>
          ) : (
            <div className="scroll-x" tabIndex={0} role="region" aria-label="Endereços MAC aprendidos pelo switch">
              <table className="w-full min-w-max text-sm">
                <caption className="sr-only">
                  Endereços MAC aprendidos pelo switch, com a porta, o tipo e
                  há quantos quadros a entrada existe
                </caption>
                <thead>
                  <tr className="border-b border-rail text-left">
                    <th scope="col" className="px-3 py-2 font-medium">MAC</th>
                    <th scope="col" className="px-3 py-2 font-medium">Porta</th>
                    {mode === "vlan" && (
                      <th scope="col" className="px-3 py-2 font-medium">VLAN</th>
                    )}
                    <th scope="col" className="px-3 py-2 font-medium">Tipo</th>
                    <th scope="col" className="px-3 py-2 font-medium">Idade</th>
                  </tr>
                </thead>
                <tbody>
                  {cam.map((e) => {
                    const aprendidaAgora =
                      ultimo?.resultado.learned?.mac === e.mac &&
                      ultimo?.resultado.learned?.vlan === e.vlan;
                    const idade = Math.max(0, tick - e.learnedAt);
                    return (
                      <tr
                        key={`${e.mac}-${e.vlan}`}
                        className={cn(
                          "border-b border-rail last:border-b-0",

                          aprendidaAgora && "bg-signal-soft",
                          animar && aprendidaAgora && "animate-in fade-in slide-in-from-left-2 duration-300",
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-xs">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {e.mac}
                            {aprendidaAgora && (
                              <span className="text-2xs font-semibold uppercase tracking-wider text-signal">
                                aprendido agora
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {portas.find((p) => p.id === e.port)?.label}
                        </td>
                        {mode === "vlan" && (
                          <td className={cn("px-3 py-2 font-mono text-xs", VLAN_CLASS[e.vlan])}>
                            {e.vlan}
                          </td>
                        )}
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          dinâmico
                        </td>
                        <td className="px-3 py-2 font-mono text-xs tabular-nums text-muted-foreground">
                          {idade === 0
                            ? "agora"
                            : `${idade} ${idade === 1 ? "quadro" : "quadros"}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel overflow-hidden" aria-live="polite">
          <p className="border-b border-rail bg-panel-sunken px-3 py-2 text-sm font-semibold">
            Encaminhamento
          </p>
          {log.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Envie um quadro para ver a decisão do switch.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-rail overflow-y-auto">
              {log.map((entry) => (
                <li key={entry.id} className="px-4 py-3">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{entry.id}
                    </span>
                    <span className="font-medium">
                      {entry.origem} → {entry.destino}
                    </span>
                    <span
                      className={cn(
                        "silkscreen",
                        entry.resultado.action === "inundar" && "text-caution",
                        entry.resultado.action === "encaminhar" && "text-signal",
                        entry.resultado.action === "descartar" && "text-fault",
                      )}
                    >
                      {entry.resultado.action}
                    </span>
                    {entry.resultado.taggedEgressPorts.length > 0 && (
                      <span className="flex items-center gap-1 text-2xs text-caution">
                        <Tag className="size-3" aria-hidden />
                        802.1Q
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.resultado.explanation}
                  </p>
                  {entry.resultado.egressPorts.length > 0 && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      Sai por:{" "}
                      {entry.resultado.egressPorts
                        .map((p) => portas.find((x) => x.id === p)?.label)
                        .join(", ")}
                    </p>
                  )}
                  {entry.conclusao && (
                    <p className="mt-2 flex gap-2 rounded-sm border border-caution/40 bg-caution-soft p-2.5 text-sm">
                      <CircleAlert
                        className="mt-0.5 size-4 shrink-0 text-caution"
                        aria-hidden
                      />
                      <span>{entry.conclusao}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
