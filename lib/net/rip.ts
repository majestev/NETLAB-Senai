import { formatIpv4, type PrefixLength } from "./ipv4";

export const RIP_INFINITY = 16;

export interface RipRouter {
  id: string;
  name: string;
}

export interface RipLink {
  id: string;
  a: string;
  b: string;

  network: number;
  prefix: PrefixLength;
  up: boolean;
}

export interface RipTopology {
  routers: RipRouter[];
  links: RipLink[];
}

export interface RipRoute {
  key: string;
  network: number;
  prefix: PrefixLength;
  metric: number;

  via: string | null;

  linkId: string | null;
}

export type RipTables = Record<string, RipRoute[]>;

export interface RipOptions {
  splitHorizon: boolean;
}

export function networkKey(network: number, prefix: PrefixLength): string {
  return `${network >>> 0}/${prefix}`;
}

export function formatNetworkKey(key: string): string {
  const [network, prefix] = key.split("/");
  return `${formatIpv4(Number(network))}/${prefix}`;
}

function neighborsOf(topology: RipTopology, routerId: string) {
  return topology.links
    .filter((l) => l.up && (l.a === routerId || l.b === routerId))
    .map((l) => ({
      link: l,
      neighborId: l.a === routerId ? l.b : l.a,
    }));
}

export function initialTables(topology: RipTopology): RipTables {
  const tables: RipTables = {};
  for (const router of topology.routers) {
    tables[router.id] = topology.links
      .filter((l) => l.up && (l.a === router.id || l.b === router.id))
      .map((l) => ({
        key: networkKey(l.network, l.prefix),
        network: l.network,
        prefix: l.prefix,
        metric: 0,
        via: null,
        linkId: l.id,
      }));
  }
  return tables;
}

export interface RipChange {
  routerId: string;
  networkKey: string;
  from: number | null;
  to: number;
  via: string | null;
  reason:
    | "rota-nova"
    | "metrica-melhor"
    | "atualizacao-do-proximo-salto"
    | "envenenada";
}

export interface RipIteration {
  index: number;
  tables: RipTables;
  changes: RipChange[];
  converged: boolean;
}

function stepRip(
  topology: RipTopology,
  tables: RipTables,
  options: RipOptions,
): { tables: RipTables; changes: RipChange[] } {
  const next: RipTables = {};
  const changes: RipChange[] = [];

  for (const router of topology.routers) {
    const current = tables[router.id] ?? [];
    const byKey = new Map<string, RipRoute>(current.map((r) => [r.key, r]));

    for (const link of topology.links) {
      if (!link.up) continue;
      if (link.a !== router.id && link.b !== router.id) continue;
      const key = networkKey(link.network, link.prefix);
      const existing = byKey.get(key);
      if (!existing || existing.metric > 0) {
        byKey.set(key, {
          key,
          network: link.network,
          prefix: link.prefix,
          metric: 0,
          via: null,
          linkId: link.id,
        });
      }
    }

    for (const { neighborId, link } of neighborsOf(topology, router.id)) {
      for (const advertised of tables[neighborId] ?? []) {
        if (options.splitHorizon && advertised.via === router.id) continue;

        const metric = Math.min(advertised.metric + 1, RIP_INFINITY);
        const existing = byKey.get(advertised.key);

        if (existing && existing.metric === 0) continue;

        if (!existing) {
          if (metric >= RIP_INFINITY) continue;
          byKey.set(advertised.key, {
            key: advertised.key,
            network: advertised.network,
            prefix: advertised.prefix,
            metric,
            via: neighborId,
            linkId: link.id,
          });
          changes.push({
            routerId: router.id,
            networkKey: advertised.key,
            from: null,
            to: metric,
            via: neighborId,
            reason: "rota-nova",
          });
          continue;
        }

        const isCurrentNextHop = existing.via === neighborId;

        if (metric < existing.metric) {
          byKey.set(advertised.key, {
            ...existing,
            metric,
            via: neighborId,
            linkId: link.id,
          });
          changes.push({
            routerId: router.id,
            networkKey: advertised.key,
            from: existing.metric,
            to: metric,
            via: neighborId,
            reason: "metrica-melhor",
          });
        } else if (isCurrentNextHop && metric !== existing.metric) {
          byKey.set(advertised.key, { ...existing, metric, linkId: link.id });
          changes.push({
            routerId: router.id,
            networkKey: advertised.key,
            from: existing.metric,
            to: metric,
            via: neighborId,
            reason:
              metric >= RIP_INFINITY ? "envenenada" : "atualizacao-do-proximo-salto",
          });
        }
      }
    }

    next[router.id] = [...byKey.values()].sort((a, b) =>
      a.key.localeCompare(b.key, "en", { numeric: true }),
    );
  }

  return { tables: next, changes };
}

export type LinkFailureMode = "envenenar" | "expirar";

export function poisonRoutesOverLink(
  tables: RipTables,
  linkId: string,
  mode: LinkFailureMode = "envenenar",
): { tables: RipTables; changes: RipChange[] } {
  const next: RipTables = {};
  const changes: RipChange[] = [];

  for (const [routerId, routes] of Object.entries(tables)) {
    const restantes: RipRoute[] = [];

    for (const route of routes) {
      if (route.linkId !== linkId || route.metric >= RIP_INFINITY) {
        restantes.push(route);
        continue;
      }

      changes.push({
        routerId,
        networkKey: route.key,
        from: route.metric,
        to: RIP_INFINITY,
        via: route.via,
        reason: "envenenada",
      });

      if (mode === "envenenar") {
        restantes.push({ ...route, metric: RIP_INFINITY });
      }
    }

    next[routerId] = restantes;
  }

  if (mode === "envenenar") {
    let mudou = true;
    while (mudou) {
      mudou = false;
      for (const [routerId, routes] of Object.entries(next)) {
        for (let i = 0; i < routes.length; i += 1) {
          const route = routes[i]!;
          if (route.via === null || route.metric >= RIP_INFINITY) continue;

          const noVizinho = next[route.via]?.find((r) => r.key === route.key);
          const vizinhoPerdeu = !noVizinho || noVizinho.metric >= RIP_INFINITY;
          if (!vizinhoPerdeu) continue;

          routes[i] = { ...route, metric: RIP_INFINITY };
          changes.push({
            routerId,
            networkKey: route.key,
            from: route.metric,
            to: RIP_INFINITY,
            via: route.via,
            reason: "envenenada",
          });
          mudou = true;
        }
      }
    }
  }

  return { tables: next, changes };
}

export function runRip(
  topology: RipTopology,
  options: RipOptions,
  maxIterations = 16,
  from?: RipTables,
): RipIteration[] {
  let tables = from ?? initialTables(topology);
  const iterations: RipIteration[] = [
    { index: 0, tables, changes: [], converged: false },
  ];

  for (let i = 1; i <= maxIterations; i += 1) {
    const result = stepRip(topology, tables, options);
    tables = result.tables;
    const converged = result.changes.length === 0;
    iterations.push({
      index: i,
      tables,
      changes: result.changes,
      converged,
    });
    if (converged) break;
  }

  return iterations;
}

export function isReachable(route: RipRoute): boolean {
  return route.metric < RIP_INFINITY;
}
