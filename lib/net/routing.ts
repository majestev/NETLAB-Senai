import {
  broadcastAddress,
  formatIpv4,
  isInNetwork,
  networkAddress,
  type PrefixLength,
} from "./ipv4";

export type RouteSource =
  | "conectada"
  | "estática"
  | "RIP"
  | "OSPF"
  | "EIGRP"
  | "padrão";

export interface RouteEntry {
  id: string;

  network: number;
  prefix: PrefixLength;
  source: RouteSource;

  ad: number;
  metric: number;

  nextHop: number | null;
  iface: string;
}

export type DecisionStepKind =
  | "candidatas"
  | "prefixo-mais-longo"
  | "distancia-administrativa"
  | "metrica"
  | "ecmp"
  | "sem-rota";

export interface DecisionStep {
  kind: DecisionStepKind;
  title: string;
  explanation: string;

  survivorIds: string[];
}

export interface RoutingDecision {
  destination: number;
  steps: DecisionStep[];

  chosen: RouteEntry[];

  dropped: boolean;
}

export function decideRoute(
  destination: number,
  table: RouteEntry[],
): RoutingDecision {
  const steps: DecisionStep[] = [];

  const candidates = table.filter((route) =>
    isInNetwork(destination, route.network, route.prefix),
  );

  steps.push({
    kind: "candidatas",
    title: "Rotas que casam com o destino",
    explanation:
      candidates.length === 0
        ? `Nenhuma entrada da tabela contém ${formatIpv4(destination)}.`
        : `${candidates.length} ${candidates.length === 1 ? "entrada contém" : "entradas contêm"} ${formatIpv4(destination)}. As demais são descartadas de imediato.`,
    survivorIds: candidates.map((r) => r.id),
  });

  if (candidates.length === 0) {
    steps.push({
      kind: "sem-rota",
      title: "Pacote descartado",
      explanation:
        "Sem rota que case e sem rota padrão, o roteador descarta o pacote e responde ICMP destino inalcançável.",
      survivorIds: [],
    });
    return { destination, steps, chosen: [], dropped: true };
  }

  const longest = Math.max(...candidates.map((r) => r.prefix));
  const byPrefix = candidates.filter((r) => r.prefix === longest);
  steps.push({
    kind: "prefixo-mais-longo",
    title: "Prefixo mais longo",
    explanation: `A entrada mais específica vence: /${longest}. Máscara maior significa conhecimento mais preciso do destino.`,
    survivorIds: byPrefix.map((r) => r.id),
  });

  if (byPrefix.length === 1) {
    return { destination, steps, chosen: byPrefix, dropped: false };
  }

  const bestAd = Math.min(...byPrefix.map((r) => r.ad));
  const byAd = byPrefix.filter((r) => r.ad === bestAd);
  steps.push({
    kind: "distancia-administrativa",
    title: "Distância administrativa",
    explanation: `Mesmo prefixo anunciado por origens diferentes: vence a de menor distância administrativa (${bestAd}), por ser considerada mais confiável.`,
    survivorIds: byAd.map((r) => r.id),
  });

  if (byAd.length === 1) {
    return { destination, steps, chosen: byAd, dropped: false };
  }

  const bestMetric = Math.min(...byAd.map((r) => r.metric));
  const byMetric = byAd.filter((r) => r.metric === bestMetric);
  steps.push({
    kind: "metrica",
    title: "Métrica",
    explanation: `Mesma origem e mesmo prefixo: vence o menor custo do protocolo (métrica ${bestMetric}).`,
    survivorIds: byMetric.map((r) => r.id),
  });

  if (byMetric.length > 1) {
    steps.push({
      kind: "ecmp",
      title: "ECMP — múltiplos caminhos de custo igual",
      explanation: `${byMetric.length} rotas empatam em prefixo, distância administrativa e métrica. O roteador instala todas e distribui o tráfego entre elas.`,
      survivorIds: byMetric.map((r) => r.id),
    });
  }

  return { destination, steps, chosen: byMetric, dropped: false };
}

export function routeRangeLabel(route: RouteEntry): string {
  const start = networkAddress(route.network, route.prefix);
  const end = broadcastAddress(route.network, route.prefix);
  return `${formatIpv4(start)} – ${formatIpv4(end)}`;
}
