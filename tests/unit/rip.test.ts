import { test, expect } from "@playwright/test";
import { parseIpv4 } from "@/lib/net/ipv4";
import {
  RIP_INFINITY,
  initialTables,
  networkKey,
  poisonRoutesOverLink,
  type LinkFailureMode,
  runRip,
  type RipTopology,
} from "@/lib/net/rip";

const ip = (v: string) => {
  const r = parseIpv4(v);
  if (!r.ok) throw new Error(v);
  return r.value;
};

function topologia(linksUp = { l12: true, l23: true }): RipTopology {
  return {
    routers: [
      { id: "r1", name: "R1" },
      { id: "r2", name: "R2" },
      { id: "r3", name: "R3" },
    ],
    links: [
      { id: "lan1", a: "r1", b: "r1", network: ip("192.168.1.0"), prefix: 24, up: true },
      { id: "l12", a: "r1", b: "r2", network: ip("10.0.12.0"), prefix: 30, up: linksUp.l12 },
      { id: "l23", a: "r2", b: "r3", network: ip("10.0.23.0"), prefix: 30, up: linksUp.l23 },
      { id: "lan3", a: "r3", b: "r3", network: ip("192.168.3.0"), prefix: 24, up: true },
    ],
  };
}

const LAN3 = networkKey(ip("192.168.3.0"), 24);
const LAN1 = networkKey(ip("192.168.1.0"), 24);

test("no início cada roteador só conhece as redes conectadas", () => {
  const tables = initialTables(topologia());
  expect(tables.r1.every((r) => r.metric === 0)).toBe(true);
  expect(tables.r1.some((r) => r.key === LAN3)).toBe(false);
});

test("a rede converge e a métrica é a contagem de saltos", () => {
  const iteracoes = runRip(topologia(), { splitHorizon: true });
  const final = iteracoes.at(-1)!;
  expect(final.converged).toBe(true);

  const r1paraLan3 = final.tables.r1.find((r) => r.key === LAN3);
  expect(r1paraLan3).toBeDefined();
  expect(r1paraLan3!.metric).toBe(2);
  expect(r1paraLan3!.via).toBe("r2");

  const r3paraLan1 = final.tables.r3.find((r) => r.key === LAN1);
  expect(r3paraLan1!.metric).toBe(2);

  expect(final.tables.r2.find((r) => r.key === LAN3)!.metric).toBe(1);
});

test("converge em poucas iterações e depois estabiliza", () => {
  const iteracoes = runRip(topologia(), { splitHorizon: true });
  expect(iteracoes.length).toBeLessThanOrEqual(5);
  expect(iteracoes.at(-1)!.changes).toHaveLength(0);
});

test("enlace caído: a rede do outro lado não é aprendida", () => {
  const iteracoes = runRip(topologia({ l12: true, l23: false }), {
    splitHorizon: true,
  });
  const final = iteracoes.at(-1)!;
  expect(final.tables.r1.some((r) => r.key === LAN3)).toBe(false);
  expect(final.tables.r2.some((r) => r.key === LAN3)).toBe(false);
});

test("split horizon impede o vizinho de reanunciar a rota de volta", () => {
  const comSplit = runRip(topologia(), { splitHorizon: true }).at(-1)!;

  for (const rota of comSplit.tables.r1) {
    if (rota.via === null) continue;
    const vizinho = comSplit.tables[rota.via];
    const naVizinha = vizinho.find((r) => r.key === rota.key);
    expect(naVizinha!.via).not.toBe("r1");
  }
});

test("a métrica nunca passa de 16 — o infinito do RIP", () => {
  const iteracoes = runRip(topologia(), { splitHorizon: false }, 30);
  for (const iteracao of iteracoes) {
    for (const tabela of Object.values(iteracao.tables)) {
      for (const rota of tabela) {
        expect(rota.metric).toBeLessThanOrEqual(RIP_INFINITY);
        expect(rota.metric).toBeGreaterThanOrEqual(0);
      }
    }
  }
});

test("redes conectadas mantêm métrica 0 e nunca são substituídas", () => {
  const final = runRip(topologia(), { splitHorizon: true }).at(-1)!;
  const conectada = final.tables.r1.find((r) => r.key === LAN1);
  expect(conectada!.metric).toBe(0);
  expect(conectada!.via).toBeNull();
});

function aposQuedaDe(
  linkId: "l12" | "l23",
  splitHorizon: boolean,
  mode: LinkFailureMode = "envenenar",
) {
  const antes = runRip(topologia(), { splitHorizon }, 30).at(-1)!;
  const evento = poisonRoutesOverLink(antes.tables, linkId, mode);
  const topoCaida = topologia(
    linkId === "l23" ? { l12: true, l23: false } : { l12: false, l23: true },
  );
  return {
    antes,
    evento,
    iteracoes: runRip(topoCaida, { splitHorizon }, 30, evento.tables),
  };
}

function serieDe(iteracoes: ReturnType<typeof runRip>, routerId: string, key: string) {
  return iteracoes.map(
    (it) => it.tables[routerId]?.find((r) => r.key === key)?.metric ?? null,
  );
}

test("envenenar marca com 16; expirar remove a rota da tabela", () => {
  const convergido = runRip(topologia(), { splitHorizon: true }, 30).at(-1)!;
  const antes = convergido.tables.r2.find((r) => r.key === LAN3)!;
  expect(antes.metric).toBe(1);
  expect(antes.linkId).toBe("l23");

  const envenenado = poisonRoutesOverLink(convergido.tables, "l23", "envenenar");
  expect(envenenado.tables.r2.find((r) => r.key === LAN3)!.metric).toBe(RIP_INFINITY);
  expect(envenenado.changes.some((c) => c.reason === "envenenada")).toBe(true);

  const expirado = poisonRoutesOverLink(convergido.tables, "l23", "expirar");
  expect(expirado.tables.r2.find((r) => r.key === LAN3)).toBeUndefined();

  for (const t of [envenenado.tables, expirado.tables]) {
    expect(t.r1.find((r) => r.key === LAN1)!.metric).toBe(0);
  }
});

test("sem split horizon e com rota expirada, a métrica sobe sem nunca voltar atrás", () => {
  const { iteracoes } = aposQuedaDe("l23", false, "expirar");
  const serie = serieDe(iteracoes, "r2", LAN3);

  const valores = serie.filter((m): m is number => m !== null);
  expect(valores.length).toBeGreaterThan(4);

  for (let i = 1; i < valores.length; i += 1) {
    expect(valores[i]).toBeGreaterThanOrEqual(valores[i - 1]!);
  }

  expect(valores.at(-1)).toBe(RIP_INFINITY);
  expect(Math.max(...valores)).toBe(RIP_INFINITY);
  expect(valores.some((m) => m > 1 && m < RIP_INFINITY)).toBe(true);
});

test("o mesmo vale para R1: nenhuma métrica oscila durante a contagem", () => {
  const { iteracoes } = aposQuedaDe("l23", false, "expirar");
  const serie = serieDe(iteracoes, "r1", LAN3).filter((m): m is number => m !== null);
  for (let i = 1; i < serie.length; i += 1) {
    expect(serie[i]).toBeGreaterThanOrEqual(serie[i - 1]!);
  }
});

test("com split horizon não há contagem ao infinito, mesmo com rota expirada", () => {
  const { iteracoes } = aposQuedaDe("l23", true, "expirar");
  const serie = serieDe(iteracoes, "r2", LAN3).filter((m): m is number => m !== null);

  expect(serie).toEqual([]);
  expect(iteracoes.at(-1)!.converged).toBe(true);

  const semSplit = aposQuedaDe("l23", false, "expirar").iteracoes;
  expect(iteracoes.length).toBeLessThan(semSplit.length);
});

test("envenenamento com atualização disparada converge rápido e sem contagem", () => {
  const { iteracoes } = aposQuedaDe("l23", false, "envenenar");
  const semEnvenenamento = aposQuedaDe("l23", false, "expirar").iteracoes;
  expect(iteracoes.length).toBeLessThan(semEnvenenamento.length);
  expect(iteracoes.at(-1)!.converged).toBe(true);
});

test("a queda a partir do estado convergido sempre termina", () => {
  for (const split of [true, false]) {
    for (const link of ["l12", "l23"] as const) {
      for (const mode of ["envenenar", "expirar"] as const) {
        const { iteracoes } = aposQuedaDe(link, split, mode);
        expect(iteracoes.at(-1)!.converged).toBe(true);
        for (const it of iteracoes) {
          for (const tabela of Object.values(it.tables)) {
            for (const rota of tabela) {
              expect(rota.metric).toBeLessThanOrEqual(RIP_INFINITY);
              expect(rota.metric).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    }
  }
});

test("a atualização disparada propaga o veneno em cascata, sem oscilar", () => {
  const { evento, iteracoes } = aposQuedaDe("l23", false, "envenenar");

  expect(evento.tables.r1.find((r) => r.key === LAN3)!.metric).toBe(RIP_INFINITY);
  expect(evento.tables.r2.find((r) => r.key === LAN3)!.metric).toBe(RIP_INFINITY);

  const serie = serieDe(iteracoes, "r2", LAN3).filter((m): m is number => m !== null);
  expect(serie.every((m) => m === RIP_INFINITY)).toBe(true);
  expect(iteracoes.at(-1)!.converged).toBe(true);
});
