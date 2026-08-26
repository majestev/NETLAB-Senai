import { test, expect } from "@playwright/test";
import {
  CHANNELS_24,
  CHANNEL_WIDTH_MHZ,
  NON_OVERLAPPING_24,
  buildAssociation,
  channelCenter,
  channelOverlap,
  channelSpan,
  securityProfile,
  signalQuality,
  type WirelessSecurity,
} from "@/lib/net/wireless";

const BASE = { correctPassword: true, broadcastSsid: true, ssid: "NETLAB-LAB" };

test("descoberta, autenticação e associação acontecem nessa ordem", () => {
  for (const security of ["aberta", "wep", "wpa2", "wpa3"] as WirelessSecurity[]) {
    const passos = buildAssociation({ ...BASE, security });
    const fases = passos.map((p) => p.phase);
    const primeiro = (f: (typeof fases)[number]) => fases.indexOf(f);
    expect(primeiro("descoberta"), security).toBeLessThan(primeiro("autenticacao"));
    expect(primeiro("autenticacao"), security).toBeLessThan(primeiro("associacao"));
  }
});

test("a cifragem só existe depois da associação, nunca antes", () => {
  const passos = buildAssociation({ ...BASE, security: "wpa2" });
  const primeiroCifrado = passos.findIndex((p) => p.encrypted);
  const associacao = passos.findIndex((p) => p.phase === "associacao");
  expect(primeiroCifrado).toBeGreaterThan(associacao);

  for (const p of passos.slice(0, primeiroCifrado)) {
    expect(p.encrypted, p.id).toBe(false);
  }
});

test("a rede aberta conecta e não cifra nada", () => {
  const passos = buildAssociation({ ...BASE, security: "aberta" });
  expect(passos.at(-1)!.phase).toBe("conectado");
  expect(passos.some((p) => p.encrypted)).toBe(false);
  expect(passos.some((p) => p.phase === "cifragem")).toBe(false);
});

test("a senha errada falha na troca de chaves — depois de autenticar e associar", () => {
  for (const security of ["wep", "wpa2", "wpa3"] as WirelessSecurity[]) {
    const passos = buildAssociation({ ...BASE, security, correctPassword: false });
    const ultimo = passos.at(-1)!;
    expect(ultimo.phase, security).toBe("recusado");
    expect(ultimo.failed, security).toBe(true);

    expect(passos.some((p) => p.phase === "autenticacao"), security).toBe(true);
    expect(passos.some((p) => p.phase === "associacao"), security).toBe(true);
    expect(passos.some((p) => p.encrypted), security).toBe(false);
  }
});

test("a senha errada não altera a rede aberta, que não tem senha", () => {
  const comSenha = buildAssociation({ ...BASE, security: "aberta" });
  const semSenha = buildAssociation({
    ...BASE,
    security: "aberta",
    correctPassword: false,
  });
  expect(semSenha).toEqual(comSenha);
});

test("SSID oculto muda o texto, não a sequência de quadros", () => {
  const visivel = buildAssociation({ ...BASE, security: "wpa2" });
  const oculto = buildAssociation({
    ...BASE,
    security: "wpa2",
    broadcastSsid: false,
  });
  expect(oculto.map((p) => p.phase)).toEqual(visivel.map((p) => p.phase));
  expect(oculto.length).toBe(visivel.length);

  expect(oculto.find((p) => p.id === "probe-req")!.narrative).toContain(
    "NETLAB-LAB",
  );
});

test("todo perfil declara cifra quando declara aperto de mão", () => {
  for (const id of ["aberta", "wep", "wpa2", "wpa3"] as WirelessSecurity[]) {
    const p = securityProfile(id);
    expect(p.handshake === null, id).toBe(p.cipher === null);
  }
});

test("os índices acompanham a posição real", () => {
  const passos = buildAssociation({ ...BASE, security: "wpa3" });
  passos.forEach((p, i) => expect(p.index).toBe(i));
});

test("a qualidade do sinal nunca melhora quando o RSSI piora", () => {
  let anterior = 5;
  for (let rssi = -40; rssi >= -95; rssi -= 1) {
    const q = signalQuality(rssi);
    expect(q.bars, `${rssi} dBm`).toBeLessThanOrEqual(anterior);
    expect(q.bars).toBeGreaterThanOrEqual(1);
    anterior = q.bars;
  }
});

test("os limiares declarados são os aplicados", () => {
  expect(signalQuality(-60).bars).toBe(4);
  expect(signalQuality(-61).bars).toBe(3);
  expect(signalQuality(-70).bars).toBe(3);
  expect(signalQuality(-71).bars).toBe(2);
  expect(signalQuality(-80).bars).toBe(2);
  expect(signalQuality(-81).bars).toBe(1);
});

test("o centro do canal segue a fórmula do padrão", () => {
  expect(channelCenter(1)).toBe(2412);
  expect(channelCenter(6)).toBe(2437);
  expect(channelCenter(11)).toBe(2462);
});

test("1, 6 e 11 é o único trio de canais que não se sobrepõem", () => {
  for (let i = 0; i < NON_OVERLAPPING_24.length; i += 1) {
    for (let j = i + 1; j < NON_OVERLAPPING_24.length; j += 1) {
      expect(
        channelOverlap(NON_OVERLAPPING_24[i]!, NON_OVERLAPPING_24[j]!),
        `${NON_OVERLAPPING_24[i]} e ${NON_OVERLAPPING_24[j]}`,
      ).toBe(0);
    }
  }

  const trios: number[][] = [];
  for (const a of CHANNELS_24)
    for (const b of CHANNELS_24)
      for (const c of CHANNELS_24) {
        if (!(a < b && b < c)) continue;
        if (
          channelOverlap(a, b) === 0 &&
          channelOverlap(b, c) === 0 &&
          channelOverlap(a, c) === 0
        ) {
          trios.push([a, b, c]);
        }
      }
  expect(trios).toEqual([[...NON_OVERLAPPING_24]]);
});

test("canais adjacentes se sobrepõem, e quanto mais perto, mais", () => {
  expect(channelOverlap(1, 1)).toBe(CHANNEL_WIDTH_MHZ);
  expect(channelOverlap(1, 2)).toBe(17);
  expect(channelOverlap(1, 5)).toBe(2);
  expect(channelOverlap(1, 6)).toBe(0);
  for (let d = 1; d < 5; d += 1) {
    expect(channelOverlap(1, 1 + d)).toBeGreaterThan(channelOverlap(1, 2 + d));
  }
});

test("a faixa do canal tem a largura declarada e é simétrica ao centro", () => {
  for (const c of CHANNELS_24) {
    const s = channelSpan(c);
    expect(s.end - s.start, `canal ${c}`).toBe(CHANNEL_WIDTH_MHZ);
    expect(s.center - s.start).toBe(s.end - s.center);
  }
});
