"use client";

import { useMemo, useState } from "react";
import { Plus, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "./data-table";
import {
  broadcastAddress,
  formatIpv4,
  networkAddress,
  parseCidr,
  totalAddresses,
} from "@/lib/net/ipv4";
import { allocateVlsm, type VlsmRequirement } from "@/lib/net/vlsm";
import { BlockDivision, segmentStyle } from "./block-division";
import { cn } from "@/lib/utils";

const PADRAO: VlsmRequirement[] = [
  { id: "lan-a", label: "LAN A", hosts: 60 },
  { id: "lan-b", label: "LAN B", hosts: 28 },
  { id: "lan-c", label: "LAN C", hosts: 12 },
  { id: "lan-d", label: "LAN D", hosts: 10 },
  { id: "wan-1", label: "WAN 1", hosts: 2 },
  { id: "wan-2", label: "WAN 2", hosts: 2 },
];

export function VlsmAllocator() {
  const [blocoRaw, setBlocoRaw] = useState("192.168.10.0/24");
  const [requisitos, setRequisitos] = useState<VlsmRequirement[]>(PADRAO);

  const bloco = useMemo(() => parseCidr(blocoRaw), [blocoRaw]);

  const resultado = useMemo(() => {
    if (!bloco.ok) return null;
    return allocateVlsm(bloco.value, requisitos);
  }, [bloco, requisitos]);

  const tamanhoBloco = bloco.ok ? totalAddresses(bloco.value.prefix) : 0;

  function atualizar(id: string, patch: Partial<VlsmRequirement>) {
    setRequisitos((atual) =>
      atual.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function remover(id: string) {
    setRequisitos((atual) => atual.filter((r) => r.id !== id));
  }

  function adicionar() {
    const n = requisitos.length + 1;
    setRequisitos((atual) => [
      ...atual,
      { id: `sub-${Date.now()}`, label: `Sub-rede ${n}`, hosts: 10 },
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">

        <div className="min-w-0 space-y-4">
          <div className="panel p-4">
            <Label htmlFor="bloco" className="text-sm font-medium">
              Bloco disponível
            </Label>
            <Input
              id="bloco"
              value={blocoRaw}
              onChange={(e) => setBlocoRaw(e.target.value)}
              className="mt-2 font-mono"
              spellCheck={false}
              aria-invalid={!bloco.ok}
              aria-describedby={!bloco.ok ? "bloco-erro" : undefined}
            />
            {!bloco.ok && (
              <p id="bloco-erro" role="alert" className="mt-2 text-sm text-fault">
                {bloco.error}
              </p>
            )}
            {bloco.ok && (
              <p className="mt-2 text-xs text-muted-foreground">
                {totalAddresses(bloco.value.prefix).toLocaleString("pt-BR")}{" "}
                endereços, de{" "}
                <span className="font-mono">
                  {formatIpv4(networkAddress(bloco.value.address, bloco.value.prefix))}
                </span>{" "}
                a{" "}
                <span className="font-mono">
                  {formatIpv4(broadcastAddress(bloco.value.address, bloco.value.prefix))}
                </span>
                .
              </p>
            )}
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Requisitos</h2>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setRequisitos(PADRAO)}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restaurar
              </Button>
            </div>

            <ul className="mt-3 space-y-2">
              {requisitos.map((req, index) => (
                <li key={req.id} className="flex items-end gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "mb-2.5 size-3 shrink-0 rounded-xs border border-rail",
                      segmentStyle(index).cor,
                      segmentStyle(index).hachura,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor={`nome-${req.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Nome
                    </Label>
                    <Input
                      id={`nome-${req.id}`}
                      value={req.label}
                      onChange={(e) => atualizar(req.id, { label: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <Label
                      htmlFor={`hosts-${req.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Hosts
                    </Label>
                    <Input
                      id={`hosts-${req.id}`}
                      type="number"
                      min={1}
                      value={req.hosts}
                      onChange={(e) =>
                        atualizar(req.id, { hosts: Number(e.target.value) })
                      }
                      className="mt-1 h-8 text-sm tabular-nums"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="mb-0.5 size-8 shrink-0"
                    aria-label={`Remover ${req.label}`}
                    onClick={() => remover(req.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full gap-1.5"
              onClick={adicionar}
            >
              <Plus className="size-3.5" aria-hidden />
              Adicionar sub-rede
            </Button>
          </div>
        </div>

        <div className="min-w-0 space-y-4" aria-live="polite">
          {resultado && !resultado.ok && resultado.error && (
            <div className="panel border-fault/40 bg-fault-soft p-4">
              <p className="flex items-start gap-2 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-fault" aria-hidden />
                <span>
                  <span className="font-semibold">Não coube.</span>{" "}
                  {resultado.error} Reduza a demanda ou use um bloco maior: o
                  resultado parcial abaixo mostra o que foi possível alocar.
                </span>
              </p>
            </div>
          )}

          {resultado && bloco.ok && resultado.allocations.length > 0 && (
            <BlockDivision
              className="panel p-4"
              segments={resultado.allocations.map((a) => ({
                id: a.requirement.id,
                label: a.requirement.label,
                network: a.network,
                prefix: a.prefix,
                requestedHosts: a.requirement.hosts,
              }))}
              blockSize={tamanhoBloco}
              remaining={resultado.remainingAddresses}
              nextFree={resultado.nextFreeAddress}
            />
          )}

          {resultado && resultado.allocations.length > 0 && (
            <DataTable
              caption="Sub-redes alocadas por VLSM"
              headers={[
                "Sub-rede",
                "Rede",
                "Máscara",
                "Faixa utilizável",
                "Broadcast",
                "Hosts",
                "Sobra",
              ]}
              monoColumns={[1, 2, 3, 4]}
              rows={resultado.allocations.map((a) => [
                a.requirement.label,
                `${formatIpv4(a.network)}/${a.prefix}`,
                formatIpv4(a.mask),
                `${formatIpv4(a.firstHost)} – ${formatIpv4(a.lastHost)}`,
                formatIpv4(a.broadcast),
                `${a.requirement.hosts} / ${a.usable}`,
                a.waste === 0 ? (
                  <span key="w" className="text-signal">0</span>
                ) : (
                  <span key="w" className="text-caution">{a.waste}</span>
                ),
              ])}
            />
          )}

          <p className="text-sm text-muted-foreground">
            A alocação começa pela maior demanda. Fazer o contrário fragmenta o
            bloco e desperdiça endereços, e é por isso que a ordem faz parte do
            método, não da interface.
          </p>
        </div>
      </div>
    </div>
  );
}
