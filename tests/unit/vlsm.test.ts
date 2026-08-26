import { test, expect } from "@playwright/test";
import { formatIpv4, parseIpv4 } from "@/lib/net/ipv4";
import { allocateVlsm, validateManualAllocation, vlsmSteps } from "@/lib/net/vlsm";

const ip = (v: string) => {
  const r = parseIpv4(v);
  if (!r.ok) throw new Error(v);
  return r.value;
};

const BLOCO = { address: ip("192.168.10.0"), prefix: 24 as const };

test("aloca o cenário do laboratório sem sobreposição", () => {
  const result = allocateVlsm(BLOCO, [
    { id: "a", label: "LAN A", hosts: 60 },
    { id: "b", label: "LAN B", hosts: 28 },
    { id: "c", label: "LAN C", hosts: 12 },
    { id: "d", label: "LAN D", hosts: 10 },
    { id: "w1", label: "WAN 1", hosts: 2 },
    { id: "w2", label: "WAN 2", hosts: 2 },
  ]);

  expect(result.ok).toBe(true);
  expect(result.allocations).toHaveLength(6);

  const primeira = result.allocations[0];
  expect(primeira.requirement.label).toBe("LAN A");
  expect(formatIpv4(primeira.network)).toBe("192.168.10.0");
  expect(primeira.prefix).toBe(26);
  expect(formatIpv4(primeira.broadcast)).toBe("192.168.10.63");
  expect(primeira.usable).toBe(62);

  const segunda = result.allocations[1];
  expect(segunda.requirement.label).toBe("LAN B");
  expect(formatIpv4(segunda.network)).toBe("192.168.10.64");
  expect(segunda.prefix).toBe(27);

  const wans = result.allocations.filter((a) => a.requirement.label.startsWith("WAN"));
  expect(wans).toHaveLength(2);
  for (const wan of wans) {
    expect(wan.prefix).toBe(30);
    expect(wan.usable).toBe(2);
    expect(wan.waste).toBe(0);
  }

  const ordenadas = [...result.allocations].sort((a, b) => a.network - b.network);
  for (let i = 1; i < ordenadas.length; i += 1) {
    expect(ordenadas[i].network).toBeGreaterThan(ordenadas[i - 1].broadcast);
  }

  for (const a of result.allocations) {
    expect(a.network % 2 ** (32 - a.prefix)).toBe(0);
  }
});

test("falha explicitamente quando o bloco não comporta a demanda", () => {
  const result = allocateVlsm(BLOCO, [
    { id: "a", label: "LAN A", hosts: 200 },
    { id: "b", label: "LAN B", hosts: 200 },
  ]);
  expect(result.ok).toBe(false);
  expect(result.unallocated).toHaveLength(1);
  expect(result.error).toContain("não comporta");

  expect(result.allocations).toHaveLength(1);
});

test("rejeita demanda inválida em vez de calcular errado", () => {
  const result = allocateVlsm(BLOCO, [{ id: "x", label: "LAN X", hosts: 0 }]);
  expect(result.ok).toBe(false);
  expect(result.error).toContain("pelo menos 1 host");
});

test("é determinístico: mesma entrada, mesma saída", () => {
  const req = [
    { id: "a", label: "LAN A", hosts: 30 },
    { id: "b", label: "LAN B", hosts: 30 },
  ];
  const um = allocateVlsm(BLOCO, req);
  const dois = allocateVlsm(BLOCO, [...req].reverse());
  expect(um.allocations.map((a) => a.requirement.id)).toEqual(
    dois.allocations.map((a) => a.requirement.id),
  );
});

test.describe("validação de alocação manual", () => {
  test("acusa sobreposição", () => {
    const issues = validateManualAllocation(BLOCO, [
      { id: "a", label: "LAN A", requiredHosts: 60, network: ip("192.168.10.0"), prefix: 26 },
      { id: "b", label: "LAN B", requiredHosts: 28, network: ip("192.168.10.32"), prefix: 27 },
    ]);
    expect(issues.some((i) => i.kind === "sobreposicao")).toBe(true);
  });

  test("acusa endereço que não é de rede", () => {
    const issues = validateManualAllocation(BLOCO, [
      { id: "a", label: "LAN A", requiredHosts: 10, network: ip("192.168.10.5"), prefix: 28 },
    ]);
    expect(issues.some((i) => i.kind === "endereco-nao-e-de-rede")).toBe(true);
  });

  test("acusa bloco pequeno demais para a demanda", () => {
    const issues = validateManualAllocation(BLOCO, [
      { id: "a", label: "LAN A", requiredHosts: 60, network: ip("192.168.10.0"), prefix: 28 },
    ]);
    expect(issues.some((i) => i.kind === "hosts-insuficientes")).toBe(true);
  });

  test("acusa sub-rede fora do bloco", () => {
    const issues = validateManualAllocation(BLOCO, [
      { id: "a", label: "LAN A", requiredHosts: 10, network: ip("192.168.11.0"), prefix: 28 },
    ]);
    expect(issues.some((i) => i.kind === "fora-do-bloco")).toBe(true);
  });

  test("alocação correta não gera nenhum problema", () => {
    const issues = validateManualAllocation(BLOCO, [
      { id: "a", label: "LAN A", requiredHosts: 60, network: ip("192.168.10.0"), prefix: 26 },
      { id: "b", label: "LAN B", requiredHosts: 28, network: ip("192.168.10.64"), prefix: 27 },
      { id: "w", label: "WAN 1", requiredHosts: 2, network: ip("192.168.10.96"), prefix: 30 },
    ]);
    expect(issues).toEqual([]);
  });
});

const REQUISITOS = [
  { id: "a", label: "LAN A", hosts: 60 },
  { id: "b", label: "LAN B", hosts: 28 },
  { id: "c", label: "LAN C", hosts: 12 },
  { id: "d", label: "LAN D", hosts: 10 },
  { id: "w1", label: "WAN 1", hosts: 2 },
  { id: "w2", label: "WAN 2", hosts: 2 },
];

test("os passos terminam exatamente no resultado da alocação", () => {
  const { steps, result } = vlsmSteps(BLOCO, REQUISITOS);

  expect(steps).toHaveLength(result.allocations.length + 1);
  expect(steps.at(-1)!.allocated).toEqual(result.allocations);
  expect(steps.at(-1)!.remainingAddresses).toBe(result.remainingAddresses);
  expect(steps.at(-1)!.nextFreeAddress).toBe(result.nextFreeAddress);
});

test("o primeiro passo é o bloco íntegro", () => {
  const { steps } = vlsmSteps(BLOCO, REQUISITOS);

  expect(steps[0]!.allocation).toBeNull();
  expect(steps[0]!.allocated).toEqual([]);
  expect(steps[0]!.remainingAddresses).toBe(256);
});

test("o espaço livre só encolhe, e nunca fica negativo", () => {
  const { steps } = vlsmSteps(BLOCO, REQUISITOS);

  for (let i = 1; i < steps.length; i += 1) {
    expect(steps[i]!.remainingAddresses).toBeLessThan(
      steps[i - 1]!.remainingAddresses,
    );
    expect(steps[i]!.remainingAddresses).toBeGreaterThanOrEqual(0);
  }
});

test("cada corte começa onde o anterior terminou, sem buraco", () => {
  const { steps } = vlsmSteps(BLOCO, REQUISITOS);

  for (let i = 1; i < steps.length; i += 1) {
    const anterior = steps[i - 1]!;
    const atual = steps[i]!;
    expect(atual.allocation!.network, atual.title).toBe(
      anterior.nextFreeAddress,
    );
  }
});

test("os passos saem na ordem decrescente de demanda", () => {
  const { steps } = vlsmSteps(BLOCO, REQUISITOS);
  const pedidos = steps.slice(1).map((s) => s.allocation!.requirement.hosts);
  expect([...pedidos].sort((a, b) => b - a)).toEqual(pedidos);
});
