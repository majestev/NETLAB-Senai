"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEVICE_SYMBOL, DeviceSymbols } from "./device-symbols";
import {
  DEVICE_RULES,
  countDomains,
  type TopologyDeviceKind,
} from "@/lib/net/domains";
import { cn } from "@/lib/utils";

type DadosNo = { kind: TopologyDeviceKind; label: string };
type NoTopologia = Node<DadosNo, "equipamento">;

const SIMBOLO: Record<TopologyDeviceKind, string> = {
  host: DEVICE_SYMBOL.host,
  hub: DEVICE_SYMBOL.switch,
  switch: DEVICE_SYMBOL.switch,
  router: DEVICE_SYMBOL.router,
};

function NoEquipamento({ data, selected }: NodeProps<NoTopologia>) {
  return (
    <div
      className={cn(
        "flex w-[86px] flex-col items-center gap-1 rounded-sm border-2 bg-panel px-2 py-2",
        selected ? "border-fiber" : "border-rail-strong",
      )}
    >
      <Handle type="target" position={Position.Top} className="!size-2 !bg-copper" />
      <svg viewBox="0 0 48 48" className="size-7" aria-hidden>
        <use href={SIMBOLO[data.kind]} stroke="var(--foreground)" fill="none" />
      </svg>
      <span className="font-mono text-[11px] font-semibold leading-none">
        {data.label}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {DEVICE_RULES[data.kind].label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!size-2 !bg-copper" />
    </div>
  );
}

const TIPOS_DE_NO = { equipamento: NoEquipamento };

const INICIAL: NoTopologia[] = [
  { id: "sw1", type: "equipamento", position: { x: 160, y: 30 }, data: { kind: "switch", label: "SW1" } },
  { id: "pc1", type: "equipamento", position: { x: 40, y: 170 }, data: { kind: "host", label: "PC1" } },
  { id: "pc2", type: "equipamento", position: { x: 160, y: 170 }, data: { kind: "host", label: "PC2" } },
  { id: "pc3", type: "equipamento", position: { x: 280, y: 170 }, data: { kind: "host", label: "PC3" } },
];

const ARESTAS_INICIAIS: Edge[] = [
  { id: "e1", source: "sw1", target: "pc1" },
  { id: "e2", source: "sw1", target: "pc2" },
  { id: "e3", source: "sw1", target: "pc3" },
];

const PALETA: TopologyDeviceKind[] = ["host", "hub", "switch", "router"];

const PREFIXO: Record<TopologyDeviceKind, string> = {
  host: "PC",
  hub: "HUB",
  switch: "SW",
  router: "R",
};

export function TopologyBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NoTopologia>(INICIAL);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(ARESTAS_INICIAIS);
  const [origem, setOrigem] = useState("sw1");
  const [destino, setDestino] = useState("pc1");

  const flow = useRef<ReactFlowInstance<NoTopologia, Edge> | null>(null);

  const proximoId = useRef(0);
  const gerarId = useCallback((prefixo: string) => {
    proximoId.current += 1;
    return `${prefixo}-${proximoId.current}`;
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, id: gerarId("e") }, eds)),
    [setEdges, gerarId],
  );

  const resultado = useMemo(
    () =>
      countDomains(
        nodes.map((n) => ({ id: n.id, kind: n.data.kind, label: n.data.label })),
        edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      ),
    [nodes, edges],
  );

  function adicionar(kind: TopologyDeviceKind) {
    const mesmos = nodes.filter((n) => n.data.kind === kind).length + 1;
    const id = gerarId(kind);
    setNodes((ns) => [
      ...ns,
      {
        id,
        type: "equipamento",
        position: {
          x: 40 + (ns.length % 5) * 110,
          y: 300 + Math.floor(ns.length / 5) * 110,
        },
        data: { kind, label: `${PREFIXO[kind]}${mesmos}` },
      },
    ]);

    window.setTimeout(() => flow.current?.fitView({ duration: 250, padding: 0.15 }), 50);
  }

  function ligar() {
    if (origem === destino) return;
    const jaExiste = edges.some(
      (e) =>
        (e.source === origem && e.target === destino) ||
        (e.source === destino && e.target === origem),
    );
    if (jaExiste) return;
    setEdges((es) => [...es, { id: gerarId("e"), source: origem, target: destino }]);
  }

  function removerEnlace(id: string) {
    setEdges((es) => es.filter((e) => e.id !== id));
  }

  function removerEquipamento(id: string) {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
  }

  function reiniciar() {
    setNodes(INICIAL);
    setEdges(ARESTAS_INICIAIS);
  }

  const rotuloDe = (id: string) =>
    nodes.find((n) => n.id === id)?.data.label ?? id;

  return (
    <div className="space-y-4">
      <DeviceSymbols />

      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        <div
          className="panel p-4"
          role="status"
          aria-label={`Contagem de domínios de colisão: ${resultado.collision}`}
          data-testid="contagem-colisao"
        >
          <p className="silkscreen">Domínios de colisão</p>
          <p className="mt-1 font-mono text-3xl tabular-nums text-copper">
            {resultado.collision}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Um por enlace, exceto onde um hub funde todos os seus.
          </p>
        </div>
        <div
          className="panel p-4"
          role="status"
          aria-label={`Contagem de domínios de broadcast: ${resultado.broadcast}`}
          data-testid="contagem-broadcast"
        >
          <p className="silkscreen">Domínios de broadcast</p>
          <p className="mt-1 font-mono text-3xl tabular-nums text-fiber">
            {resultado.broadcast}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Só o roteador separa; hub e switch deixam o broadcast passar.
          </p>
        </div>
      </div>

      <div
        className="panel h-[26rem] overflow-hidden"
        role="application"
        aria-label="Área de montagem da topologia. Arraste para reposicionar e conecte pelos pontos das bordas; os mesmos comandos existem em formulário logo abaixo."
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance) => {
            flow.current = instance;
          }}
          nodeTypes={TIPOS_DE_NO}
          fitView
          proOptions={{ hideAttribution: false }}
          className="bg-panel-sunken"
        >
          <Background color="var(--rail)" gap={18} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="panel p-4">
        <p className="silkscreen mb-3">Adicionar equipamento</p>
        <div className="flex flex-wrap gap-2">
          {PALETA.map((kind) => (
            <Button
              key={kind}
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => adicionar(kind)}
            >
              <Plus className="size-3.5" aria-hidden />
              {DEVICE_RULES[kind].label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="ml-auto gap-1.5" onClick={reiniciar}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reiniciar
          </Button>
        </div>

        <p className="silkscreen mb-3 mt-5">Criar enlace</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="enlace-origem" className="text-xs text-muted-foreground">
              Equipamento de origem
            </Label>
            <select
              id="enlace-origem"
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              className="mt-1 h-11 rounded-sm border border-input bg-panel px-2 text-sm"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="enlace-destino" className="text-xs text-muted-foreground">
              Equipamento de destino
            </Label>
            <select
              id="enlace-destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="mt-1 h-11 rounded-sm border border-input bg-panel px-2 text-sm"
            >
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.data.label}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" className="gap-1.5" onClick={ligar}>
            <Link2 className="size-3.5" aria-hidden />
            Ligar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel overflow-hidden">
          <p className="border-b border-rail bg-panel-sunken px-3 py-2 text-sm font-semibold">
            Equipamentos ({nodes.length})
          </p>
          <ul className="divide-y divide-rail">
            {nodes.map((n) => (
              <li key={n.id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="font-mono text-sm">{n.data.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {DEVICE_RULES[n.data.kind].label} — {DEVICE_RULES[n.data.kind].colisao}
                  </span>
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 shrink-0"
                  aria-label={`Remover ${n.data.label}`}
                  onClick={() => removerEquipamento(n.id)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel overflow-hidden">
          <p className="border-b border-rail bg-panel-sunken px-3 py-2 text-sm font-semibold">
            Enlaces ({edges.length})
          </p>
          {edges.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Nenhum enlace. Sem enlaces não há domínios a contar.
            </p>
          ) : (
            <ul className="divide-y divide-rail">
              {edges.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1 font-mono text-sm">
                    {rotuloDe(e.source)} — {rotuloDe(e.target)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    aria-label={`Remover o enlace entre ${rotuloDe(e.source)} e ${rotuloDe(e.target)}`}
                    onClick={() => removerEnlace(e.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
