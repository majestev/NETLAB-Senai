export type DeviceKind = "host" | "switch" | "router" | "server";

export interface JourneyDevice {
  id: string;
  name: string;
  kind: DeviceKind;

  layer: 1 | 2 | 3;
  role: string;
  interfaces: Array<{
    name: string;
    ip?: string;
    mac: string;
    note?: string;
  }>;

  behavior: string;
}

export interface PacketState {
  sourceMac: string;
  destinationMac: string;

  sourceIp: string;
  destinationIp: string;
  ttl: number;

  nextHop: string;
  outgoingInterface: string;
}

export interface JourneySegment {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;

  network: string;
  label: string;
  packet: PacketState;

  changes: Array<{
    field: "MAC de origem" | "MAC de destino" | "TTL" | "Próximo salto" | "Interface de saída";
    from: string;
    to: string;
    why: string;
  }>;
  unchanged: string;
}

const MAC = {
  pc: "00:1a:2b:00:00:11",
  r1Lan: "00:1a:2b:00:00:a1",
  r1Wan: "00:1a:2b:00:00:a2",
  r2Wan: "00:1a:2b:00:00:b1",
  r2Lan: "00:1a:2b:00:00:b2",
  server: "00:1a:2b:00:00:5a",
} as const;

const IP = {
  pc: "192.168.1.10",
  r1Lan: "192.168.1.1",
  r1Wan: "10.0.12.1",
  r2Wan: "10.0.12.2",
  r2Lan: "203.0.113.1",
  server: "203.0.113.50",
} as const;

export const JOURNEY_DEVICES: JourneyDevice[] = [
  {
    id: "pc",
    name: "PC1",
    kind: "host",
    layer: 3,
    role: "Host de origem",
    interfaces: [
      { name: "Ethernet", ip: `${IP.pc}/24`, mac: MAC.pc, note: `gateway padrão ${IP.r1Lan}` },
    ],
    behavior:
      "O destino está em outra rede, então o PC endereça o quadro ao MAC do gateway padrão — mas mantém o IP de destino do servidor. É a distinção entre entrega local e entrega fim a fim.",
  },
  {
    id: "sw",
    name: "SW1",
    kind: "switch",
    layer: 2,
    role: "Comutador de acesso",
    interfaces: [
      { name: "Fa0/1", mac: "—", note: "porta de acesso, VLAN 1" },
      { name: "Fa0/24", mac: "—", note: "porta de acesso para R1" },
    ],
    behavior:
      "Consulta a tabela CAM e encaminha o quadro pela porta onde o MAC de destino foi aprendido. Não altera nenhum campo: o switch não decrementa TTL nem reescreve endereços.",
  },
  {
    id: "r1",
    name: "R1",
    kind: "router",
    layer: 3,
    role: "Roteador de borda da LAN",
    interfaces: [
      { name: "Gi0/1", ip: `${IP.r1Lan}/24`, mac: MAC.r1Lan },
      { name: "Gi0/0", ip: `${IP.r1Wan}/30`, mac: MAC.r1Wan },
    ],
    behavior:
      "Consulta a tabela de roteamento, escolhe a rota de prefixo mais longo, decrementa o TTL e monta um quadro novo com o MAC do próximo salto. O pacote IP segue intacto.",
  },
  {
    id: "r2",
    name: "R2",
    kind: "router",
    layer: 3,
    role: "Roteador do lado do servidor",
    interfaces: [
      { name: "Gi0/0", ip: `${IP.r2Wan}/30`, mac: MAC.r2Wan },
      { name: "Gi0/1", ip: `${IP.r2Lan}/24`, mac: MAC.r2Lan },
    ],
    behavior:
      "A rede de destino está diretamente conectada. R2 decrementa o TTL novamente e entrega o quadro direto ao MAC do servidor — não há mais próximo salto.",
  },
  {
    id: "srv",
    name: "SRV",
    kind: "server",
    layer: 3,
    role: "Servidor de destino",
    interfaces: [
      { name: "Ethernet", ip: `${IP.server}/24`, mac: MAC.server },
    ],
    behavior:
      "Recebe o quadro, confere que o IP de destino é o seu e entrega o conteúdo à camada superior. O IP de origem continua sendo o do PC1 — foi assim a viagem inteira.",
  },
];

export const JOURNEY_SEGMENTS: JourneySegment[] = [
  {
    id: "s1",
    fromDeviceId: "pc",
    toDeviceId: "sw",
    network: "192.168.1.0/24",
    label: "LAN de origem",
    packet: {
      sourceMac: MAC.pc,
      destinationMac: MAC.r1Lan,
      sourceIp: IP.pc,
      destinationIp: IP.server,
      ttl: 64,
      nextHop: IP.r1Lan,
      outgoingInterface: "Ethernet",
    },
    changes: [],
    unchanged:
      "Quadro original. Repare que o MAC de destino é o do gateway, não o do servidor: MAC só endereça dentro do segmento local.",
  },
  {
    id: "s2",
    fromDeviceId: "sw",
    toDeviceId: "r1",
    network: "192.168.1.0/24",
    label: "Comutação camada 2",
    packet: {
      sourceMac: MAC.pc,
      destinationMac: MAC.r1Lan,
      sourceIp: IP.pc,
      destinationIp: IP.server,
      ttl: 64,
      nextHop: IP.r1Lan,
      outgoingInterface: "Fa0/24",
    },
    changes: [
      {
        field: "Interface de saída",
        from: "Ethernet (PC1)",
        to: "Fa0/24 (SW1)",
        why: "O switch encaminhou pela porta onde aprendeu o MAC do gateway.",
      },
    ],
    unchanged:
      "Nada mais mudou. O switch é transparente para o pacote: mesmos MACs, mesmos IPs, mesmo TTL.",
  },
  {
    id: "s3",
    fromDeviceId: "r1",
    toDeviceId: "r2",
    network: "10.0.12.0/30",
    label: "Enlace WAN",
    packet: {
      sourceMac: MAC.r1Wan,
      destinationMac: MAC.r2Wan,
      sourceIp: IP.pc,
      destinationIp: IP.server,
      ttl: 63,
      nextHop: IP.r2Wan,
      outgoingInterface: "Gi0/0",
    },
    changes: [
      {
        field: "MAC de origem",
        from: MAC.pc,
        to: MAC.r1Wan,
        why: "R1 monta um quadro novo com o MAC da própria interface de saída.",
      },
      {
        field: "MAC de destino",
        from: MAC.r1Lan,
        to: MAC.r2Wan,
        why: "O destino de camada 2 passa a ser o próximo salto: a interface de R2.",
      },
      {
        field: "TTL",
        from: "64",
        to: "63",
        why: "Todo roteador que encaminha um pacote decrementa o TTL em 1.",
      },
      {
        field: "Próximo salto",
        from: IP.r1Lan,
        to: IP.r2Wan,
        why: "Resultado da consulta à tabela de roteamento de R1.",
      },
    ],
    unchanged:
      "Os endereços IP de origem e destino continuam idênticos ao que o PC1 escreveu. Essa é a diferença essencial entre camada 2 e camada 3.",
  },
  {
    id: "s4",
    fromDeviceId: "r2",
    toDeviceId: "srv",
    network: "203.0.113.0/24",
    label: "LAN de destino",
    packet: {
      sourceMac: MAC.r2Lan,
      destinationMac: MAC.server,
      sourceIp: IP.pc,
      destinationIp: IP.server,
      ttl: 62,
      nextHop: "diretamente conectada",
      outgoingInterface: "Gi0/1",
    },
    changes: [
      {
        field: "MAC de origem",
        from: MAC.r1Wan,
        to: MAC.r2Lan,
        why: "Novo quadro, agora com o MAC da interface de R2 voltada ao servidor.",
      },
      {
        field: "MAC de destino",
        from: MAC.r2Wan,
        to: MAC.server,
        why: "A rede de destino é local para R2: o quadro vai direto ao servidor.",
      },
      {
        field: "TTL",
        from: "63",
        to: "62",
        why: "Segundo roteador no caminho, segundo decremento.",
      },
      {
        field: "Próximo salto",
        from: IP.r2Wan,
        to: "diretamente conectada",
        why: "Não há mais próximo salto: 203.0.113.0/24 está conectada a R2.",
      },
    ],
    unchanged:
      "IP de origem e de destino, de novo, intactos. Dois roteadores depois, o pacote ainda diz que veio de 192.168.1.10.",
  },
];

export function getDevice(id: string): JourneyDevice | undefined {
  return JOURNEY_DEVICES.find((d) => d.id === id);
}
