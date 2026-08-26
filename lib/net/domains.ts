export type TopologyDeviceKind = "host" | "hub" | "switch" | "router";

export interface TopologyDevice {
  id: string;
  kind: TopologyDeviceKind;
  label: string;
}

export interface TopologyLink {
  id: string;
  source: string;
  target: string;
}

export interface DomainCount {
  collision: number;
  broadcast: number;

  invalidLinks: string[];
}

class UnionFind {
  private parent = new Map<string, string>();

  find(a: string): string {
    if (!this.parent.has(a)) this.parent.set(a, a);
    let root = this.parent.get(a)!;
    while (root !== this.parent.get(root)!) root = this.parent.get(root)!;

    let cur = a;
    while (cur !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }

  groups(members: string[]): string[][] {
    const mapa = new Map<string, string[]>();
    for (const m of members) {
      const raiz = this.find(m);
      const lista = mapa.get(raiz) ?? [];
      lista.push(m);
      mapa.set(raiz, lista);
    }
    return [...mapa.values()];
  }
}

const FUNDE_COLISAO: Record<TopologyDeviceKind, boolean> = {
  host: false,
  hub: true,
  switch: false,
  router: false,
};

const FUNDE_BROADCAST: Record<TopologyDeviceKind, boolean> = {
  host: false,
  hub: true,
  switch: true,
  router: false,
};

export function countDomains(
  devices: TopologyDevice[],
  links: TopologyLink[],
): DomainCount {
  const porId = new Map(devices.map((d) => [d.id, d]));

  const validos = links.filter(
    (l) => porId.has(l.source) && porId.has(l.target) && l.source !== l.target,
  );
  const invalidLinks = links
    .filter((l) => !validos.includes(l))
    .map((l) => l.id);

  const colisao = new UnionFind();
  const broadcast = new UnionFind();

  for (const l of validos) {
    colisao.find(l.id);
    broadcast.find(l.id);
  }

  for (const device of devices) {
    const incidentes = validos.filter(
      (l) => l.source === device.id || l.target === device.id,
    );
    if (incidentes.length < 2) continue;

    for (let i = 1; i < incidentes.length; i += 1) {
      if (FUNDE_COLISAO[device.kind]) {
        colisao.union(incidentes[0].id, incidentes[i].id);
      }
      if (FUNDE_BROADCAST[device.kind]) {
        broadcast.union(incidentes[0].id, incidentes[i].id);
      }
    }
  }

  const ids = validos.map((l) => l.id);
  const collisionGroups = colisao.groups(ids);
  const broadcastGroups = broadcast.groups(ids);

  return {
    collision: collisionGroups.length,
    broadcast: broadcastGroups.length,
    invalidLinks,
  };
}

export const DEVICE_RULES: Record<
  TopologyDeviceKind,
  { label: string; colisao: string; broadcast: string }
> = {
  host: {
    label: "Host",
    colisao: "não segmenta — é uma ponta de enlace",
    broadcast: "não segmenta",
  },
  hub: {
    label: "Hub",
    colisao: "funde tudo num só domínio: todos disputam o mesmo meio",
    broadcast: "não segmenta",
  },
  switch: {
    label: "Switch",
    colisao: "cada porta é um domínio de colisão separado",
    broadcast: "não segmenta (sem VLAN)",
  },
  router: {
    label: "Roteador",
    colisao: "cada interface é um domínio de colisão separado",
    broadcast: "cada interface inicia um domínio de broadcast",
  },
};
