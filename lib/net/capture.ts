export interface FieldNode {
  label: string;
  value: string;

  size?: string;
  note?: string;
}

export interface LayerNode {
  layer: 2 | 3 | 4 | 7;
  title: string;
  summary: string;
  fields: FieldNode[];
}

export interface CapturedPacket {
  no: number;

  time: number;
  source: string;
  destination: string;
  protocol: "ARP" | "TCP" | "HTTP";
  length: number;
  info: string;
  layers: LayerNode[];
}

const MAC_PC = "00:11:11:11:11:11";
const MAC_GW = "00:1a:2b:00:00:a1";
const IP_PC = "192.168.1.10";
const IP_GW = "192.168.1.1";
const IP_SRV = "203.0.113.50";

function ethernet(src: string, dst: string, type: string): LayerNode {
  return {
    layer: 2,
    title: "Ethernet II",
    summary: `${src} → ${dst}`,
    fields: [
      { label: "MAC de destino", value: dst, size: "6 bytes" },
      { label: "MAC de origem", value: src, size: "6 bytes" },
      {
        label: "EtherType",
        value: type,
        size: "2 bytes",
        note:
          type === "0x0800"
            ? "0x0800 indica que o payload é IPv4"
            : "0x0806 indica que o payload é ARP",
      },
    ],
  };
}

function ipv4(src: string, dst: string, ttl: number, total: number, proto = "6 (TCP)"): LayerNode {
  return {
    layer: 3,
    title: "Internet Protocol Version 4",
    summary: `${src} → ${dst}, TTL ${ttl}`,
    fields: [
      { label: "Versão", value: "4", size: "4 bits" },
      { label: "IHL", value: "5 (20 bytes)", size: "4 bits" },
      { label: "Comprimento total", value: `${total} bytes`, size: "2 bytes" },
      {
        label: "TTL",
        value: String(ttl),
        size: "1 byte",
        note:
          ttl === 62
            ? "Saiu do servidor com 64 e foi decrementado pelos dois roteadores do caminho."
            : "Valor inicial definido pelo sistema operacional de origem.",
      },
      { label: "Protocolo", value: proto, size: "1 byte" },
      { label: "IP de origem", value: src, size: "4 bytes" },
      { label: "IP de destino", value: dst, size: "4 bytes" },
    ],
  };
}

function tcp(
  sport: number,
  dport: number,
  seq: number,
  ack: number,
  flags: string,
  win: number,
): LayerNode {
  return {
    layer: 4,
    title: "Transmission Control Protocol",
    summary: `${sport} → ${dport} [${flags}] Seq=${seq} Ack=${ack}`,
    fields: [
      { label: "Porta de origem", value: String(sport), size: "2 bytes" },
      {
        label: "Porta de destino",
        value: String(dport),
        size: "2 bytes",
        note: dport === 80 ? "80 é a porta padrão do HTTP" : undefined,
      },
      { label: "Número de sequência", value: String(seq), size: "4 bytes" },
      { label: "Número de confirmação", value: String(ack), size: "4 bytes" },
      { label: "Flags", value: flags, size: "9 bits" },
      { label: "Janela", value: String(win), size: "2 bytes" },
    ],
  };
}

export const CAPTURE: CapturedPacket[] = [
  {
    no: 1,
    time: 0,
    source: MAC_PC,
    destination: "Broadcast",
    protocol: "ARP",
    length: 42,
    info: `Quem tem ${IP_GW}? Diga a ${IP_PC}`,
    layers: [
      ethernet(MAC_PC, "ff:ff:ff:ff:ff:ff", "0x0806"),
      {
        layer: 3,
        title: "Address Resolution Protocol (requisição)",
        summary: `Procurando o MAC de ${IP_GW}`,
        fields: [
          { label: "Tipo de hardware", value: "1 (Ethernet)" },
          { label: "Tipo de protocolo", value: "0x0800 (IPv4)" },
          { label: "Opcode", value: "1 (requisição)" },
          { label: "IP do remetente", value: IP_PC },
          { label: "MAC do remetente", value: MAC_PC },
          { label: "IP procurado", value: IP_GW },
          {
            label: "MAC procurado",
            value: "00:00:00:00:00:00",
            note: "Vazio: é justamente o que o ARP quer descobrir.",
          },
        ],
      },
    ],
  },
  {
    no: 2,
    time: 0.002,
    source: MAC_GW,
    destination: MAC_PC,
    protocol: "ARP",
    length: 42,
    info: `${IP_GW} está em ${MAC_GW}`,
    layers: [
      ethernet(MAC_GW, MAC_PC, "0x0806"),
      {
        layer: 3,
        title: "Address Resolution Protocol (resposta)",
        summary: `${IP_GW} responde com o próprio MAC`,
        fields: [
          { label: "Opcode", value: "2 (resposta)" },
          { label: "IP do remetente", value: IP_GW },
          { label: "MAC do remetente", value: MAC_GW },
          { label: "IP de destino", value: IP_PC },
          { label: "MAC de destino", value: MAC_PC },
        ],
      },
    ],
  },
  {
    no: 3,
    time: 0.004,
    source: IP_PC,
    destination: IP_SRV,
    protocol: "TCP",
    length: 74,
    info: "49152 → 80 [SYN] Seq=0 Win=64240 Len=0",
    layers: [
      ethernet(MAC_PC, MAC_GW, "0x0800"),
      ipv4(IP_PC, IP_SRV, 64, 60),
      tcp(49152, 80, 0, 0, "SYN", 64240),
    ],
  },
  {
    no: 4,
    time: 0.031,
    source: IP_SRV,
    destination: IP_PC,
    protocol: "TCP",
    length: 74,
    info: "80 → 49152 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0",
    layers: [
      ethernet(MAC_GW, MAC_PC, "0x0800"),
      ipv4(IP_SRV, IP_PC, 62, 60),
      tcp(80, 49152, 0, 1, "SYN, ACK", 65535),
    ],
  },
  {
    no: 5,
    time: 0.032,
    source: IP_PC,
    destination: IP_SRV,
    protocol: "TCP",
    length: 66,
    info: "49152 → 80 [ACK] Seq=1 Ack=1 Win=64240 Len=0",
    layers: [
      ethernet(MAC_PC, MAC_GW, "0x0800"),
      ipv4(IP_PC, IP_SRV, 64, 52),
      tcp(49152, 80, 1, 1, "ACK", 64240),
    ],
  },
  {
    no: 6,
    time: 0.033,
    source: IP_PC,
    destination: IP_SRV,
    protocol: "HTTP",
    length: 382,
    info: "GET /index.html HTTP/1.1",
    layers: [
      ethernet(MAC_PC, MAC_GW, "0x0800"),
      ipv4(IP_PC, IP_SRV, 64, 368),
      tcp(49152, 80, 1, 1, "PSH, ACK", 64240),
      {
        layer: 7,
        title: "Hypertext Transfer Protocol",
        summary: "GET /index.html HTTP/1.1",
        fields: [
          { label: "Método", value: "GET" },
          { label: "Recurso", value: "/index.html" },
          { label: "Versão", value: "HTTP/1.1" },
          { label: "Host", value: "203.0.113.50" },
          { label: "User-Agent", value: "curl/8.6.0" },
          { label: "Accept", value: "*/*" },
        ],
      },
    ],
  },
  {
    no: 7,
    time: 0.061,
    source: IP_SRV,
    destination: IP_PC,
    protocol: "TCP",
    length: 66,
    info: "80 → 49152 [ACK] Seq=1 Ack=317 Win=65535 Len=0",
    layers: [
      ethernet(MAC_GW, MAC_PC, "0x0800"),
      ipv4(IP_SRV, IP_PC, 62, 52),
      tcp(80, 49152, 1, 317, "ACK", 65535),
    ],
  },
  {
    no: 8,
    time: 0.064,
    source: IP_SRV,
    destination: IP_PC,
    protocol: "HTTP",
    length: 1218,
    info: "HTTP/1.1 200 OK (text/html)",
    layers: [
      ethernet(MAC_GW, MAC_PC, "0x0800"),
      ipv4(IP_SRV, IP_PC, 62, 1204),
      tcp(80, 49152, 1, 317, "PSH, ACK", 65535),
      {
        layer: 7,
        title: "Hypertext Transfer Protocol",
        summary: "HTTP/1.1 200 OK",
        fields: [
          { label: "Versão", value: "HTTP/1.1" },
          { label: "Código de estado", value: "200 OK" },
          { label: "Content-Type", value: "text/html; charset=utf-8" },
          { label: "Content-Length", value: "1136" },
          { label: "Server", value: "nginx" },
        ],
      },
    ],
  },
  {
    no: 9,
    time: 0.066,
    source: IP_PC,
    destination: IP_SRV,
    protocol: "TCP",
    length: 66,
    info: "49152 → 80 [FIN, ACK] Seq=317 Ack=1153 Win=64240 Len=0",
    layers: [
      ethernet(MAC_PC, MAC_GW, "0x0800"),
      ipv4(IP_PC, IP_SRV, 64, 52),
      tcp(49152, 80, 317, 1153, "FIN, ACK", 64240),
    ],
  },
  {
    no: 10,
    time: 0.091,
    source: IP_SRV,
    destination: IP_PC,
    protocol: "TCP",
    length: 66,
    info: "80 → 49152 [FIN, ACK] Seq=1153 Ack=318 Win=65535 Len=0",
    layers: [
      ethernet(MAC_GW, MAC_PC, "0x0800"),
      ipv4(IP_SRV, IP_PC, 62, 52),
      tcp(80, 49152, 1153, 318, "FIN, ACK", 65535),
    ],
  },
];

export const CAPTURE_NOTES = [
  "Os pacotes 1 e 2 são ARP: antes de qualquer coisa, o PC precisa do MAC do gateway. Repare que a requisição é broadcast e a resposta é unicast.",
  "Os pacotes 3, 4 e 5 são o handshake de três vias do TCP: SYN, SYN-ACK e ACK.",
  "Todo pacote vindo do servidor chega com TTL 62, e não 64: os dois roteadores do caminho decrementaram um cada.",
  "O MAC de origem dos pacotes do servidor é o do gateway, não o do servidor — a captura foi feita na LAN do PC, e ali o quadro já foi reescrito.",
] as const;

const TAMANHO_CABECALHO: Record<number, number> = {
  2: 14,
  3: 20,
  4: 20,
};

export interface LayerSpan {
  layer: 2 | 3 | 4 | 7;
  title: string;

  start: number;

  bytes: number;
}

export function layerSpans(packet: CapturedPacket): LayerSpan[] {
  const spans: LayerSpan[] = [];
  let cursor = 0;

  for (const layer of packet.layers) {
    const declarado = TAMANHO_CABECALHO[layer.layer];

    const bytes =
      declarado === undefined
        ? Math.max(0, packet.length - cursor)
        : layer.layer === 3 && packet.protocol === "ARP"
          ? Math.max(0, packet.length - cursor)
          : declarado;

    spans.push({ layer: layer.layer, title: layer.title, start: cursor, bytes });
    cursor += bytes;
  }

  return spans;
}
