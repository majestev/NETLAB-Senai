import { test, expect } from "@playwright/test";
import { addressBits, analyzePrefixMatch, prefixReach } from "@/lib/net/prefix-match";
import { DEMO_ROUTES } from "@/lib/net/routing-demo";
import { decideRoute } from "@/lib/net/routing";
import { parseIpv4 } from "@/lib/net/ipv4";

const ip = (v: string) => {
  const r = parseIpv4(v);
  if (!r.ok) throw new Error(v);
  return r.value;
};

test("os 32 bits saem do mais significativo para o menos", () => {
  expect(addressBits(ip("255.0.0.0")).join("")).toBe(
    "1".repeat(8) + "0".repeat(24),
  );
  expect(addressBits(ip("0.0.0.1")).join("")).toBe("0".repeat(31) + "1");
  expect(addressBits(ip("192.168.1.1")).slice(0, 8).join("")).toBe("11000000");
});

test("as rotas saem da mais específica para a menos específica", () => {
  const a = analyzePrefixMatch(ip("10.1.1.5"), DEMO_ROUTES);
  const prefixos = a.rows.map((r) => r.prefix);
  expect([...prefixos].sort((x, y) => y - x)).toEqual(prefixos);
});

test("o prefixo mais longo é o mesmo que a decisão de encaminhamento usa", () => {
  for (const destino of [
    "10.1.1.5",
    "10.1.9.9",
    "172.16.4.9",
    "192.168.1.20",
    "8.8.8.8",
    "10.255.255.255",
  ]) {
    const alvo = ip(destino);
    const bits = analyzePrefixMatch(alvo, DEMO_ROUTES);
    const decisao = decideRoute(alvo, DEMO_ROUTES);

    expect(bits.matching.map((r) => r.routeId).sort(), destino).toEqual(
      decisao.steps[0]!.survivorIds.slice().sort(),
    );

    if (decisao.dropped) {
      expect(bits.longestPrefix, destino).toBeNull();
      continue;
    }
    const prefixoEscolhido = Math.max(...decisao.chosen.map((r) => r.prefix));
    expect(bits.longestPrefix, destino).toBe(prefixoEscolhido);
  }
});

test("a rota que casa não tem divergência dentro da máscara", () => {
  const a = analyzePrefixMatch(ip("10.1.1.5"), DEMO_ROUTES);
  for (const linha of a.matching) {
    expect(linha.firstMismatch, linha.label).toBeNull();
    for (const celula of linha.bits.slice(0, linha.prefix)) {
      expect(celula.inPrefix).toBe(true);
      expect(celula.matches).toBe(true);
      expect(celula.bit).toBe(celula.destinationBit);
    }
  }
});

test("a rota eliminada aponta o primeiro bit divergente, e ele está dentro da máscara", () => {
  const a = analyzePrefixMatch(ip("8.8.8.8"), DEMO_ROUTES);
  const eliminadas = a.rows.filter((r) => !r.matches);
  expect(eliminadas.length).toBeGreaterThan(0);

  for (const linha of eliminadas) {
    expect(linha.firstMismatch, linha.label).not.toBeNull();
    const pos = linha.firstMismatch!;
    expect(pos, linha.label).toBeLessThan(linha.prefix);

    for (const c of linha.bits.slice(0, pos)) expect(c.matches).toBe(true);
    expect(linha.bits[pos]!.bit).not.toBe(linha.bits[pos]!.destinationBit);
  }
});

test("a rota padrão examina zero bits e casa com qualquer destino", () => {
  for (const destino of ["8.8.8.8", "10.1.1.5", "255.255.255.255", "0.0.0.0"]) {
    const a = analyzePrefixMatch(ip(destino), DEMO_ROUTES);
    const padrao = a.rows.find((r) => r.prefix === 0)!;
    expect(padrao.matches, destino).toBe(true);
    expect(padrao.firstMismatch).toBeNull();

    expect(padrao.bits.every((c) => !c.inPrefix)).toBe(true);
  }
});

test("empate de prefixo é declarado como empate, não resolvido nos bits", () => {
  const a = analyzePrefixMatch(ip("172.16.4.9"), DEMO_ROUTES);
  expect(a.winners.length).toBe(2);
  expect(a.decidedByBits).toBe(false);
});

test("destino sem nenhuma rota deixa a análise sem vencedor", () => {
  const soUmaLan = DEMO_ROUTES.filter((r) => r.prefix === 24 && r.id === "r8");
  const a = analyzePrefixMatch(ip("8.8.8.8"), soUmaLan);
  expect(a.matching).toEqual([]);
  expect(a.longestPrefix).toBeNull();
  expect(a.winners).toEqual([]);
  expect(a.decidedByBits).toBe(false);
});

test("o alcance do prefixo é o número de endereços que ele cobre", () => {
  expect(prefixReach(0)).toBe(4294967296);
  expect(prefixReach(8)).toBe(16777216);
  expect(prefixReach(24)).toBe(256);
  expect(prefixReach(30)).toBe(4);
  expect(prefixReach(32)).toBe(1);
});
