import type { ContentSource } from "./source";
export type { ContentSource } from "./source";

export interface GlossaryEntry {
  term: string;

  aliases?: string[];
  definition: string;

  layer?: 1 | 2 | 3 | 4 | 7;
  example?: string;

  lesson?: string;
  related?: string[];
  source: ContentSource;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "TTL",
    aliases: ["Time to Live", "tempo de vida"],
    definition:
      "Campo do cabeçalho IPv4 que limita quantos roteadores um pacote pode atravessar; cada roteador o decrementa em 1 e descarta o pacote ao chegar a zero.",
    layer: 3,
    example: "Um pacote com TTL 64 é descartado após 64 saltos.",
    lesson: "/curso/roteamento-ip/fundamentos",
    related: ["Pacote", "Roteador"],
    source: "complementar",
  },
  {
    term: "Endereço MAC",
    aliases: ["MAC", "endereço físico"],
    definition:
      "Identificador de 48 bits gravado na interface de rede, usado para entregar quadros dentro do mesmo segmento de camada 2.",
    layer: 2,
    example: "00:1a:2b:3c:4d:5e",
    lesson: "/curso/comutacao/mac",
    related: ["Quadro", "Tabela CAM"],
    source: "complementar",
  },
  {
    term: "Tabela CAM",
    aliases: ["CAM", "MAC address table", "tabela de endereços MAC"],
    definition:
      "Tabela em que o switch registra qual endereço MAC foi visto em qual porta, aprendida a partir do MAC de origem dos quadros recebidos.",
    layer: 2,
    example: "00:1a:2b:3c:4d:5e → Fa0/1",
    lesson: "/curso/comutacao/cam",
    related: ["Switch", "Inundação"],
    source: "complementar",
  },
  {
    term: "Inundação",
    aliases: ["flooding"],
    definition:
      "Encaminhamento de um quadro por todas as portas do switch exceto a de entrada, usado quando o MAC de destino ainda não está na tabela CAM.",
    layer: 2,
    lesson: "/curso/comutacao/cam",
    related: ["Tabela CAM", "Domínio de broadcast"],
    source: "complementar",
  },
  {
    term: "VLAN",
    aliases: ["rede local virtual", "virtual LAN"],
    definition:
      "Segmentação lógica de um switch em vários domínios de broadcast independentes, sem exigir equipamentos físicos separados.",
    layer: 2,
    example: "VLAN 10 para Vendas, VLAN 20 para Engenharia.",
    lesson: "/curso/comutacao/vlan",
    related: ["IEEE 802.1Q", "Trunk", "Porta de acesso"],
    source: "complementar",
  },
  {
    term: "IEEE 802.1Q",
    aliases: ["802.1Q", "dot1q", "tagging", "marcação"],
    definition:
      "Padrão que insere uma marcação de 4 bytes no quadro Ethernet para identificar a qual VLAN ele pertence ao atravessar um trunk.",
    layer: 2,
    lesson: "/curso/comutacao/vlan",
    related: ["VLAN", "Trunk", "VLAN nativa"],
    source: "complementar",
  },
  {
    term: "Trunk",
    aliases: ["tronco", "porta trunk"],
    definition:
      "Enlace entre equipamentos que transporta o tráfego de várias VLANs, identificando cada quadro pela marcação 802.1Q.",
    layer: 2,
    lesson: "/curso/comutacao/vlan",
    related: ["VLAN", "IEEE 802.1Q", "Porta de acesso"],
    source: "complementar",
  },
  {
    term: "Porta de acesso",
    aliases: ["access port"],
    definition:
      "Porta do switch que pertence a uma única VLAN e entrega quadros sem marcação ao dispositivo final.",
    layer: 2,
    lesson: "/curso/comutacao/vlan",
    related: ["Trunk", "VLAN"],
    source: "complementar",
  },
  {
    term: "VLAN nativa",
    aliases: ["native VLAN"],
    definition:
      "VLAN cujo tráfego atravessa o trunk sem marcação; precisa ser a mesma nas duas pontas do enlace.",
    layer: 2,
    lesson: "/curso/comutacao/vlan",
    related: ["Trunk", "IEEE 802.1Q"],
    source: "complementar",
  },
  {
    term: "Quadro",
    aliases: ["frame"],
    definition:
      "Unidade de dados da camada 2, endereçada por MAC e válida apenas dentro do segmento local.",
    layer: 2,
    lesson: "/curso/comutacao/ethernet",
    related: ["Pacote", "Ethernet"],
    source: "complementar",
  },
  {
    term: "Pacote",
    aliases: ["packet", "datagrama"],
    definition:
      "Unidade de dados da camada 3, endereçada por IP e capaz de atravessar redes distintas.",
    layer: 3,
    lesson: "/curso/roteamento-ip/fundamentos",
    related: ["Quadro", "TTL"],
    source: "complementar",
  },
  {
    term: "Ethernet",
    aliases: ["IEEE 802.3", "802.3"],
    definition:
      "Conjunto de padrões de camada física e de enlace para redes locais cabeadas, normatizado pelo IEEE 802.3.",
    layer: 2,
    lesson: "/curso/comutacao/ethernet",
    related: ["Quadro", "Domínio de colisão"],
    source: "complementar",
  },
  {
    term: "Domínio de colisão",
    definition:
      "Conjunto de dispositivos que disputam o mesmo meio de transmissão; cada porta de switch cria um domínio de colisão separado.",
    layer: 1,
    lesson: "/curso/comutacao/colisoes",
    related: ["Domínio de broadcast", "Ethernet"],
    source: "complementar",
  },
  {
    term: "Domínio de broadcast",
    definition:
      "Conjunto de dispositivos que recebem um quadro de broadcast enviado por qualquer um deles; é delimitado por roteadores e por VLANs.",
    layer: 2,
    lesson: "/curso/comutacao/colisoes",
    related: ["Domínio de colisão", "VLAN", "Roteador"],
    source: "complementar",
  },
  {
    term: "Switch",
    aliases: ["comutador"],
    definition:
      "Equipamento de camada 2 que encaminha quadros porta a porta com base na tabela CAM, segmentando domínios de colisão.",
    layer: 2,
    lesson: "/curso/ativos/equipamentos",
    related: ["Tabela CAM", "Roteador"],
    source: "complementar",
  },
  {
    term: "Roteador",
    aliases: ["router"],
    definition:
      "Equipamento de camada 3 que encaminha pacotes entre redes distintas consultando a tabela de roteamento.",
    layer: 3,
    lesson: "/curso/ativos/equipamentos",
    related: ["Tabela de roteamento", "Switch"],
    source: "complementar",
  },
  {
    term: "Tabela de roteamento",
    aliases: ["routing table"],
    definition:
      "Lista de redes de destino conhecidas pelo roteador, com máscara, next-hop e interface de saída.",
    layer: 3,
    lesson: "/curso/roteamento-ip/fundamentos",
    related: ["Prefixo mais longo", "Rota padrão"],
    source: "complementar",
  },
  {
    term: "Prefixo mais longo",
    aliases: ["longest prefix match", "LPM"],
    definition:
      "Regra de seleção de rota: entre as entradas que casam com o destino, vence a de máscara mais específica.",
    layer: 3,
    example: "Para 10.1.1.5, 10.1.1.0/24 vence 10.0.0.0/8.",
    lesson: "/curso/roteamento-ip/fundamentos",
    related: ["Tabela de roteamento", "Distância administrativa"],
    source: "complementar",
  },
  {
    term: "Distância administrativa",
    aliases: ["AD", "administrative distance"],
    definition:
      "Grau de confiabilidade atribuído à origem de uma rota; usada como critério de desempate quando dois protocolos anunciam o mesmo prefixo.",
    layer: 3,
    lesson: "/curso/roteamento-ip/dinamico",
    related: ["Métrica", "Prefixo mais longo"],
    source: "complementar",
  },
  {
    term: "Métrica",
    definition:
      "Custo que um protocolo de roteamento atribui a um caminho; no RIP, a métrica é a contagem de saltos.",
    layer: 3,
    lesson: "/curso/roteamento-ip/rip",
    related: ["RIP", "Distância administrativa"],
    source: "complementar",
  },
  {
    term: "Rota padrão",
    aliases: ["default route", "0.0.0.0/0"],
    definition:
      "Rota que casa com qualquer destino e é usada quando nenhuma entrada mais específica existe na tabela.",
    layer: 3,
    example: "0.0.0.0/0 via 203.0.113.1",
    lesson: "/curso/roteamento-ip/estatico",
    related: ["Tabela de roteamento", "Prefixo mais longo"],
    source: "complementar",
  },
  {
    term: "RIP",
    aliases: ["Routing Information Protocol"],
    definition:
      "Protocolo de roteamento dinâmico por vetor de distância que usa contagem de saltos como métrica e trata 16 saltos como inalcançável.",
    layer: 3,
    lesson: "/curso/roteamento-ip/rip",
    related: ["Métrica", "Split horizon", "Convergência"],
    source: "complementar",
  },
  {
    term: "Split horizon",
    aliases: ["horizonte dividido"],
    definition:
      "Regra que impede um roteador de anunciar uma rota de volta pela interface por onde a aprendeu, reduzindo laços de roteamento.",
    layer: 3,
    lesson: "/curso/roteamento-ip/rip",
    related: ["RIP", "Contagem ao infinito"],
    source: "complementar",
  },
  {
    term: "Contagem ao infinito",
    aliases: ["count to infinity"],
    definition:
      "Falha dos protocolos por vetor de distância em que a métrica de uma rota inválida cresce indefinidamente; no RIP é limitada pelo teto de 16 saltos.",
    layer: 3,
    lesson: "/curso/roteamento-ip/rip",
    related: ["RIP", "Split horizon"],
    source: "complementar",
  },
  {
    term: "Roteamento dinâmico",
    aliases: ["protocolo de roteamento dinâmico"],
    definition:
      "Uso de protocolos que fazem os roteadores trocarem informação de alcançabilidade entre si, montando e mantendo as tabelas automaticamente conforme a topologia muda.",
    layer: 3,
    example: "RIP, por vetor de distância; OSPF, por estado de enlace.",
    lesson: "/curso/roteamento-ip/dinamico",
    related: ["Convergência", "RIP", "Tabela de roteamento"],
    source: "complementar",
  },
  {
    term: "Convergência",
    definition:
      "Estado em que todos os roteadores de um domínio compartilham uma visão consistente da topologia após uma mudança.",
    layer: 3,
    lesson: "/curso/roteamento-ip/rip",
    related: ["RIP", "Roteamento dinâmico"],
    source: "complementar",
  },
  {
    term: "CIDR",
    aliases: ["Classless Inter-Domain Routing", "classless"],
    definition:
      "Endereçamento sem classes, em que o limite entre rede e host é indicado por um prefixo explícito em vez da classe do endereço.",
    layer: 3,
    example: "192.168.10.0/26",
    lesson: "/curso/roteamento-ip/classful-classless",
    related: ["Máscara de sub-rede", "VLSM"],
    source: "complementar",
  },
  {
    term: "Máscara de sub-rede",
    aliases: ["subnet mask", "netmask"],
    definition:
      "Sequência de bits que separa a porção de rede da porção de host em um endereço IPv4.",
    layer: 3,
    example: "/26 equivale a 255.255.255.192",
    lesson: "/curso/roteamento-ip/classful-classless",
    related: ["CIDR", "Curinga"],
    source: "complementar",
  },
  {
    term: "Curinga",
    aliases: ["wildcard", "máscara curinga"],
    definition:
      "Complemento bit a bit da máscara de sub-rede, usado em listas de controle de acesso e em anúncios de protocolos de roteamento.",
    layer: 3,
    example: "Máscara 255.255.255.192 → curinga 0.0.0.63",
    lesson: "/curso/roteamento-ip/classful-classless",
    related: ["Máscara de sub-rede"],
    source: "complementar",
  },
  {
    term: "VLSM",
    aliases: ["Variable Length Subnet Mask", "máscara de tamanho variável"],
    definition:
      "Técnica de dividir um bloco em sub-redes de tamanhos diferentes, dimensionando cada uma conforme a quantidade de hosts necessária.",
    layer: 3,
    lesson: "/curso/roteamento-ip/classful-classless",
    related: ["CIDR", "Máscara de sub-rede"],
    source: "complementar",
  },
  {
    term: "Store-and-forward",
    definition:
      "Método de encaminhamento em que o switch recebe o quadro inteiro e confere o FCS antes de encaminhá-lo.",
    layer: 2,
    lesson: "/curso/comutacao/metodos",
    related: ["Cut-through", "Fragment-free"],
    source: "complementar",
  },
  {
    term: "Cut-through",
    definition:
      "Método de encaminhamento em que o switch começa a transmitir assim que lê o MAC de destino, sem verificar o quadro inteiro.",
    layer: 2,
    lesson: "/curso/comutacao/metodos",
    related: ["Store-and-forward", "Fragment-free"],
    source: "complementar",
  },
  {
    term: "Fragment-free",
    definition:
      "Método intermediário em que o switch lê os primeiros 64 bytes do quadro antes de encaminhar, faixa em que ocorre a maioria das colisões.",
    layer: 2,
    lesson: "/curso/comutacao/metodos",
    related: ["Store-and-forward", "Cut-through"],
    source: "complementar",
  },
  {
    term: "SSID",
    aliases: ["Service Set Identifier", "nome da rede"],
    definition:
      "Nome que identifica uma rede sem fio e é anunciado pelo ponto de acesso.",
    lesson: "/curso/redes-sem-fio/configuracao",
    related: ["Ponto de acesso"],
    source: "complementar",
  },
  {
    term: "Ponto de acesso",
    aliases: ["AP", "access point"],
    definition:
      "Equipamento que conecta clientes sem fio à rede cabeada, atuando como ponte entre o meio sem fio e o meio físico.",
    layer: 2,
    lesson: "/curso/redes-sem-fio/configuracao",
    related: ["SSID"],
    source: "complementar",
  },
];
