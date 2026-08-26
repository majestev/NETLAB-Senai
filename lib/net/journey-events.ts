import {
  JOURNEY_SEGMENTS,
  getDevice,
  type JourneySegment,
  type PacketState,
} from "./journey";

export type JourneyEventKind =
  | "criado"
  | "encapsulado"
  | "transmitindo"
  | "recebido"
  | "consulta-cam"
  | "encaminhado"
  | "desencapsulado"
  | "ttl"
  | "consulta-rota"
  | "reencapsulado"
  | "entregue";

export type PacketField = keyof PacketState;

export interface JourneyEvent {
  id: string;
  index: number;
  kind: JourneyEventKind;

  deviceId: string;

  travel?: { fromDeviceId: string; toDeviceId: string; network: string };

  title: string;

  detail: string;

  packet: PacketState;

  changed: PacketField[];

  layer: 2 | 3 | 7;
}

export const SEM_L2 = "—";

export function diffPacket(antes: PacketState, depois: PacketState): PacketField[] {
  const campos: PacketField[] = [
    "sourceMac",
    "destinationMac",
    "sourceIp",
    "destinationIp",
    "ttl",
    "nextHop",
    "outgoingInterface",
  ];
  return campos.filter((c) => antes[c] !== depois[c]);
}

function porQue(segmento: JourneySegment, campo: string): string | undefined {
  return segmento.changes.find((c) => c.field === campo)?.why;
}

export function buildJourneyEvents(
  segmentos: JourneySegment[] = JOURNEY_SEGMENTS,
): JourneyEvent[] {
  const eventos: Omit<JourneyEvent, "index" | "id">[] = [];
  const primeiro = segmentos[0];
  if (!primeiro) return [];

  const origem = getDevice(primeiro.fromDeviceId);

  const recemCriado: PacketState = {
    ...primeiro.packet,
    sourceMac: SEM_L2,
    destinationMac: SEM_L2,
  };

  eventos.push({
    kind: "criado",
    deviceId: primeiro.fromDeviceId,
    title: "Pacote criado",
    detail: `${origem?.name ?? "A origem"} escreve o IP de origem e o de destino. Esses dois campos não vão mudar até o fim da viagem.`,
    packet: recemCriado,
    changed: ["sourceIp", "destinationIp", "ttl"],
    layer: 3,
  });

  eventos.push({
    kind: "encapsulado",
    deviceId: primeiro.fromDeviceId,
    title: "Quadro montado",
    detail:
      "O pacote é envolvido por um quadro Ethernet. O MAC de destino é o do gateway, não o do servidor: MAC só endereça dentro do segmento local.",
    packet: primeiro.packet,
    changed: diffPacket(recemCriado, primeiro.packet),
    layer: 2,
  });

  for (let i = 0; i < segmentos.length; i += 1) {
    const trecho = segmentos[i]!;
    const proximo = segmentos[i + 1];
    const destino = getDevice(trecho.toDeviceId);

    eventos.push({
      kind: "transmitindo",
      deviceId: trecho.fromDeviceId,
      travel: {
        fromDeviceId: trecho.fromDeviceId,
        toDeviceId: trecho.toDeviceId,
        network: trecho.network,
      },
      title: "Em trânsito",
      detail: `O quadro atravessa ${trecho.network}.`,
      packet: trecho.packet,
      changed: [],
      layer: 2,
    });

    eventos.push({
      kind: "recebido",
      deviceId: trecho.toDeviceId,
      title: "Quadro recebido",
      detail: `${destino?.name ?? "O equipamento"} recebe o quadro e vai decidir o que fazer com ele.`,
      packet: trecho.packet,
      changed: [],
      layer: 2,
    });

    if (!proximo) {
      eventos.push({
        kind: "entregue",
        deviceId: trecho.toDeviceId,
        title: "Pacote entregue",
        detail: `O ${destino?.name ?? "destino"} desencapsula o quadro e entrega o pacote à aplicação. O IP de origem ainda é o que ${origem?.name ?? "a origem"} escreveu.`,
        packet: trecho.packet,
        changed: [],
        layer: 7,
      });
      continue;
    }

    if (destino?.kind === "switch") {
      eventos.push({
        kind: "consulta-cam",
        deviceId: trecho.toDeviceId,
        title: "Consulta à tabela CAM",
        detail:
          "O switch procura o MAC de destino na tabela CAM para saber por qual porta enviar. Ele não olha o endereço IP.",
        packet: trecho.packet,
        changed: [],
        layer: 2,
      });
      eventos.push({
        kind: "encaminhado",
        deviceId: trecho.toDeviceId,
        title: "Encaminhado",
        detail:
          porQue(proximo, "Interface de saída") ??
          "O quadro sai pela porta onde o destino foi aprendido.",
        packet: proximo.packet,
        changed: diffPacket(trecho.packet, proximo.packet),
        layer: 2,
      });
      continue;
    }

    if (destino?.kind === "router") {
      const semL2: PacketState = {
        ...trecho.packet,
        sourceMac: SEM_L2,
        destinationMac: SEM_L2,
      };
      eventos.push({
        kind: "desencapsulado",
        deviceId: trecho.toDeviceId,
        title: "Quadro descartado",
        detail:
          "O roteador joga fora o cabeçalho de camada 2. Ele só existia para atravessar aquele enlace; daqui em diante sobra o pacote IP.",
        packet: semL2,
        changed: ["sourceMac", "destinationMac"],
        layer: 2,
      });

      const comTtl: PacketState = { ...semL2, ttl: proximo.packet.ttl };
      eventos.push({
        kind: "ttl",
        deviceId: trecho.toDeviceId,
        title: `TTL ${trecho.packet.ttl} para ${proximo.packet.ttl}`,
        detail:
          porQue(proximo, "TTL") ??
          "Todo roteador que encaminha um pacote decrementa o TTL em 1.",
        packet: comTtl,
        changed: ["ttl"],
        layer: 3,
      });

      const comRota: PacketState = {
        ...comTtl,
        nextHop: proximo.packet.nextHop,
        outgoingInterface: proximo.packet.outgoingInterface,
      };
      eventos.push({
        kind: "consulta-rota",
        deviceId: trecho.toDeviceId,
        title: "Consulta à tabela de roteamento",
        detail:
          porQue(proximo, "Próximo salto") ??
          "O roteador procura o prefixo mais longo que contém o IP de destino e obtém o próximo salto.",
        packet: comRota,
        changed: diffPacket(comTtl, comRota),
        layer: 3,
      });

      eventos.push({
        kind: "reencapsulado",
        deviceId: trecho.toDeviceId,
        title: "Novo quadro montado",
        detail:
          porQue(proximo, "MAC de origem") ??
          "O roteador monta um quadro novo com o MAC da própria interface de saída.",
        packet: proximo.packet,
        changed: diffPacket(comRota, proximo.packet),
        layer: 2,
      });
      continue;
    }

    eventos.push({
      kind: "encaminhado",
      deviceId: trecho.toDeviceId,
      title: "Encaminhado",
      detail: "O quadro segue para o próximo trecho.",
      packet: proximo.packet,
      changed: diffPacket(trecho.packet, proximo.packet),
      layer: 2,
    });
  }

  return eventos.map((e, index) => ({ ...e, index, id: `ev-${index}` }));
}

export const JOURNEY_EVENTS: JourneyEvent[] = buildJourneyEvents();

export const PACKET_FIELD_LABEL: Record<PacketField, string> = {
  sourceMac: "MAC de origem",
  destinationMac: "MAC de destino",
  sourceIp: "IP de origem",
  destinationIp: "IP de destino",
  ttl: "TTL",
  nextHop: "Próximo salto",
  outgoingInterface: "Interface de saída",
};

export const PACKET_FIELD_LAYER: Record<PacketField, 2 | 3> = {
  sourceMac: 2,
  destinationMac: 2,
  sourceIp: 3,
  destinationIp: 3,
  ttl: 3,
  nextHop: 3,
  outgoingInterface: 2,
};
