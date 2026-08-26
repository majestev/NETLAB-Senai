export interface Lesson {
  href: string;

  title: string;

  short: string;

  objective: string;

  lab?: string;

  simulator?: string;
}

export interface CourseModule {
  id: string;

  number: string;
  href: string;
  title: string;
  short: string;

  summary: string;

  tagline: string;
  lessons: Lesson[];
}

export const CURRICULUM: CourseModule[] = [
  {
    id: "roteamento-ip",
    number: "01",
    href: "/curso/roteamento-ip",
    title: "Roteamento IP",
    short: "Roteamento IP",
    summary:
      "Como um pacote encontra o caminho entre redes distintas: tabela de roteamento, rotas estáticas, protocolos dinâmicos e RIP.",
    tagline: "Como o roteador escolhe o próximo salto.",
    lessons: [
      {
        href: "/curso/roteamento-ip/fundamentos",
        title: "Fundamentos do roteamento IP",
        short: "Fundamentos",
        objective:
          "Ler uma tabela de roteamento e determinar por qual interface um pacote sai.",
        simulator: "/simuladores/roteamento",
      },
      {
        href: "/curso/roteamento-ip/estatico",
        title: "Roteamento estático",
        short: "Roteamento estático",
        objective:
          "Escrever rotas estáticas e rota padrão, e prever o efeito de cada comando na tabela.",
        lab: "/laboratorios/roteamento",
      },
      {
        href: "/curso/roteamento-ip/dinamico",
        title: "Roteamento dinâmico",
        short: "Roteamento dinâmico",
        objective:
          "Distinguir vetor de distância de estado de enlace e escolher quando usar roteamento dinâmico.",
      },
      {
        href: "/curso/roteamento-ip/classful-classless",
        title: "Classful e Classless",
        short: "Classful / Classless",
        objective:
          "Explicar por que o endereçamento por classes foi substituído por CIDR e calcular prefixos.",
        simulator: "/simuladores/subnetting",
      },
      {
        href: "/curso/roteamento-ip/rip",
        title: "RIP — Routing Information Protocol",
        short: "RIP",
        objective:
          "Descrever como o RIP converge, o que é contagem ao infinito e como split horizon a evita.",
        lab: "/laboratorios/rip",
        simulator: "/simuladores/rip",
      },
    ],
  },
  {
    id: "interfaces",
    number: "02",
    href: "/curso/interfaces",
    title: "Interfaces de configuração",
    short: "Interfaces",
    summary:
      "As duas formas de falar com um equipamento de rede: interface gráfica e linha de comando.",
    tagline: "Falar com o equipamento: interface gráfica e CLI.",
    lessons: [
      {
        href: "/curso/interfaces/gui-cli",
        title: "GUI e CLI",
        short: "GUI e CLI",
        objective:
          "Escolher entre interface gráfica e CLI conforme a tarefa, e navegar pelos modos da CLI.",
      },
    ],
  },
  {
    id: "analisadores",
    number: "03",
    href: "/curso/analisadores",
    title: "Analisadores de protocolos",
    short: "Analisadores",
    summary:
      "Como capturar tráfego e ler um pacote campo a campo para diagnosticar a rede.",
    tagline: "Capturar tráfego e ler o pacote campo a campo.",
    lessons: [
      {
        href: "/curso/analisadores/captura",
        title: "Captura e leitura de pacotes",
        short: "Captura de pacotes",
        objective:
          "Interpretar uma captura: identificar protocolo, endereços e o que cada camada acrescenta.",
        simulator: "/simuladores/analisador",
      },
    ],
  },
  {
    id: "ativos",
    number: "04",
    href: "/curso/ativos",
    title: "Ativos de rede",
    short: "Ativos",
    summary:
      "Os equipamentos que formam a infraestrutura e em qual camada cada um atua.",
    tagline: "Que equipamento atua em qual camada, e por quê.",
    lessons: [
      {
        href: "/curso/ativos/equipamentos",
        title: "Equipamentos e camadas de atuação",
        short: "Equipamentos",
        objective:
          "Escolher o equipamento correto para um requisito e justificar pela camada em que ele opera.",
      },
    ],
  },
  {
    id: "comutacao",
    number: "05",
    href: "/curso/comutacao",
    title: "Comutação",
    short: "Comutação",
    summary:
      "Como o switch aprende, decide e segmenta: endereço MAC, domínios, tabela CAM, Ethernet e VLANs.",
    tagline: "Como o switch aprende, decide e segmenta.",
    lessons: [
      {
        href: "/curso/comutacao/mac",
        title: "Endereço MAC",
        short: "Endereço MAC",
        objective:
          "Ler um endereço MAC, identificar sua estrutura e distinguir unicast, multicast e broadcast.",
      },
      {
        href: "/curso/comutacao/colisoes",
        title: "Domínios de colisão e de broadcast",
        short: "Colisão e broadcast",
        objective:
          "Contar domínios de colisão e de broadcast em uma topologia com hubs, switches e roteadores.",
      },
      {
        href: "/curso/comutacao/cam",
        title: "Tabela CAM",
        short: "Tabela CAM",
        objective:
          "Explicar como o switch popula a tabela CAM e o que acontece com um destino desconhecido.",
        lab: "/laboratorios/switching",
        simulator: "/simuladores/switch",
      },
      {
        href: "/curso/comutacao/metodos",
        title: "Métodos de encaminhamento",
        short: "Encaminhamento",
        objective:
          "Comparar store-and-forward, cut-through e fragment-free quanto a latência e detecção de erro.",
      },
      {
        href: "/curso/comutacao/configuracao",
        title: "Configuração de switches",
        short: "Configuração",
        objective:
          "Aplicar a configuração básica de um switch e verificar o resultado com comandos de exibição.",
      },
      {
        href: "/curso/comutacao/ethernet",
        title: "Ethernet e IEEE 802.3",
        short: "Ethernet / 802.3",
        objective:
          "Identificar os campos de um quadro Ethernet e relacioná-los ao padrão IEEE 802.3.",
      },
      {
        href: "/curso/comutacao/elementos",
        title: "Elementos da comutação",
        short: "Elementos",
        objective:
          "Relacionar portas, enlaces, velocidade e duplex ao comportamento do switch.",
      },
      {
        href: "/curso/comutacao/vlan",
        title: "VLAN e IEEE 802.1Q",
        short: "VLAN / 802.1Q",
        objective:
          "Segmentar uma rede em VLANs e explicar o que o 802.1Q acrescenta ao quadro em um trunk.",
        lab: "/laboratorios/vlan",
        simulator: "/simuladores/vlan",
      },
    ],
  },
  {
    id: "redes-sem-fio",
    number: "06",
    href: "/curso/redes-sem-fio",
    title: "Redes sem fio",
    short: "Redes sem fio",
    summary:
      "Como o cliente associa a um ponto de acesso e como a segurança do enlace sem fio evoluiu.",
    tagline: "Associação ao ponto de acesso e segurança do enlace.",
    lessons: [
      {
        href: "/curso/redes-sem-fio/configuracao",
        title: "Configuração de redes sem fio",
        short: "Configuração",
        objective:
          "Configurar SSID, canal e modo de operação de um ponto de acesso de forma consciente.",
        lab: "/laboratorios/wireless",
      },
      {
        href: "/curso/redes-sem-fio/seguranca",
        title: "Segurança: WEP, WPA, WPA2, WPA3 e IEEE 802.11i",
        short: "Segurança",
        objective:
          "Comparar os mecanismos de segurança sem fio e justificar a escolha do mais adequado.",
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = CURRICULUM.flatMap((m) => m.lessons);

export const TOTAL_LESSONS = ALL_LESSONS.length;

export function getLessonByHref(href: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.href === href);
}

export function getModuleOfLesson(href: string): CourseModule | undefined {
  return CURRICULUM.find((m) => m.lessons.some((l) => l.href === href));
}

export function getLessonNeighbors(href: string): {
  previous?: Lesson;
  next?: Lesson;
} {
  const index = ALL_LESSONS.findIndex((l) => l.href === href);
  if (index === -1) return {};
  return {
    previous: index > 0 ? ALL_LESSONS[index - 1] : undefined,
    next: index < ALL_LESSONS.length - 1 ? ALL_LESSONS[index + 1] : undefined,
  };
}
