"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Campo {
  rotulo: string;
  valor: string;
  explicacao: string;
}

interface Linha {
  id: string;
  codigo: string;
  origem: string;
  prefixo: string;
  ad: number;
  metrica: number;
  nextHop: string;
  iface: string;
  campos: Campo[];
}

const TABELA: Linha[] = [
  {
    id: "conectada-lan",
    codigo: "C",
    origem: "Conectada",
    prefixo: "192.168.1.0/24",
    ad: 0,
    metrica: 0,
    nextHop: "—",
    iface: "Gi0/1",
    campos: [
      { rotulo: "Código", valor: "C — conectada", explicacao: "A letra à esquerda identifica como o roteador conheceu esta rota. C significa que ele tem uma interface nessa rede." },
      { rotulo: "Prefixo", valor: "192.168.1.0/24", explicacao: "A rede e a máscara. O /24 diz que os 24 primeiros bits identificam a rede: qualquer destino de 192.168.1.0 a 192.168.1.255 casa com esta entrada." },
      { rotulo: "Distância administrativa", valor: "0", explicacao: "Rede diretamente conectada é a origem mais confiável que existe: o roteador não depende de ninguém para saber que ela está ali. Por isso AD 0." },
      { rotulo: "Métrica", valor: "0", explicacao: "Não há custo de caminho: a rede está a zero saltos de distância." },
      { rotulo: "Próximo salto", valor: "nenhum", explicacao: "Não existe próximo salto porque não há para quem entregar; o roteador entrega diretamente na rede." },
      { rotulo: "Interface de saída", valor: "Gi0/1", explicacao: "A interface física que pertence a essa rede." },
    ],
  },
  {
    id: "conectada-wan",
    codigo: "C",
    origem: "Conectada",
    prefixo: "10.0.12.0/30",
    ad: 0,
    metrica: 0,
    nextHop: "—",
    iface: "Gi0/0",
    campos: [
      { rotulo: "Código", valor: "C — conectada", explicacao: "O enlace ponto a ponto com o roteador vizinho também é uma rede conectada." },
      { rotulo: "Prefixo", valor: "10.0.12.0/30", explicacao: "Um /30 tem 4 endereços: rede, dois hosts e broadcast. É o dimensionamento clássico de um enlace entre dois roteadores." },
      { rotulo: "Distância administrativa", valor: "0", explicacao: "Conectada, portanto AD 0." },
      { rotulo: "Métrica", valor: "0", explicacao: "Zero saltos." },
      { rotulo: "Próximo salto", valor: "nenhum", explicacao: "Rede local à interface." },
      { rotulo: "Interface de saída", valor: "Gi0/0", explicacao: "A interface voltada ao roteador vizinho. É por ela que sai todo tráfego cujo próximo salto seja 10.0.12.2." },
    ],
  },
  {
    id: "estatica",
    codigo: "S",
    origem: "Estática",
    prefixo: "192.168.3.0/24",
    ad: 1,
    metrica: 0,
    nextHop: "10.0.12.2",
    iface: "Gi0/0",
    campos: [
      { rotulo: "Código", valor: "S — estática", explicacao: "Rota escrita à mão pelo administrador. O roteador não a descobriu: ela foi declarada." },
      { rotulo: "Prefixo", valor: "192.168.3.0/24", explicacao: "A LAN que fica do outro lado do enlace. O roteador não tem interface nela, por isso precisa de uma rota." },
      { rotulo: "Distância administrativa", valor: "1", explicacao: "Rota estática tem AD 1: fica atrás apenas das conectadas. Se o RIP anunciasse este mesmo prefixo, com AD 120, a estática venceria." },
      { rotulo: "Métrica", valor: "0", explicacao: "Rotas estáticas não têm custo de protocolo; a métrica fica em 0." },
      { rotulo: "Próximo salto", valor: "10.0.12.2", explicacao: "O endereço do roteador vizinho no enlace. Precisa estar numa rede diretamente conectada — caso contrário o roteador não saberia por onde alcançá-lo, e a rota nem seria instalada." },
      { rotulo: "Interface de saída", valor: "Gi0/0", explicacao: "Derivada do próximo salto: 10.0.12.2 pertence à rede de Gi0/0." },
    ],
  },
  {
    id: "rip",
    codigo: "R",
    origem: "RIP",
    prefixo: "172.16.0.0/16",
    ad: 120,
    metrica: 2,
    nextHop: "10.0.12.2",
    iface: "Gi0/0",
    campos: [
      { rotulo: "Código", valor: "R — RIP", explicacao: "Rota aprendida dinamicamente por RIP, a partir do anúncio de um vizinho." },
      { rotulo: "Prefixo", valor: "172.16.0.0/16", explicacao: "Uma rede remota que o roteador nunca viu diretamente: ele sabe dela porque alguém a anunciou." },
      { rotulo: "Distância administrativa", valor: "120", explicacao: "AD do RIP. É alta porque o RIP é considerado menos confiável que OSPF (110), EIGRP (90) ou uma rota estática (1)." },
      { rotulo: "Métrica", valor: "2", explicacao: "Dois saltos: o vizinho anunciou a rede com métrica 1 e este roteador somou o próprio salto. No RIP a métrica é sempre contagem de saltos." },
      { rotulo: "Próximo salto", valor: "10.0.12.2", explicacao: "O vizinho que anunciou a rota. É para ele que os pacotes seguem." },
      { rotulo: "Interface de saída", valor: "Gi0/0", explicacao: "A interface por onde o anúncio chegou e por onde o tráfego sai." },
    ],
  },
  {
    id: "padrao",
    codigo: "S*",
    origem: "Padrão",
    prefixo: "0.0.0.0/0",
    ad: 1,
    metrica: 0,
    nextHop: "203.0.113.1",
    iface: "Gi0/2",
    campos: [
      { rotulo: "Código", valor: "S* — estática, candidata a último recurso", explicacao: "O asterisco marca a rota padrão: a candidata usada quando nada mais casa." },
      { rotulo: "Prefixo", valor: "0.0.0.0/0", explicacao: "Máscara de comprimento zero: nenhum bit precisa coincidir, então esta entrada casa com qualquer destino. Por ser a menos específica de todas, perde para qualquer outra pela regra do prefixo mais longo." },
      { rotulo: "Distância administrativa", valor: "1", explicacao: "É uma rota estática como outra qualquer; o que a torna especial é o prefixo /0, não a AD." },
      { rotulo: "Métrica", valor: "0", explicacao: "Sem custo de protocolo." },
      { rotulo: "Próximo salto", valor: "203.0.113.1", explicacao: "O roteador de saída, tipicamente o provedor. Todo destino desconhecido é entregue a ele." },
      { rotulo: "Interface de saída", valor: "Gi0/2", explicacao: "A interface voltada para fora." },
    ],
  },
];

export function RoutingTableExplorer() {
  const [selecionada, setSelecionada] = useState<string>("estatica");
  const linha = TABELA.find((l) => l.id === selecionada)!;

  return (
    <div className="space-y-4">
      <div
        className="panel scroll-x"
        tabIndex={0}
        role="region"
        aria-label="Tabela de roteamento explorável de R1"
      >
        <table className="w-full min-w-max text-sm">
          <caption className="sr-only">
            Tabela de roteamento de R1; selecione uma entrada para ler cada
            campo explicado
          </caption>
          <thead>
            <tr className="border-b border-rail bg-panel-sunken text-left">
              {["Situação", "Origem", "Prefixo", "AD", "Métrica", "Próximo salto", "Interface"].map((h) => (
                <th key={h} scope="col" className="px-3 py-2.5 font-semibold">

                  {h === "Situação" ? <span className="sr-only">{h}</span> : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABELA.map((l) => {
              const ativa = l.id === selecionada;
              return (
                <tr
                  key={l.id}
                  className={cn(
                    "border-b border-rail last:border-b-0",
                    ativa && "bg-copper-soft",
                  )}
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelecionada(l.id)}
                      aria-pressed={ativa}
                      aria-label={`Explicar a rota ${l.prefixo}, origem ${l.origem}`}
                      className={cn(
                        "rounded-sm px-2 py-1 font-mono text-xs font-semibold transition-colors",
                        ativa
                          ? "bg-copper text-primary-foreground"
                          : "border border-rail hover:border-rail-strong",
                      )}
                    >
                      {l.codigo}
                    </button>
                  </td>
                  <td className="px-3 py-2">{l.origem}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.prefixo}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{l.ad}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{l.metrica}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.nextHop}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.iface}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel p-4" aria-live="polite">
        <p className="silkscreen mb-3">
          Lendo a entrada {linha.prefixo}
        </p>
        <dl>
          {linha.campos.map((campo) => (
            <div
              key={campo.rotulo}
              className="border-b border-rail py-2.5 last:border-b-0"
            >
              <dt className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-sm font-medium">{campo.rotulo}</span>
                <span className="font-mono text-sm text-copper">{campo.valor}</span>
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {campo.explicacao}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
