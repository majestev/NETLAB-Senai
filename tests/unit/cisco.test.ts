import { test, expect } from "@playwright/test";
import { checkStaticRoute, parseStaticRoute } from "@/lib/net/cisco";
import { formatIpv4 } from "@/lib/net/ipv4";

const ESPERADA = {
  destination: "192.168.3.0/24",
  nextHop: "10.0.12.2",
  exitInterfaces: ["Gi0/0", "GigabitEthernet0/0"],
};

test("lê a forma canônica com próximo salto", () => {
  const r = parseStaticRoute("ip route 192.168.3.0 255.255.255.0 10.0.12.2");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(formatIpv4(r.value.network)).toBe("192.168.3.0");
  expect(r.value.prefix).toBe(24);
  expect(formatIpv4(r.value.nextHop!)).toBe("10.0.12.2");
  expect(r.value.exitInterface).toBeNull();
});

test("lê a forma com interface de saída", () => {
  const r = parseStaticRoute("ip route 192.168.3.0 255.255.255.0 Gi0/0");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.value.exitInterface).toBe("Gi0/0");
  expect(r.value.nextHop).toBeNull();
});

test("lê a forma com interface e próximo salto juntos", () => {
  const r = parseStaticRoute("ip route 192.168.3.0 255.255.255.0 Gi0/0 10.0.12.2");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.value.exitInterface).toBe("Gi0/0");
  expect(formatIpv4(r.value.nextHop!)).toBe("10.0.12.2");
});

test("lê a distância administrativa opcional", () => {
  const r = parseStaticRoute("ip route 192.168.3.0 255.255.255.0 10.0.12.2 250");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.value.distance).toBe(250);
});

test("é indiferente a caixa, espaços extras e nomes longos de interface", () => {
  for (const cmd of [
    "IP ROUTE 192.168.3.0 255.255.255.0 10.0.12.2",
    "  ip   route   192.168.3.0   255.255.255.0   10.0.12.2  ",
    "ip route 192.168.3.0 255.255.255.0 GigabitEthernet0/0",
  ]) {
    expect(parseStaticRoute(cmd).ok, cmd).toBe(true);
  }
});

test("normaliza para o endereço de rede quando o estudante informa um host", () => {
  const r = parseStaticRoute("ip route 192.168.3.77 255.255.255.0 10.0.12.2");
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(formatIpv4(r.value.network)).toBe("192.168.3.0");
});

test("recusa entrada inválida com mensagem que diz o que fazer", () => {
  const casos: Array<[string, RegExp]> = [
    ["", /começando por ip route/i],
    ["show ip route", /começa com ip route/i],
    ["ip route 192.168.3.0", /faltam argumentos/i],
    ["ip route 192.168.3.0/24 10.0.12.2", /decimal pontuada/i],
    ["ip route 999.1.1.1 255.255.255.0 10.0.12.2", /rede de destino/i],
    ["ip route 192.168.3.0 255.255.0.255 10.0.12.2", /máscara/i],
    ["ip route 192.168.3.0 255.255.255.0", /faltam argumentos/i],
    ["ip route 192.168.3.0 255.255.255.0 banana!", /não reconheço/i],
  ];
  for (const [cmd, esperado] of casos) {
    const r = parseStaticRoute(cmd);
    expect(r.ok, cmd).toBe(false);
    if (!r.ok) expect(r.error, cmd).toMatch(esperado);
  }
});

test("nunca devolve NaN silencioso: toda recusa tem texto", () => {
  for (const cmd of ["ip route  ", "ip route a b c", "ip route 1 2 3"]) {
    const r = parseStaticRoute(cmd);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(10);
  }
});

test("aceita o próximo salto — a forma preferida", () => {
  const v = checkStaticRoute("ip route 192.168.3.0 255.255.255.0 10.0.12.2", ESPERADA);
  expect(v.correct).toBe(true);
  expect(v.nuance).toBeUndefined();
});

test("aceita a interface de saída e explica a nuance em vez de reprovar", () => {
  const v = checkStaticRoute("ip route 192.168.3.0 255.255.255.0 Gi0/0", ESPERADA);
  expect(v.correct).toBe(true);
  expect(v.nuance).toMatch(/ponto a ponto/i);
  expect(v.nuance).toMatch(/10\.0\.12\.2/);
});

test("aceita interface e próximo salto juntos", () => {
  const v = checkStaticRoute(
    "ip route 192.168.3.0 255.255.255.0 Gi0/0 10.0.12.2",
    ESPERADA,
  );
  expect(v.correct).toBe(true);
  expect(v.nuance).toMatch(/explícita/i);
});

test("recusa destino errado dizendo qual era o certo", () => {
  const v = checkStaticRoute("ip route 192.168.1.0 255.255.255.0 10.0.12.2", ESPERADA);
  expect(v.correct).toBe(false);
  expect(v.message).toMatch(/192\.168\.3\.0\/24/);
});

test("recusa máscara errada apontando a máscara certa", () => {
  const v = checkStaticRoute("ip route 192.168.3.0 255.255.0.0 10.0.12.2", ESPERADA);
  expect(v.correct).toBe(false);
  expect(v.message).toMatch(/255\.255\.255\.0/);
});

test("recusa próximo salto errado", () => {
  const v = checkStaticRoute("ip route 192.168.3.0 255.255.255.0 10.0.12.9", ESPERADA);
  expect(v.correct).toBe(false);
  expect(v.message).toMatch(/10\.0\.12\.2/);
});

test("recusa interface que não é a do enlace", () => {
  const v = checkStaticRoute("ip route 192.168.3.0 255.255.255.0 Gi0/1", ESPERADA);
  expect(v.correct).toBe(false);
  expect(v.message).toMatch(/Gi0\/1/);
  expect(v.message).toMatch(/Gi0\/0/);
});

test("sem interfaces aceitas declaradas, só o próximo salto passa", () => {
  const semInterface = { destination: "192.168.3.0/24", nextHop: "10.0.12.2" };
  expect(
    checkStaticRoute("ip route 192.168.3.0 255.255.255.0 10.0.12.2", semInterface)
      .correct,
  ).toBe(true);
  expect(
    checkStaticRoute("ip route 192.168.3.0 255.255.255.0 Gi0/0", semInterface).correct,
  ).toBe(false);
});
