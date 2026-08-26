export interface FrameField {
  id: string;
  name: string;

  bytes: number;
  size: string;
  value?: string;
  description: string;

  tag?: boolean;
}

export const UNTAGGED_FIELDS: FrameField[] = [
  {
    id: "dst",
    name: "MAC destino",
    bytes: 6,
    size: "6 B",
    description: "Para quem o quadro vai neste enlace.",
  },
  {
    id: "src",
    name: "MAC origem",
    bytes: 6,
    size: "6 B",
    description: "Quem colocou o quadro no enlace. É o campo que o switch aprende.",
  },
  {
    id: "type",
    name: "EtherType",
    bytes: 2,
    size: "2 B",
    value: "0x0800",
    description: "Diz que o conteúdo é IPv4.",
  },
  {
    id: "payload",
    name: "Dados",
    bytes: 1500,
    size: "46–1500 B",
    description: "O pacote IP que veio de cima.",
  },
  {
    id: "fcs",
    name: "FCS",
    bytes: 4,
    size: "4 B",
    description: "Verificação de erros. É recalculada sempre que o quadro muda.",
  },
];

export function tagFields(vlan: number, prioridade = 0): FrameField[] {
  return [
    {
      id: "tpid",
      name: "TPID",
      bytes: 2,
      size: "2 B",
      value: "0x8100",
      description:
        "Marca fixa que avisa: o que vem a seguir não é o EtherType, é a etiqueta.",
      tag: true,
    },
    {
      id: "pcp",
      name: "PCP",
      bytes: 0,
      size: "3 bits",
      value: String(prioridade),
      description: "Prioridade da classe de serviço, de 0 a 7.",
      tag: true,
    },
    {
      id: "dei",
      name: "DEI",
      bytes: 0,
      size: "1 bit",
      value: "0",
      description: "Marca o quadro como descartável sob congestionamento.",
      tag: true,
    },
    {
      id: "vid",
      name: "VID",
      bytes: 2,
      size: "12 bits",
      value: String(vlan),
      description: `A VLAN em si. Doze bits: 1 a 4094 — é daqui que vem o limite de VLANs.`,
      tag: true,
    },
  ];
}

export type TagLocation =
  | "host-origem"
  | "porta-acesso-entrada"
  | "trunk"
  | "porta-acesso-saida"
  | "host-destino";

export interface TagStage {
  index: number;
  id: TagLocation;
  title: string;

  where: string;
  narrative: string;

  tagged: boolean;

  actor: string;

  maxBytes: number;

  changed: "inserida" | "removida" | null;
}

const BASE_BYTES = 1518;
const TAG_BYTES = 4;

export function buildTagStages(vlan: number): TagStage[] {
  const estagios: Array<Omit<TagStage, "index">> = [
    {
      id: "host-origem",
      title: "PC-A monta o quadro",
      where: "PC-A → Fa0/1",
      narrative:
        "O host não sabe que existem VLANs. Ele monta um quadro Ethernet comum, sem nenhuma etiqueta.",
      tagged: false,
      actor: "PC-A",
      maxBytes: BASE_BYTES,
      changed: null,
    },
    {
      id: "porta-acesso-entrada",
      title: `A porta de acesso classifica na VLAN ${vlan}`,
      where: "SW1, porta Fa0/1",
      narrative: `A porta está configurada como acesso da VLAN ${vlan}. O switch associa o quadro a essa VLAN internamente — ainda sem escrever nada no quadro.`,
      tagged: false,
      actor: "SW1",
      maxBytes: BASE_BYTES,
      changed: null,
    },
    {
      id: "trunk",
      title: "O trunk insere a etiqueta",
      where: "SW1 Gi0/1 → SW2 Gi0/1",
      narrative: `O enlace entre os switches transporta várias VLANs. Para o outro lado saber de qual delas o quadro veio, SW1 insere quatro bytes com VID ${vlan}.`,
      tagged: true,
      actor: "SW1",
      maxBytes: BASE_BYTES + TAG_BYTES,
      changed: "inserida",
    },
    {
      id: "porta-acesso-saida",
      title: "A porta de acesso remove a etiqueta",
      where: "SW2, porta Fa0/5",
      narrative: `SW2 lê o VID, sabe que o quadro pertence à VLAN ${vlan} e o entrega pela porta de acesso dessa VLAN — retirando os quatro bytes antes de enviar.`,
      tagged: false,
      actor: "SW2",
      maxBytes: BASE_BYTES,
      changed: "removida",
    },
    {
      id: "host-destino",
      title: "PC-B recebe um quadro comum",
      where: "Fa0/5 → PC-B",
      narrative:
        "O host de destino recebe exatamente o quadro que PC-A enviou. Nenhum dos dois hosts jamais viu uma etiqueta 802.1Q.",
      tagged: false,
      actor: "PC-B",
      maxBytes: BASE_BYTES,
      changed: null,
    },
  ];

  return estagios.map((e, index) => ({ ...e, index }));
}

export function fieldsAtStage(stage: TagStage, vlan: number): FrameField[] {
  if (!stage.tagged) return UNTAGGED_FIELDS;
  const corte = UNTAGGED_FIELDS.findIndex((f) => f.id === "type");
  return [
    ...UNTAGGED_FIELDS.slice(0, corte),
    ...tagFields(vlan),
    ...UNTAGGED_FIELDS.slice(corte),
  ];
}

export const VLAN_ID_MAX = 4094;
