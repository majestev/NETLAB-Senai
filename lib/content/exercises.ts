import {
  broadcastAddress,
  firstUsableHost,
  formatIpv4,
  lastUsableHost,
  maskFromPrefix,
  networkAddress,
  prefixForHosts,
  usableHosts,
  wildcardFromPrefix,
} from "@/lib/net/ipv4";
import { decideRoute, type RouteEntry } from "@/lib/net/routing";

export type ExerciseKind =
  | "subnetting"
  | "vlsm"
  | "rota"
  | "cam"
  | "vlan"
  | "rip";

export const EXERCISE_KINDS: Array<{ kind: ExerciseKind; label: string }> = [
  { kind: "subnetting", label: "Subnetting" },
  { kind: "vlsm", label: "VLSM" },
  { kind: "rota", label: "Identificar rota" },
  { kind: "cam", label: "Tabela CAM" },
  { kind: "vlan", label: "VLAN" },
  { kind: "rip", label: "RIP" },
];

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  prompt: string;

  answer: string;

  accepted: string[];
  explanation: string;
  hint: string;
  lesson: string;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(random: () => number, list: T[]): T =>
  list[Math.floor(random() * list.length)];

const BASES = ["192.168", "172.16", "10.0"];

function enderecoAleatorio(random: () => number): number {
  const base = pick(random, BASES);
  const terceiro = Math.floor(random() * 256);
  const quarto = Math.floor(random() * 256);
  const partes =
    base === "10.0"
      ? [10, 0, terceiro, quarto]
      : base === "172.16"
        ? [172, 16, terceiro, quarto]
        : [192, 168, terceiro, quarto];
  const valor =
    ((partes[0] << 24) | (partes[1] << 16) | (partes[2] << 8) | partes[3]) >>> 0;

  return valor >>> 0;
}

function exSubnetting(seed: number): Exercise {
  const random = rng(seed);
  const prefix = pick(random, [25, 26, 27, 28, 29, 30]);
  const address = enderecoAleatorio(random);
  const alvo = pick(random, ["rede", "broadcast", "primeiro", "ultimo", "hosts", "curinga"]);

  const rede = formatIpv4(networkAddress(address, prefix));
  const broadcast = formatIpv4(broadcastAddress(address, prefix));
  const primeiro = formatIpv4(firstUsableHost(address, prefix));
  const ultimo = formatIpv4(lastUsableHost(address, prefix));
  const hosts = String(usableHosts(prefix));
  const curinga = formatIpv4(wildcardFromPrefix(prefix));
  const cidr = `${formatIpv4(address)}/${prefix}`;

  const mapa = {
    rede: {
      pergunta: `Qual é o endereço de rede de ${cidr}?`,
      resposta: rede,
      explicacao: `A máscara /${prefix} é ${formatIpv4(maskFromPrefix(prefix))}. Aplicando-a ao endereço, os bits de host zeram e o resultado é ${rede}.`,
    },
    broadcast: {
      pergunta: `Qual é o endereço de broadcast de ${cidr}?`,
      resposta: broadcast,
      explicacao: `Partindo da rede ${rede}, todos os bits de host em 1 dão ${broadcast}.`,
    },
    primeiro: {
      pergunta: `Qual é o primeiro host utilizável de ${cidr}?`,
      resposta: primeiro,
      explicacao: `A rede é ${rede}; o primeiro host é o endereço seguinte, ${primeiro}.`,
    },
    ultimo: {
      pergunta: `Qual é o último host utilizável de ${cidr}?`,
      resposta: ultimo,
      explicacao: `O broadcast é ${broadcast}; o último host é o endereço anterior, ${ultimo}.`,
    },
    hosts: {
      pergunta: `Quantos hosts utilizáveis tem uma sub-rede /${prefix}?`,
      resposta: hosts,
      explicacao: `São ${32 - prefix} bits de host: 2^${32 - prefix} = ${2 ** (32 - prefix)} endereços, menos o de rede e o de broadcast, resultando em ${hosts}.`,
    },
    curinga: {
      pergunta: `Qual é a máscara curinga de /${prefix}?`,
      resposta: curinga,
      explicacao: `A máscara é ${formatIpv4(maskFromPrefix(prefix))}; o curinga é o seu complemento bit a bit, ${curinga}.`,
    },
  } as const;

  const escolhido = mapa[alvo as keyof typeof mapa];

  return {
    id: `subnetting-${seed}`,
    kind: "subnetting",
    prompt: escolhido.pergunta,
    answer: escolhido.resposta,
    accepted: [escolhido.resposta],
    explanation: escolhido.explicacao,
    hint: "Comece escrevendo a máscara em decimal e identifique o salto entre blocos.",
    lesson: "/curso/roteamento-ip/classful-classless",
  };
}

function exVlsm(seed: number): Exercise {
  const random = rng(seed);
  const hosts = pick(random, [5, 10, 12, 25, 28, 50, 60, 100, 120, 200]);
  const resultado = prefixForHosts(hosts);
  const prefix = resultado.ok ? resultado.value : 24;

  return {
    id: `vlsm-${seed}`,
    kind: "vlsm",
    prompt: `Qual é o menor prefixo que atende uma sub-rede com ${hosts} hosts?`,
    answer: `/${prefix}`,
    accepted: [`/${prefix}`, String(prefix), formatIpv4(maskFromPrefix(prefix))],
    explanation: `Um /${prefix} oferece ${usableHosts(prefix)} hosts utilizáveis, que é o menor valor ≥ ${hosts}. Um /${prefix + 1} daria apenas ${usableHosts(prefix + 1)}.`,
    hint: "Procure a menor potência de 2 que, menos 2, ainda cobre a demanda.",
    lesson: "/curso/roteamento-ip/classful-classless",
  };
}

function exRota(seed: number): Exercise {
  const random = rng(seed);
  const terceiro = Math.floor(random() * 200) + 1;
  const host = Math.floor(random() * 250) + 1;
  const destino = ((10 << 24) | (terceiro << 16) | (5 << 8) | host) >>> 0;

  const tabela: RouteEntry[] = [
    { id: "a", network: ((10 << 24) >>> 0), prefix: 8, source: "RIP", ad: 120, metric: 3, nextHop: 1, iface: "Gi0/0" },
    { id: "b", network: ((10 << 24) | (terceiro << 16)) >>> 0, prefix: 16, source: "OSPF", ad: 110, metric: 20, nextHop: 2, iface: "Gi0/1" },
    { id: "c", network: ((10 << 24) | (terceiro << 16) | (5 << 8)) >>> 0, prefix: 24, source: "estática", ad: 1, metric: 0, nextHop: 3, iface: "Gi0/2" },
  ];

  const decisao = decideRoute(destino, tabela);
  const escolhida = decisao.chosen[0];

  return {
    id: `rota-${seed}`,
    kind: "rota",
    prompt: `A tabela tem as entradas 10.0.0.0/8 (RIP, métrica 3), 10.${terceiro}.0.0/16 (OSPF, métrica 20) e 10.${terceiro}.5.0/24 (estática). Qual prefixo é escolhido para o destino ${formatIpv4(destino)}?`,
    answer: `10.${terceiro}.5.0/24`,
    accepted: [`10.${terceiro}.5.0/24`, `/24`, `24`],
    explanation: `As três entradas casam com o destino, mas o critério de prefixo mais longo é aplicado antes de qualquer comparação de distância administrativa ou métrica. Vence o /${escolhida.prefix}.`,
    hint: "Nem métrica nem distância administrativa entram enquanto houver diferença de prefixo.",
    lesson: "/curso/roteamento-ip/fundamentos",
  };
}

function exCam(seed: number): Exercise {
  const random = rng(seed);
  const cenario = pick(random, ["desconhecido", "conhecido", "mesma-porta", "broadcast"]);

  const mapa = {
    desconhecido: {
      pergunta:
        "Um quadro chega em Fa0/1 com destino a um MAC que não está na tabela CAM. O que o switch faz?",
      resposta: "inundar",
      aceitas: ["inundar", "inunda", "inundação", "flood", "flooding"],
      explicacao:
        "Destino desconhecido é inundado por todas as portas da VLAN, exceto a de entrada. A resposta do destino ensinará ao switch a porta correta.",
    },
    conhecido: {
      pergunta:
        "Um quadro chega em Fa0/1 com destino a um MAC registrado na CAM em Fa0/3. O que o switch faz?",
      resposta: "encaminhar por Fa0/3",
      aceitas: ["encaminhar por fa0/3", "encaminhar", "fa0/3", "encaminha por fa0/3"],
      explicacao:
        "Com o destino conhecido, o encaminhamento é unicast: o quadro sai apenas pela porta registrada. Nenhuma outra porta recebe cópia.",
    },
    "mesma-porta": {
      pergunta:
        "Um quadro chega em Fa0/2 com destino a um MAC registrado na CAM também em Fa0/2. O que o switch faz?",
      resposta: "filtrar",
      aceitas: ["filtrar", "filtra", "descartar", "descarta", "filtragem"],
      explicacao:
        "Origem e destino estão no mesmo segmento. Devolver o quadro pela porta de entrada não teria utilidade, então o switch o filtra.",
    },
    broadcast: {
      pergunta:
        "Um quadro chega em Fa0/1 com destino ff:ff:ff:ff:ff:ff. O que o switch faz?",
      resposta: "inundar",
      aceitas: ["inundar", "inunda", "inundação", "flood"],
      explicacao:
        "Broadcast é sempre entregue a todas as portas da VLAN, exceto a de entrada, independentemente do que a tabela CAM contenha.",
    },
  } as const;

  const escolhido = mapa[cenario as keyof typeof mapa];

  return {
    id: `cam-${seed}`,
    kind: "cam",
    prompt: escolhido.pergunta,
    answer: escolhido.resposta,
    accepted: [...escolhido.aceitas],
    explanation: escolhido.explicacao,
    hint: "As três ações possíveis são encaminhar, inundar e filtrar.",
    lesson: "/curso/comutacao/cam",
  };
}

function exVlan(seed: number): Exercise {
  const random = rng(seed);
  const cenario = pick(random, ["comunicacao", "faixa", "tag", "nativa"]);

  const mapa = {
    comunicacao: {
      pergunta:
        "PC1 está na VLAN 10 e PC2 na VLAN 20, no mesmo switch, sem roteador. Eles se comunicam? Responda sim ou não.",
      resposta: "não",
      aceitas: ["nao", "não", "n"],
      explicacao:
        "VLANs são domínios de broadcast independentes. Sem um equipamento de camada 3 entre elas, não existe caminho.",
    },
    faixa: {
      pergunta: "Qual é o maior identificador de VLAN utilizável em 802.1Q?",
      resposta: "4094",
      aceitas: ["4094"],
      explicacao:
        "O campo tem 12 bits, o que daria de 0 a 4095; os valores 0 e 4095 são reservados, restando de 1 a 4094.",
    },
    tag: {
      pergunta:
        "Quantos bytes o 802.1Q acrescenta ao quadro Ethernet ao marcá-lo?",
      resposta: "4",
      aceitas: ["4", "4 bytes"],
      explicacao:
        "A marcação de 4 bytes é inserida entre o endereço MAC de origem e o campo EtherType.",
    },
    nativa: {
      pergunta:
        "O tráfego da VLAN nativa atravessa o trunk marcado ou sem marcação?",
      resposta: "sem marcação",
      aceitas: ["sem marcacao", "sem marcação", "sem tag", "nao marcado", "não marcado"],
      explicacao:
        "É a definição de VLAN nativa. Por isso ela precisa ser configurada com o mesmo valor nas duas pontas do trunk.",
    },
  } as const;

  const escolhido = mapa[cenario as keyof typeof mapa];

  return {
    id: `vlan-${seed}`,
    kind: "vlan",
    prompt: escolhido.pergunta,
    answer: escolhido.resposta,
    accepted: [...escolhido.aceitas],
    explanation: escolhido.explicacao,
    hint: "Reveja a aula de VLAN e 802.1Q.",
    lesson: "/curso/comutacao/vlan",
  };
}

function exRip(seed: number): Exercise {
  const random = rng(seed);
  const saltos = Math.floor(random() * 4) + 1;

  return {
    id: `rip-${seed}`,
    kind: "rip",
    prompt: `Um roteador recebe de um vizinho o anúncio de uma rede com métrica ${saltos}. Com que métrica ele instala essa rota na própria tabela?`,
    answer: String(saltos + 1),
    accepted: [String(saltos + 1), `${saltos + 1} saltos`],
    explanation: `Ao aprender uma rota de um vizinho, o roteador soma 1 à métrica anunciada, que é o custo de atravessar mais um salto. ${saltos} + 1 = ${saltos + 1}.`,
    hint: "Cada roteador atravessado conta 1 na métrica do RIP.",
    lesson: "/curso/roteamento-ip/rip",
  };
}

const GERADORES: Record<ExerciseKind, (seed: number) => Exercise> = {
  subnetting: exSubnetting,
  vlsm: exVlsm,
  rota: exRota,
  cam: exCam,
  vlan: exVlan,
  rip: exRip,
};

export function generateExercise(kind: ExerciseKind, seed: number): Exercise {
  return GERADORES[kind](seed);
}

export function matchesAnswer(exercise: Exercise, input: string): boolean {
  const normalizar = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  const alvo = normalizar(input);
  return exercise.accepted.some((a) => normalizar(a) === alvo);
}
