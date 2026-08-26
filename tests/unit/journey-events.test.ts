import { test, expect } from "@playwright/test";
import { JOURNEY_SEGMENTS, getDevice } from "@/lib/net/journey";
import {
  JOURNEY_EVENTS,
  buildJourneyEvents,
  diffPacket,
  PACKET_FIELD_LABEL,
} from "@/lib/net/journey-events";

test("a linha do tempo começa criando o pacote e termina entregando", () => {
  expect(JOURNEY_EVENTS.length).toBeGreaterThan(15);
  expect(JOURNEY_EVENTS[0]!.kind).toBe("criado");
  expect(JOURNEY_EVENTS.at(-1)!.kind).toBe("entregue");
});

test("os índices são contínuos e os ids únicos", () => {
  JOURNEY_EVENTS.forEach((e, i) => expect(e.index).toBe(i));
  expect(new Set(JOURNEY_EVENTS.map((e) => e.id)).size).toBe(JOURNEY_EVENTS.length);
});

test("todo evento acontece num equipamento que existe", () => {
  for (const e of JOURNEY_EVENTS) {
    expect(getDevice(e.deviceId), `equipamento ${e.deviceId}`).toBeDefined();
    if (e.travel) {
      expect(getDevice(e.travel.fromDeviceId)).toBeDefined();
      expect(getDevice(e.travel.toDeviceId)).toBeDefined();
    }
  }
});

test("existe um evento de trânsito para cada trecho, na ordem", () => {
  const transitos = JOURNEY_EVENTS.filter((e) => e.kind === "transmitindo");
  expect(transitos).toHaveLength(JOURNEY_SEGMENTS.length);
  transitos.forEach((e, i) => {
    expect(e.travel!.fromDeviceId).toBe(JOURNEY_SEGMENTS[i]!.fromDeviceId);
    expect(e.travel!.toDeviceId).toBe(JOURNEY_SEGMENTS[i]!.toDeviceId);
  });
});

test("o IP de origem e o de destino nunca mudam em nenhum evento", () => {
  const ipsOrigem = new Set(JOURNEY_EVENTS.map((e) => e.packet.sourceIp));
  const ipsDestino = new Set(JOURNEY_EVENTS.map((e) => e.packet.destinationIp));
  expect(ipsOrigem.size, [...ipsOrigem].join(", ")).toBe(1);
  expect(ipsDestino.size, [...ipsDestino].join(", ")).toBe(1);

  for (const e of JOURNEY_EVENTS) {
    if (e.kind === "criado") continue; // o pacote nasce com eles
    expect(e.changed, `${e.kind} diz ter mudado o IP`).not.toContain("sourceIp");
    expect(e.changed, `${e.kind} diz ter mudado o IP`).not.toContain("destinationIp");
  }
});

test("cada roteador do caminho decrementa o TTL exatamente uma vez", () => {
  const decrementos = JOURNEY_EVENTS.filter((e) => e.kind === "ttl");
  const roteadores = new Set(
    JOURNEY_SEGMENTS.map((s) => getDevice(s.toDeviceId))
      .filter((d) => d?.kind === "router")
      .map((d) => d!.id),
  );
  expect(decrementos).toHaveLength(roteadores.size);

  for (const d of decrementos) {
    const anterior = JOURNEY_EVENTS[d.index - 1]!;
    expect(d.packet.ttl).toBe(anterior.packet.ttl - 1);
    expect(d.changed).toEqual(["ttl"]);
  }
});

test("o TTL só cai, nunca sobe", () => {
  const serie = JOURNEY_EVENTS.map((e) => e.packet.ttl);
  for (let i = 1; i < serie.length; i += 1) {
    expect(serie[i]!, `subiu no evento ${i}`).toBeLessThanOrEqual(serie[i - 1]!);
  }
});

test("todo roteador descarta o quadro, decrementa, consulta e remonta", () => {
  const sequenciaEsperada = [
    "desencapsulado",
    "ttl",
    "consulta-rota",
    "reencapsulado",
  ];
  const roteadores = [
    ...new Set(
      JOURNEY_EVENTS.filter((e) => e.kind === "ttl").map((e) => e.deviceId),
    ),
  ];
  expect(roteadores.length).toBeGreaterThan(0);

  for (const id of roteadores) {
    const kinds = JOURNEY_EVENTS.filter(
      (e) => e.deviceId === id && sequenciaEsperada.includes(e.kind),
    ).map((e) => e.kind);
    expect(kinds, `roteador ${id}`).toEqual(sequenciaEsperada);
  }
});

test("o switch consulta a CAM e encaminha, sem tocar no TTL", () => {
  const switches = JOURNEY_SEGMENTS.map((s) => getDevice(s.toDeviceId)).filter(
    (d) => d?.kind === "switch",
  );
  for (const sw of switches) {
    const eventos = JOURNEY_EVENTS.filter((e) => e.deviceId === sw!.id);
    expect(eventos.map((e) => e.kind)).toContain("consulta-cam");
    expect(eventos.some((e) => e.kind === "ttl"), "switch decrementou TTL").toBe(false);
  }
});

test("o MAC é reescrito em todo roteador e nunca por um switch", () => {
  const remontagens = JOURNEY_EVENTS.filter((e) => e.kind === "reencapsulado");
  expect(remontagens.length).toBeGreaterThan(0);
  for (const r of remontagens) {
    expect(getDevice(r.deviceId)!.kind).toBe("router");
    expect(r.changed).toContain("sourceMac");
    expect(r.changed).toContain("destinationMac");
  }
});

test("o campo `changed` bate com a diferença real entre eventos vizinhos", () => {
  for (let i = 1; i < JOURNEY_EVENTS.length; i += 1) {
    const anterior = JOURNEY_EVENTS[i - 1]!;
    const atual = JOURNEY_EVENTS[i]!;
    const real = diffPacket(anterior.packet, atual.packet);
    expect(
      [...atual.changed].sort(),
      `evento ${i} (${atual.kind}) declara ${atual.changed} mas mudou ${real}`,
    ).toEqual([...real].sort());
  }
});

test("todo evento tem título curto e uma frase de explicação", () => {
  for (const e of JOURNEY_EVENTS) {
    expect(e.title.length, e.title).toBeGreaterThan(3);
    expect(e.title.length, `título longo demais: ${e.title}`).toBeLessThan(40);
    expect(e.detail.length, `${e.kind} sem explicação`).toBeGreaterThan(20);

    expect(e.detail.length, `explicação longa demais em ${e.kind}`).toBeLessThan(240);
  }
});

test("todo campo do pacote tem rótulo legível", () => {
  for (const campo of Object.keys(JOURNEY_EVENTS[0]!.packet)) {
    expect(
      PACKET_FIELD_LABEL[campo as keyof typeof PACKET_FIELD_LABEL],
      `sem rótulo: ${campo}`,
    ).toBeTruthy();
  }
});

test("a construção é determinística", () => {
  expect(JSON.stringify(buildJourneyEvents())).toBe(
    JSON.stringify(buildJourneyEvents()),
  );
});

test("uma jornada vazia não quebra", () => {
  expect(buildJourneyEvents([])).toEqual([]);
});
