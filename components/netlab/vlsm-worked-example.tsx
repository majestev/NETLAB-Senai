import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  broadcastAddress,
  formatIpv4,
  maskFromPrefix,
  networkAddress,
  parseCidr,
  totalAddresses,
  usableHosts,
} from "@/lib/net/ipv4";
import { allocateVlsm, type VlsmRequirement } from "@/lib/net/vlsm";
import { BlockDivision, segmentStyle } from "./block-division";
import { cn } from "@/lib/utils";

export const VLSM_BLOCO = "192.168.10.0/24";

export const VLSM_REQUISITOS: VlsmRequirement[] = [
  { id: "lan-a", label: "LAN A", hosts: 60 },
  { id: "lan-b", label: "LAN B", hosts: 28 },
  { id: "lan-c", label: "LAN C", hosts: 12 },
  { id: "lan-d", label: "LAN D", hosts: 10 },
  { id: "wan-1", label: "WAN 1", hosts: 2 },
  { id: "wan-2", label: "WAN 2", hosts: 2 },
];

export function VlsmWorkedExample() {
  const bloco = parseCidr(VLSM_BLOCO);
  if (!bloco.ok) return null;

  const resultado = allocateVlsm(bloco.value, VLSM_REQUISITOS);
  const tamanhoBloco = totalAddresses(bloco.value.prefix);
  const inicio = networkAddress(bloco.value.address, bloco.value.prefix);
  const fim = broadcastAddress(bloco.value.address, bloco.value.prefix);

  const ordenados = [...VLSM_REQUISITOS].sort((a, b) => b.hosts - a.hosts);

  const marcaDe = (id: string) =>
    segmentStyle(VLSM_REQUISITOS.findIndex((r) => r.id === id));

  return (
    <div className="space-y-5">
      <div className="panel p-4">
        <p className="silkscreen mb-2">Enunciado</p>
        <p className="text-[1.0625rem] leading-relaxed">
          A rede recebeu o bloco{" "}
          <span className="font-mono text-copper">{VLSM_BLOCO}</span> —{" "}
          {tamanhoBloco} endereços, de{" "}
          <span className="font-mono">{formatIpv4(inicio)}</span> a{" "}
          <span className="font-mono">{formatIpv4(fim)}</span>. É preciso
          endereçar quatro LANs de tamanhos diferentes e dois enlaces
          ponto a ponto entre roteadores, sem sobrepor sub-redes e sem
          receber outro bloco.
        </p>
      </div>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Passo 1 — ordenar da maior demanda para a menor
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Alocar fora dessa ordem fragmenta o bloco: as sub-redes pequenas
          ocupam posições que impedem as maiores de caber depois.
        </p>
        <ol className="flex flex-wrap gap-2">
          {ordenados.map((r, i) => (
            <li
              key={r.id}
              className="flex items-center gap-2 rounded-sm border border-rail px-3 py-1.5 text-sm"
            >
              <span aria-hidden className={cn("size-2.5 rounded-xs border border-rail", marcaDe(r.id).cor, marcaDe(r.id).hachura)} />
              <span className="font-medium">{r.label}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {r.hosts} hosts
              </span>
              {i < ordenados.length - 1 && (
                <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Passo 2 — dimensionar cada sub-rede
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Para cada demanda, o menor prefixo cujo 2<sup>h</sup> − 2 ainda cobre
          a quantidade de hosts.
        </p>
        <div
          className="panel scroll-x"
          tabIndex={0}
          role="region"
          aria-label="Dimensionamento de cada sub-rede"
        >
          <table className="w-full min-w-max text-sm">
            <caption className="sr-only">
              Cálculo do prefixo necessário para cada sub-rede
            </caption>
            <thead>
              <tr className="border-b border-rail bg-panel-sunken text-left">
                {["Sub-rede", "Hosts pedidos", "Bits de host", "Cálculo", "Prefixo", "Hosts obtidos"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resultado.allocations.map((a) => {
                const bits = 32 - a.prefix;
                return (
                  <tr key={a.requirement.id} className="border-b border-rail last:border-b-0">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className={cn("size-2.5 shrink-0 rounded-xs border border-rail", marcaDe(a.requirement.id).cor, marcaDe(a.requirement.id).hachura)} />
                        {a.requirement.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{a.requirement.hosts}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{bits}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                      2^{bits} − 2 = {a.usable}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-copper">/{a.prefix}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{a.usable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Passo 3 — alocar em sequência, cada uma alinhada ao próprio tamanho
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Uma sub-rede sempre começa num endereço múltiplo da quantidade de
          endereços que ela ocupa. É esse alinhamento que garante que os
          blocos não se sobreponham.
        </p>
        <div
          className="panel scroll-x"
          tabIndex={0}
          role="region"
          aria-label="Alocação final das sub-redes"
        >
          <table className="w-full min-w-max text-sm">
            <caption className="sr-only">
              Endereçamento final de cada sub-rede dentro de {VLSM_BLOCO}
            </caption>
            <thead>
              <tr className="border-b border-rail bg-panel-sunken text-left">
                {["Sub-rede", "Rede", "Máscara", "Primeiro host", "Último host", "Broadcast", "Sobra"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {resultado.allocations.map((a) => (
                <tr key={a.requirement.id} className="border-b border-rail last:border-b-0">
                  <td className="px-3 py-2.5 font-sans text-sm">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-xs border border-rail", marcaDe(a.requirement.id).cor, marcaDe(a.requirement.id).hachura)} />
                      {a.requirement.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-copper">
                    {formatIpv4(a.network)}/{a.prefix}
                  </td>
                  <td className="px-3 py-2.5">{formatIpv4(maskFromPrefix(a.prefix))}</td>
                  <td className="px-3 py-2.5">{formatIpv4(a.firstHost)}</td>
                  <td className="px-3 py-2.5">{formatIpv4(a.lastHost)}</td>
                  <td className="px-3 py-2.5">{formatIpv4(a.broadcast)}</td>
                  <td className={cn("px-3 py-2.5", a.waste === 0 ? "text-signal" : "text-caution")}>
                    {a.waste}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Como o bloco ficou dividido</h3>
        <BlockDivision
          caption="Mapa do bloco"
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
        <p className="mt-2 text-sm text-muted-foreground">
          Das {tamanhoBloco} endereços do bloco,{" "}
          {tamanhoBloco - resultado.remainingAddresses} foram alocados e{" "}
          {resultado.remainingAddresses} continuam livres
          {resultado.nextFreeAddress !== null && (
            <>
              , a partir de{" "}
              <span className="font-mono text-foreground">
                {formatIpv4(resultado.nextFreeAddress)}
              </span>
            </>
          )}
          . As duas WANs ficaram com desperdício zero: um /30 oferece
          exatamente {usableHosts(30)} hosts, que é o que um enlace ponto a
          ponto precisa.
        </p>
      </section>

      <Link
        href="/laboratorios/vlsm"
        className="panel group flex items-center gap-4 border-copper/40 bg-copper-soft p-4 transition-colors"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">
            Fazer esta alocação você mesmo
          </span>
          <span className="block text-sm text-muted-foreground">
            O laboratório usa exatamente este bloco e estas seis sub-redes, e
            corrige sobreposição, alinhamento e dimensionamento.
          </span>
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-copper transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  );
}
