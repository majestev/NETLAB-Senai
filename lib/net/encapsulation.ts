export type Layer = 1 | 2 | 3 | 4 | 7;

export interface EncapLayer {
  layer: Layer;

  name: string;

  pdu: string;

  header: string;

  headerBytes: number;

  purpose: string;

  keyField: { name: string; value: string };

  readBy: string;
}

export const ENCAP_LAYERS: EncapLayer[] = [
  {
    layer: 7,
    name: "Aplicação",
    pdu: "Dados",
    header: "Cabeçalho HTTP",
    headerBytes: 0,
    purpose:
      "O conteúdo que a pessoa quis enviar. Ainda não há endereço nem porta: é só o pedido.",
    keyField: { name: "Requisição", value: "GET /index.html" },
    readBy: "O servidor web do outro lado.",
  },
  {
    layer: 4,
    name: "Transporte",
    pdu: "Segmento",
    header: "Cabeçalho TCP",
    headerBytes: 20,
    purpose:
      "Diz a qual aplicação o dado pertence e garante entrega ordenada e confirmada.",
    keyField: { name: "Porta destino", value: "80" },
    readBy: "A camada de transporte do host de destino — nenhum roteador do caminho.",
  },
  {
    layer: 3,
    name: "Rede",
    pdu: "Pacote",
    header: "Cabeçalho IP",
    headerBytes: 20,
    purpose:
      "Carrega os endereços de origem e destino que valem de ponta a ponta, por toda a travessia.",
    keyField: { name: "IP destino", value: "203.0.113.10" },
    readBy: "Todo roteador do caminho, e o host de destino.",
  },
  {
    layer: 2,
    name: "Enlace",
    pdu: "Quadro",
    header: "Cabeçalho Ethernet + FCS",
    headerBytes: 18,
    purpose:
      "Endereça o próximo equipamento deste enlace, e só dele. É refeito a cada salto.",
    keyField: { name: "MAC destino", value: "00:1a:2b:00:00:01" },
    readBy: "O switch e o roteador deste enlace — e ninguém além dele.",
  },
  {
    layer: 1,
    name: "Física",
    pdu: "Bits",
    header: "Preâmbulo",
    headerBytes: 8,
    purpose:
      "Sinaliza no meio físico. Aqui não há endereço nenhum: são pulsos elétricos, luz ou rádio.",
    keyField: { name: "Sinal", value: "10101010…" },
    readBy: "A interface física do outro lado do cabo.",
  },
];

export type EncapDirection = "descendo" | "subindo";

export interface EncapStep {
  index: number;
  id: string;
  direction: EncapDirection;
  layer: Layer;
  title: string;
  narrative: string;

  wrapped: Layer[];

  totalBytes: number;

  change: "adiciona" | "remove";
}

export const PAYLOAD_BYTES = 120;

export function buildEncapSteps(): EncapStep[] {
  const passos: EncapStep[] = [];
  const envolvidas: Layer[] = [];
  let bytes = PAYLOAD_BYTES;

  for (const camada of ENCAP_LAYERS) {
    bytes += camada.headerBytes;
    envolvidas.unshift(camada.layer);
    passos.push({
      index: passos.length,
      id: `desce-${camada.layer}`,
      direction: "descendo",
      layer: camada.layer,
      title: `${camada.name} monta o ${camada.pdu.toLowerCase()}`,
      narrative:
        camada.layer === 7
          ? `A aplicação produz ${PAYLOAD_BYTES} bytes de dados. Nada foi encapsulado ainda.`
          : `${camada.name} envolve o que recebeu com ${camada.headerBytes} bytes de ${camada.header.toLowerCase()} — sem abrir o conteúdo. ${camada.purpose}`,
      wrapped: [...envolvidas],
      totalBytes: bytes,
      change: "adiciona",
    });
  }

  for (const camada of [...ENCAP_LAYERS].reverse()) {
    bytes -= camada.headerBytes;
    envolvidas.shift();
    passos.push({
      index: passos.length,
      id: `sobe-${camada.layer}`,
      direction: "subindo",
      layer: camada.layer,
      title:
        camada.layer === 7
          ? "A aplicação recebe os dados"
          : `${camada.name} lê e retira seu cabeçalho`,
      narrative:
        camada.layer === 7
          ? `Restam os ${PAYLOAD_BYTES} bytes originais, idênticos aos que saíram. Nenhum dos cabeçalhos sobrou.`
          : `${camada.readBy} ${camada.name} lê o campo que lhe interessa (${camada.keyField.name} = ${camada.keyField.value}), retira seus ${camada.headerBytes} bytes e entrega o resto para cima.`,
      wrapped: [...envolvidas],
      totalBytes: bytes,
      change: "remove",
    });
  }

  return passos;
}

export const ENCAP_STEPS: EncapStep[] = buildEncapSteps();

export function layerInfo(layer: Layer): EncapLayer {
  return ENCAP_LAYERS.find((l) => l.layer === layer)!;
}
