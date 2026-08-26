export interface SyllabusSection {
  code: string;
  title: string;

  lesson?: string;
}

export const SYLLABUS: SyllabusSection[] = [
  { code: "1", title: "Roteamento IP" },
  { code: "1.1", title: "Fundamentos do processo de roteamento", lesson: "/curso/roteamento-ip/fundamentos" },
  { code: "1.2", title: "Roteamento estático", lesson: "/curso/roteamento-ip/estatico" },
  { code: "1.3", title: "Roteamento dinâmico", lesson: "/curso/roteamento-ip/dinamico" },
  { code: "1.4", title: "Conceitos Classful e Classless", lesson: "/curso/roteamento-ip/classful-classless" },
  { code: "1.5", title: "RIP", lesson: "/curso/roteamento-ip/rip" },

  { code: "2", title: "Interfaces GUI e CLI para ativos de rede", lesson: "/curso/interfaces/gui-cli" },
  { code: "3", title: "Analisadores de protocolos", lesson: "/curso/analisadores/captura" },
  { code: "4", title: "Funcionamento e características dos ativos de rede", lesson: "/curso/ativos/equipamentos" },

  { code: "5", title: "Conceitos de comutação" },
  { code: "5.1", title: "MAC", lesson: "/curso/comutacao/mac" },
  { code: "5.2", title: "Domínios de colisão e broadcast", lesson: "/curso/comutacao/colisoes" },
  { code: "5.3", title: "Comutação e tabela CAM", lesson: "/curso/comutacao/cam" },
  { code: "5.4", title: "Métodos de encaminhamento", lesson: "/curso/comutacao/metodos" },
  { code: "5.5", title: "Configuração básica de switch", lesson: "/curso/comutacao/configuracao" },
  { code: "5.6", title: "Ethernet e IEEE 802.3", lesson: "/curso/comutacao/ethernet" },
  { code: "5.7", title: "Principais elementos de rede", lesson: "/curso/comutacao/elementos" },
  { code: "5.8", title: "VLANs e IEEE 802.1Q", lesson: "/curso/comutacao/vlan" },

  { code: "6", title: "Redes sem fio" },
  { code: "6.1", title: "Configuração", lesson: "/curso/redes-sem-fio/configuracao" },
  { code: "6.2", title: "WEP, WPA, WPA2, WPA3 e IEEE 802.11i", lesson: "/curso/redes-sem-fio/seguranca" },

  { code: "7", title: "Glossário e referências", lesson: "/glossario" },
];

export const SYLLABUS_LEAVES = SYLLABUS.filter((s) => s.lesson !== undefined);

function getSection(code: string): SyllabusSection | undefined {
  return SYLLABUS.find((s) => s.code === code);
}

export function sectionLabel(code: string): string {
  const s = getSection(code);
  return s ? `${s.code} ${s.title}` : code;
}
