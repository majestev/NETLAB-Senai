import { test, expect } from "@playwright/test";
import { parseIpv4 } from "@/lib/net/ipv4";
import { decideRoute, type RouteEntry } from "@/lib/net/routing";

const ip = (v: string) => {
  const r = parseIpv4(v);
  if (!r.ok) throw new Error(v);
  return r.value;
};

const rota = (
  id: string,
  network: string,
  prefix: number,
  extra: Partial<RouteEntry> = {},
): RouteEntry => ({
  id,
  network: ip(network),
  prefix,
  source: "estática",
  ad: 1,
  metric: 0,
  nextHop: ip("10.0.0.2"),
  iface: "Gi0/0",
  ...extra,
});

test("prefixo mais longo vence, mesmo com pior distância administrativa", () => {
  const tabela = [
    rota("a", "10.0.0.0", 8, { ad: 1 }),
    rota("b", "10.1.1.0", 24, { ad: 120, source: "RIP", metric: 3 }),
  ];
  const decisao = decideRoute(ip("10.1.1.5"), tabela);
  expect(decisao.chosen).toHaveLength(1);
  expect(decisao.chosen[0].id).toBe("b");
  expect(decisao.steps[1].kind).toBe("prefixo-mais-longo");
});

test("com o mesmo prefixo, vence a menor distância administrativa", () => {
  const tabela = [
    rota("estatica", "192.168.1.0", 24, { ad: 1 }),
    rota("rip", "192.168.1.0", 24, { ad: 120, source: "RIP", metric: 1 }),
  ];
  const decisao = decideRoute(ip("192.168.1.10"), tabela);
  expect(decisao.chosen[0].id).toBe("estatica");
  expect(decisao.steps.some((s) => s.kind === "distancia-administrativa")).toBe(true);
});

test("mesma AD: desempata pela métrica", () => {
  const tabela = [
    rota("m5", "172.16.0.0", 16, { ad: 120, source: "RIP", metric: 5 }),
    rota("m2", "172.16.0.0", 16, { ad: 120, source: "RIP", metric: 2 }),
  ];
  const decisao = decideRoute(ip("172.16.5.5"), tabela);
  expect(decisao.chosen[0].id).toBe("m2");
});

test("empate total instala ECMP", () => {
  const tabela = [
    rota("p1", "10.2.0.0", 16, { ad: 110, source: "OSPF", metric: 20, iface: "Gi0/0" }),
    rota("p2", "10.2.0.0", 16, { ad: 110, source: "OSPF", metric: 20, iface: "Gi0/1" }),
  ];
  const decisao = decideRoute(ip("10.2.3.4"), tabela);
  expect(decisao.chosen).toHaveLength(2);
  expect(decisao.steps.at(-1)?.kind).toBe("ecmp");
});

test("rota padrão só é usada quando nada mais casa", () => {
  const tabela = [
    rota("default", "0.0.0.0", 0, { source: "padrão" }),
    rota("lan", "192.168.1.0", 24),
  ];
  expect(decideRoute(ip("192.168.1.9"), tabela).chosen[0].id).toBe("lan");
  expect(decideRoute(ip("8.8.8.8"), tabela).chosen[0].id).toBe("default");
});

test("sem rota, o pacote é descartado — e o passo diz isso", () => {
  const decisao = decideRoute(ip("8.8.8.8"), [rota("lan", "192.168.1.0", 24)]);
  expect(decisao.dropped).toBe(true);
  expect(decisao.chosen).toHaveLength(0);
  expect(decisao.steps.at(-1)?.kind).toBe("sem-rota");
});

test("rota conectada tem AD 0 e vence a estática de mesmo prefixo", () => {
  const tabela = [
    rota("con", "192.168.5.0", 24, { ad: 0, source: "conectada", nextHop: null }),
    rota("est", "192.168.5.0", 24, { ad: 1 }),
  ];
  expect(decideRoute(ip("192.168.5.50"), tabela).chosen[0].id).toBe("con");
});

test("a tabela vazia não quebra", () => {
  const decisao = decideRoute(ip("1.1.1.1"), []);
  expect(decisao.dropped).toBe(true);
});
