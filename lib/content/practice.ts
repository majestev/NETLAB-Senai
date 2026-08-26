export type PracticeCategory =
  | "Endereçamento"
  | "Roteamento"
  | "Comutação"
  | "Protocolos"
  | "Sem fio";

export interface PracticeItem {
  href: string;
  title: string;
  short: string;
  summary: string;

  tagline: string;
  category: PracticeCategory;

  level: 1 | 2 | 3;

  minutes: number;

  tasks?: number;

  lesson?: string;
}

export const SIMULATORS: PracticeItem[] = [
  {
    href: "/simuladores/subnetting",
    tagline: "Do IP e do prefixo à faixa utilizável, bit a bit.",
    category: "Endereçamento",
    level: 1,
    minutes: 6,
    title: "Calculadora de sub-redes",
    short: "Subnetting",
    summary:
      "Informe IP e prefixo e veja rede, máscara, curinga, broadcast, faixa utilizável e a divisão bit a bit.",
    lesson: "/curso/roteamento-ip/classful-classless",
  },
  {
    href: "/simuladores/vlsm",
    tagline: "Reparta um bloco sem sobrepor nem desperdiçar.",
    category: "Endereçamento",
    level: 2,
    minutes: 8,
    title: "Alocador VLSM",
    short: "VLSM",
    summary:
      "Distribua um bloco entre sub-redes de tamanhos diferentes e veja sobreposição, desperdício e espaço restante.",
    lesson: "/curso/roteamento-ip/classful-classless",
  },
  {
    href: "/simuladores/roteamento",
    tagline: "Veja as rotas candidatas caírem, critério por critério.",
    category: "Roteamento",
    level: 2,
    minutes: 6,
    title: "Decisão de encaminhamento",
    short: "Roteamento",
    summary:
      "Consulte uma tabela de roteamento passo a passo: prefixo mais longo, distância administrativa, métrica e ECMP.",
    lesson: "/curso/roteamento-ip/fundamentos",
  },
  {
    href: "/simuladores/rip",
    tagline: "Derrube um enlace e assista a rede convergir.",
    category: "Roteamento",
    level: 3,
    minutes: 10,
    title: "Convergência RIP",
    short: "RIP",
    summary:
      "Acompanhe R1–R2–R3 trocando anúncios, derrube um enlace e veja a rede convergir iteração por iteração.",
    lesson: "/curso/roteamento-ip/rip",
  },
  {
    href: "/simuladores/switch",
    tagline: "A tabela CAM se preenchendo quadro a quadro.",
    category: "Comutação",
    level: 1,
    minutes: 6,
    title: "Aprendizado do switch",
    short: "Switch / CAM",
    summary:
      "Envie quadros entre quatro hosts e veja a tabela CAM se preencher, com inundação enquanto o destino é desconhecido.",
    lesson: "/curso/comutacao/cam",
  },
  {
    href: "/simuladores/vlan",
    tagline: "A marcação 802.1Q entrando e saindo do trunk.",
    category: "Comutação",
    level: 2,
    minutes: 7,
    title: "VLAN e marcação 802.1Q",
    short: "VLAN",
    summary:
      "Separe hosts em VLAN 10 e VLAN 20 e observe a marcação sendo inserida e removida ao atravessar o trunk.",
    lesson: "/curso/comutacao/vlan",
  },
  {
    href: "/simuladores/analisador",
    tagline: "Abra cada pacote de uma captura, camada por camada.",
    category: "Protocolos",
    level: 2,
    minutes: 8,
    title: "Analisador de protocolos",
    short: "Analisador",
    summary:
      "Percorra uma captura e abra cada pacote camada por camada: Ethernet, IPv4, TCP e aplicação.",
    lesson: "/curso/analisadores/captura",
  },
];

export const LABS: PracticeItem[] = [
  {
    href: "/laboratorios/roteamento",
    tagline: "Escreva as rotas estáticas que ligam duas LANs.",
    category: "Roteamento",
    level: 2,
    minutes: 8,
    tasks: 4,
    title: "Laboratório de roteamento estático",
    short: "Roteamento",
    summary:
      "Conecte duas LANs através de dois roteadores escrevendo as rotas estáticas corretas nos dois sentidos.",
    lesson: "/curso/roteamento-ip/estatico",
  },
  {
    href: "/laboratorios/vlsm",
    tagline: "Divida um /24 entre seis redes de tamanhos diferentes.",
    category: "Endereçamento",
    level: 3,
    minutes: 10,
    tasks: 3,
    title: "Laboratório de VLSM",
    short: "VLSM",
    summary:
      "Divida 192.168.10.0/24 entre quatro LANs e dois enlaces WAN sem sobrepor blocos nem desperdiçar espaço.",
    lesson: "/curso/roteamento-ip/classful-classless",
  },
  {
    href: "/laboratorios/rip",
    tagline: "Habilite o RIP e explique a reconvergência.",
    category: "Roteamento",
    level: 3,
    minutes: 14,
    tasks: 8,
    title: "Laboratório de RIP",
    short: "RIP",
    summary:
      "Habilite o RIP em três roteadores, derrube um enlace e explique a sequência que leva à reconvergência.",
    lesson: "/curso/roteamento-ip/rip",
  },
  {
    href: "/laboratorios/dominios",
    tagline: "Monte a topologia e veja os domínios mudarem.",
    category: "Comutação",
    level: 2,
    minutes: 10,
    tasks: 4,
    title: "Construtor de domínios de colisão e broadcast",
    short: "Domínios",
    summary:
      "Monte a topologia peça por peça (hosts, hubs, switches e roteadores) e veja a contagem de domínios mudar a cada enlace criado.",
    lesson: "/curso/comutacao/colisoes",
  },
  {
    href: "/laboratorios/switching",
    tagline: "Preveja o switch quadro a quadro e confira.",
    category: "Comutação",
    level: 1,
    minutes: 8,
    tasks: 4,
    title: "Laboratório de comutação",
    short: "Switching",
    summary:
      "Preveja o comportamento do switch quadro a quadro e confira contra a tabela CAM resultante.",
    lesson: "/curso/comutacao/cam",
  },
  {
    href: "/laboratorios/vlan",
    tagline: "Configure acesso e trunk; decida quem fala com quem.",
    category: "Comutação",
    level: 2,
    minutes: 8,
    tasks: 4,
    title: "Laboratório de VLAN",
    short: "VLAN",
    summary:
      "Configure portas de acesso e um trunk 802.1Q e determine quais hosts conseguem se comunicar.",
    lesson: "/curso/comutacao/vlan",
  },
  {
    href: "/laboratorios/wireless",
    tagline: "Escolha a segurança certa para o cenário.",
    category: "Sem fio",
    level: 2,
    minutes: 8,
    tasks: 4,
    title: "Laboratório de rede sem fio",
    short: "Wireless",
    summary:
      "Configure um ponto de acesso e escolha o mecanismo de segurança adequado ao cenário proposto.",
    lesson: "/curso/redes-sem-fio/configuracao",
  },
];

export const PRACTICE_LINKS = [
  { href: "/laboratorios", label: "Laboratórios" },
  { href: "/simuladores", label: "Simuladores" },
  { href: "/exercicios", label: "Exercícios" },
  { href: "/quiz", label: "Quiz" },
] as const;

export const REFERENCE_LINKS = [
  { href: "/glossario", label: "Glossário" },
  { href: "/referencias", label: "Referências" },
] as const;

export function getSimulator(href: string) {
  return SIMULATORS.find((s) => s.href === href);
}

export function getLab(href: string) {
  return LABS.find((l) => l.href === href);
}
