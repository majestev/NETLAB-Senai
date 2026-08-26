export type MacAddress = string;

export interface CamEntry {
  mac: MacAddress;
  port: string;
  vlan: number;

  learnedAt: number;
}

export type PortMode = "access" | "trunk";

export interface SwitchPort {
  id: string;
  label: string;
  mode: PortMode;

  vlan?: number;

  allowed?: number[];

  nativeVlan?: number;
}

export interface Frame {
  sourceMac: MacAddress;
  destinationMac: MacAddress;
  ingressPort: string;

  vlan: number;

  tagged: boolean;
}

export type ForwardAction = "encaminhar" | "inundar" | "filtrar" | "descartar";

export interface ForwardResult {
  action: ForwardAction;
  egressPorts: string[];

  taggedEgressPorts: string[];
  learned: CamEntry | null;
  explanation: string;
  cam: CamEntry[];
}

export const BROADCAST_MAC = "ff:ff:ff:ff:ff:ff";

function isBroadcast(mac: MacAddress): boolean {
  return mac.toLowerCase() === BROADCAST_MAC;
}

export function isMulticast(mac: MacAddress): boolean {
  const firstOctet = Number.parseInt(mac.split(":")[0] ?? "0", 16);
  return (firstOctet & 0x01) === 1 && !isBroadcast(mac);
}

function portCarriesVlan(port: SwitchPort, vlan: number): boolean {
  if (port.mode === "access") return port.vlan === vlan;
  return (port.allowed ?? []).includes(vlan);
}

export function processFrame(
  cam: CamEntry[],
  ports: SwitchPort[],
  frame: Frame,
  tick: number,
): ForwardResult {
  const ingress = ports.find((p) => p.id === frame.ingressPort);
  if (!ingress) {
    return {
      action: "descartar",
      egressPorts: [],
      taggedEgressPorts: [],
      learned: null,
      explanation: `A porta ${frame.ingressPort} não existe neste switch.`,
      cam,
    };
  }

  if (!portCarriesVlan(ingress, frame.vlan)) {
    return {
      action: "descartar",
      egressPorts: [],
      taggedEgressPorts: [],
      learned: null,
      explanation: `A porta ${ingress.label} não transporta a VLAN ${frame.vlan}; o quadro é descartado.`,
      cam,
    };
  }

  let nextCam = cam;
  let learned: CamEntry | null = null;
  if (!isBroadcast(frame.sourceMac) && !isMulticast(frame.sourceMac)) {
    const existing = cam.find(
      (e) => e.mac === frame.sourceMac && e.vlan === frame.vlan,
    );
    if (!existing || existing.port !== frame.ingressPort) {
      learned = {
        mac: frame.sourceMac,
        port: frame.ingressPort,
        vlan: frame.vlan,
        learnedAt: tick,
      };
      nextCam = [
        ...cam.filter(
          (e) => !(e.mac === frame.sourceMac && e.vlan === frame.vlan),
        ),
        learned,
      ];
    } else {
      nextCam = cam.map((e) =>
        e.mac === frame.sourceMac && e.vlan === frame.vlan
          ? { ...e, learnedAt: tick }
          : e,
      );
    }
  }

  const candidates = ports.filter(
    (p) => p.id !== frame.ingressPort && portCarriesVlan(p, frame.vlan),
  );
  const taggedOf = (selected: SwitchPort[]) =>
    selected
      .filter((p) => p.mode === "trunk" && p.nativeVlan !== frame.vlan)
      .map((p) => p.id);

  if (isBroadcast(frame.destinationMac) || isMulticast(frame.destinationMac)) {
    return {
      action: "inundar",
      egressPorts: candidates.map((p) => p.id),
      taggedEgressPorts: taggedOf(candidates),
      learned,
      explanation: isBroadcast(frame.destinationMac)
        ? `Destino é broadcast: o quadro sai por todas as portas da VLAN ${frame.vlan}, exceto a de entrada. É por isso que a VLAN delimita o domínio de broadcast.`
        : `Destino é multicast: sem filtragem específica, o switch trata o quadro como broadcast dentro da VLAN ${frame.vlan}.`,
      cam: nextCam,
    };
  }

  const entry = nextCam.find(
    (e) => e.mac === frame.destinationMac && e.vlan === frame.vlan,
  );

  if (!entry) {
    return {
      action: "inundar",
      egressPorts: candidates.map((p) => p.id),
      taggedEgressPorts: taggedOf(candidates),
      learned,
      explanation: `${frame.destinationMac} ainda não está na tabela CAM da VLAN ${frame.vlan}: o switch inunda o quadro para descobrir onde o destino está. A resposta ensinará a porta correta.`,
      cam: nextCam,
    };
  }

  if (entry.port === frame.ingressPort) {
    return {
      action: "filtrar",
      egressPorts: [],
      taggedEgressPorts: [],
      learned,
      explanation: `Origem e destino estão na mesma porta (${ingress.label}): o switch filtra o quadro em vez de devolvê-lo ao segmento de onde veio.`,
      cam: nextCam,
    };
  }

  const egress = ports.find((p) => p.id === entry.port);
  return {
    action: "encaminhar",
    egressPorts: [entry.port],
    taggedEgressPorts: egress ? taggedOf([egress]) : [],
    learned,
    explanation: `${frame.destinationMac} está na porta ${egress?.label ?? entry.port} (VLAN ${frame.vlan}): o quadro sai só por ela. Nenhuma outra porta recebe cópia.`,
    cam: nextCam,
  };
}
