import type { ExpectedRoute } from "@/lib/net/cisco";
import type { ContentSource } from "./source";

export type LabTask =
  | {
      kind: "choice";
      id: string;
      prompt: string;
      options: Array<{ id: string; label: string; correct: boolean; why: string }>;
    }
  | {
      kind: "multi";
      id: string;
      prompt: string;
      help?: string;
      options: Array<{ id: string; label: string; correct: boolean; why: string }>;
    }
  | {
      kind: "input";
      id: string;
      prompt: string;

      answers: string[];
      placeholder?: string;
      why: string;
    }
  | {
      kind: "comando-rota";
      id: string;
      prompt: string;
      placeholder?: string;
      expected: ExpectedRoute;
      why: string;
    }
  | {
      kind: "vlsm";
      id: string;
      prompt: string;
      block: string;
      requirements: Array<{ id: string; label: string; hosts: number }>;
    };

export interface LabDefinition {
  href: string;

  builder?: boolean;
  objective: string;
  scenario: string;
  topology: "roteamento" | "vlsm" | "rip" | "switching" | "vlan" | "wireless";
  tasks: LabTask[];

  conclusion: string[];
  source: ContentSource;
}

export const LAB_DEFINITIONS: LabDefinition[] = [
  {
    href: "/laboratorios/roteamento",
    source: "complementar",
    objective:
      "Escrever as rotas estáticas que ligam duas LANs através de dois roteadores, nos dois sentidos.",
    scenario:
      "R1 tem a LAN 192.168.1.0/24 em Gi0/1 e o enlace 10.0.12.0/30 em Gi0/0, com o endereço 10.0.12.1. R2 tem a LAN 192.168.3.0/24 em Gi0/1 e o outro lado do enlace, 10.0.12.2, em Gi0/0. Nenhum protocolo dinâmico está habilitado.",
    topology: "roteamento",
    tasks: [
      {
        kind: "comando-rota",
        id: "rota-r1",
        prompt:
          "Qual comando em R1 cria a rota para a LAN de R2? Escreva o comando completo do modo de configuração global.",
        placeholder: "ip route ...",
        expected: {
          destination: "192.168.3.0/24",
          nextHop: "10.0.12.2",
          exitInterfaces: ["Gi0/0", "GigabitEthernet0/0"],
        },
        why: "A rede de destino é 192.168.3.0 com máscara 255.255.255.0, e o próximo salto é o endereço de R2 no enlace: 10.0.12.2.",
      },
      {
        kind: "choice",
        id: "so-um-lado",
        prompt:
          "Você configurou apenas essa rota em R1 e testou um ping de um host da LAN de R1 para um host da LAN de R2. O que acontece?",
        options: [
          {
            id: "a",
            label: "O ping funciona normalmente.",
            correct: false,
            why: "A requisição chega, mas a resposta precisa voltar, e R2 ainda não sabe como alcançar 192.168.1.0/24.",
          },
          {
            id: "b",
            label:
              "A requisição chega ao destino, mas a resposta não volta: falta a rota inversa em R2.",
            correct: true,
            why: "Roteamento é por sentido. Cada roteador precisa saber alcançar a rede de destino do pacote que está encaminhando, inclusive o pacote de resposta.",
          },
          {
            id: "c",
            label: "R1 descarta o pacote imediatamente.",
            correct: false,
            why: "R1 tem a rota e encaminha normalmente; o problema aparece no caminho de volta.",
          },
        ],
      },
      {
        kind: "comando-rota",
        id: "rota-r2",
        prompt: "Qual comando em R2 resolve o problema?",
        placeholder: "ip route ...",
        expected: {
          destination: "192.168.1.0/24",
          nextHop: "10.0.12.1",
          exitInterfaces: ["Gi0/0", "GigabitEthernet0/0"],
        },
        why: "Simétrico ao de R1: rede 192.168.1.0/24 pelo próximo salto 10.0.12.1, que é o endereço de R1 no enlace.",
      },
      {
        kind: "choice",
        id: "verificacao",
        prompt: "Qual comando exibe a tabela de roteamento para conferir o resultado?",
        options: [
          { id: "a", label: "show ip route", correct: true, why: "É o comando que lista as redes conhecidas, a origem de cada rota, a distância administrativa, a métrica, o próximo salto e a interface de saída." },
          { id: "b", label: "show running-config", correct: false, why: "Mostra a configuração aplicada, não o que efetivamente entrou na tabela de roteamento. Uma rota configurada pode não estar instalada." },
          { id: "c", label: "show interfaces", correct: false, why: "Mostra o estado das interfaces, útil para diagnosticar o enlace, mas não a tabela de roteamento." },
        ],
      },
    ],
    conclusion: [
      "Rota estática exige configuração nos dois sentidos: uma rota só resolve o caminho de ida.",
      "O próximo salto de uma rota estática é sempre um endereço na rede diretamente conectada ao roteador que a executa.",
      "Configurar não é o mesmo que instalar: confirme sempre com show ip route.",
    ],
  },

  {
    href: "/laboratorios/vlsm",
    source: "complementar",
    objective:
      "Dividir um único bloco /24 entre quatro LANs e dois enlaces WAN sem sobrepor sub-redes nem desperdiçar espaço.",
    scenario:
      "A empresa recebeu o bloco 192.168.10.0/24 e precisa endereçar quatro LANs de tamanhos diferentes e dois enlaces ponto a ponto entre roteadores. Não há outro bloco disponível.",
    topology: "vlsm",
    tasks: [
      {
        kind: "choice",
        id: "ordem",
        prompt: "Por onde começar a alocação?",
        options: [
          {
            id: "a",
            label: "Pela sub-rede que precisa de mais hosts.",
            correct: true,
            why: "Alocar da maior para a menor mantém os blocos alinhados e evita fragmentar o espaço. É o que torna o VLSM eficiente.",
          },
          {
            id: "b",
            label: "Pela ordem em que as sub-redes aparecem no requisito.",
            correct: false,
            why: "A ordem do enunciado é arbitrária. Alocar fora de ordem de tamanho cria buracos que impedem blocos maiores de caber depois.",
          },
          {
            id: "c",
            label: "Pelos enlaces WAN, que são os menores.",
            correct: false,
            why: "Começar pelos menores empurra as maiores para o fim do bloco, onde já não há espaço contíguo suficiente.",
          },
        ],
      },
      {
        kind: "vlsm",
        id: "alocacao",
        prompt:
          "Aloque as seis sub-redes dentro de 192.168.10.0/24. Informe o endereço de rede e o prefixo de cada uma.",
        block: "192.168.10.0/24",
        requirements: [
          { id: "lan-a", label: "LAN A", hosts: 60 },
          { id: "lan-b", label: "LAN B", hosts: 28 },
          { id: "lan-c", label: "LAN C", hosts: 12 },
          { id: "lan-d", label: "LAN D", hosts: 10 },
          { id: "wan-1", label: "WAN 1", hosts: 2 },
          { id: "wan-2", label: "WAN 2", hosts: 2 },
        ],
      },
      {
        kind: "input",
        id: "prefixo-wan",
        prompt:
          "Que prefixo atende um enlace ponto a ponto com exatamente 2 hosts, pela regra 2^h − 2?",
        placeholder: "/30",
        answers: ["/30", "30", "255.255.255.252"],
        why: "Com 2 bits de host há 4 endereços: um de rede, um de broadcast e dois utilizáveis. É o menor bloco que ainda reserva rede e broadcast.",
      },
    ],
    conclusion: [
      "Alocar da maior demanda para a menor é parte do método, não uma preferência.",
      "Toda sub-rede começa num múltiplo do próprio tamanho, e é isso que evita sobreposição.",
      "Um enlace ponto a ponto com /30 tem desperdício zero pela regra clássica.",
    ],
  },

  {
    href: "/laboratorios/rip",
    source: "complementar",
    objective:
      "Prever o comportamento do RIP durante a convergência e explicar o papel do split horizon.",
    scenario:
      "Três roteadores em linha: R1 — R2 — R3. R1 tem a LAN 192.168.1.0/24 e R3 tem a LAN 192.168.3.0/24, e os enlaces entre roteadores são /30, ou seja, há VLSM na topologia. O RIP está habilitado em todos, com split horizon ativo e temporizadores no padrão.",
    topology: "rip",
    tasks: [
      {
        kind: "input",
        id: "metrica",
        prompt:
          "Depois da convergência, com que métrica R1 conhece a rede 192.168.3.0/24?",
        placeholder: "número de saltos",
        answers: ["2", "2 saltos", "dois"],
        why: "R2 é vizinho direto da LAN de R3 e a anuncia com 1 salto. R1 recebe esse anúncio e soma 1: chega a 2.",
      },
      {
        kind: "choice",
        id: "infinito",
        prompt: "O que significa uma rota com métrica 16 no RIP?",
        options: [
          { id: "a", label: "A rota está a 16 saltos de distância.", correct: false, why: "16 nunca é uma distância válida no RIP: o máximo utilizável é 15." },
          { id: "b", label: "A rede é inalcançável.", correct: true, why: "O RIP usa 16 como infinito. É esse teto que impede a contagem ao infinito de crescer sem limite quando um enlace cai." },
          { id: "c", label: "A rota tem prioridade máxima.", correct: false, why: "No RIP, métrica menor é melhor, e 16 é o pior valor possível." },
        ],
      },
      {
        kind: "choice",
        id: "split",
        prompt: "O que o split horizon impede?",
        options: [
          {
            id: "a",
            label:
              "Que um roteador anuncie uma rota de volta pela mesma interface por onde a aprendeu.",
            correct: true,
            why: "Sem essa regra, R2 devolveria a R1 a rota que R1 lhe ensinou, e os dois passariam a se apoiar mutuamente numa rota que já não existe.",
          },
          { id: "b", label: "Que a métrica ultrapasse 15 saltos.", correct: false, why: "Quem faz isso é o teto de 16; o split horizon age antes, evitando o laço que faria a métrica subir." },
          { id: "c", label: "Que dois roteadores anunciem ao mesmo tempo.", correct: false, why: "Os anúncios são periódicos e simultâneos por desenho; não é isso que o split horizon controla." },
        ],
      },
      {
        kind: "choice",
        id: "poison-reverse",
        prompt:
          "Qual é a diferença entre split horizon simples e split horizon com poison reverse?",
        options: [
          {
            id: "a",
            label:
              "O simples omite a rota; o poison reverse a anuncia de volta com métrica 16.",
            correct: true,
            why: "Um resolve por silêncio, o outro por afirmação explícita. O poison reverse elimina a ambiguidade de não anunciar, ao custo de mais tráfego de atualização.",
          },
          {
            id: "b",
            label: "O poison reverse desliga o split horizon.",
            correct: false,
            why: "Ele complementa o split horizon, não o substitui, e daí o nome composto.",
          },
          {
            id: "c",
            label: "São nomes diferentes para o mesmo mecanismo.",
            correct: false,
            why: "O comportamento na rede é distinto: um deixa de anunciar, o outro anuncia com métrica de infinito.",
          },
        ],
      },
      {
        kind: "input",
        id: "timer-update",
        prompt:
          "De quantos em quantos segundos o RIP envia seus anúncios periódicos, no valor padrão?",
        placeholder: "segundos",
        answers: ["30", "30s", "30 s", "30 segundos"],
        why: "O temporizador de update é de 30 segundos, tanto na RFC 2453 quanto na implementação Cisco. Uma rota que fica 180 segundos sem notícia (temporizador invalid) é marcada como inalcançável.",
      },
      {
        kind: "choice",
        id: "holddown",
        prompt: "Para que serve o temporizador de holddown?",
        options: [
          {
            id: "a",
            label:
              "Recusar informação nova sobre uma rota recém-caída, enquanto a notícia da queda se propaga.",
            correct: true,
            why: "Sem ele, uma atualização antiga ainda em trânsito poderia reinstalar uma rota que já não existe. É um mecanismo da implementação Cisco, não da RFC 2453.",
          },
          {
            id: "b",
            label: "Definir de quanto em quanto tempo os anúncios são enviados.",
            correct: false,
            why: "Isso é o temporizador de update, de 30 segundos.",
          },
          {
            id: "c",
            label: "Remover a rota da tabela definitivamente.",
            correct: false,
            why: "A remoção é feita pelo temporizador de flush, ou garbage-collection.",
          },
        ],
      },
      {
        kind: "choice",
        id: "versao",
        prompt:
          "A topologia usa VLSM. Qual versão do RIP precisa estar configurada e por quê?",
        options: [
          {
            id: "a",
            label: "RIPv1, porque é mais simples.",
            correct: false,
            why: "O RIPv1 é classful e não carrega a máscara nos anúncios; o vizinho teria de deduzi-la pela classe, o que quebra com sub-redes de tamanhos diferentes.",
          },
          {
            id: "b",
            label: "RIPv2, porque envia a máscara junto com a rede.",
            correct: true,
            why: "O RIPv2 é classless. Junto com no auto-summary, é o mínimo para o RIP operar com VLSM. Ele também usa multicast 224.0.0.9 em vez de broadcast.",
          },
          {
            id: "c",
            label: "RIPng, porque é a versão mais recente.",
            correct: false,
            why: "O RIPng (RFC 2080) é a versão para IPv6. Esta topologia é IPv4.",
          },
        ],
      },
      {
        kind: "multi",
        id: "queda",
        prompt:
          "O enlace R2–R3 cai. Quais afirmações sobre o que acontece em seguida estão corretas?",
        help: "Marque todas as que se aplicam.",
        options: [
          { id: "a", label: "R2 perde a rede conectada 10.0.23.0/30.", correct: true, why: "A rede do enlace só existe enquanto o enlace está ativo." },
          { id: "b", label: "R1 deixa de alcançar 192.168.3.0/24.", correct: true, why: "O único caminho até a LAN de R3 passava por esse enlace." },
          { id: "c", label: "R1 mantém a rota para sempre, porque já a aprendeu.", correct: false, why: "Rotas aprendidas por RIP expiram e são retiradas quando deixam de ser anunciadas." },
          { id: "d", label: "R1 continua alcançando a própria LAN 192.168.1.0/24.", correct: true, why: "É uma rede diretamente conectada; nada no lado de R3 a afeta." },
        ],
      },
    ],
    conclusion: [
      "A métrica do RIP é a contagem de saltos, e 16 significa inalcançável.",
      "Cinco mecanismos contêm o laço (teto de 16, split horizon, poison reverse, route poisoning e triggered update), e o holddown age depois da queda.",
      "RIPv2 é obrigatório com VLSM, porque envia a máscara no anúncio; RIPv1 é classful.",
      "Os temporizadores (30/180/180/240) precisam ser idênticos em todos os roteadores do domínio.",
      "Redes conectadas não dependem de anúncio: continuam na tabela mesmo quando o resto cai.",
    ],
  },

  {
    href: "/laboratorios/dominios",
    source: "complementar",
    builder: true,
    objective:
      "Contar domínios de colisão e de broadcast em qualquer topologia, sabendo qual equipamento segmenta o quê.",
    scenario:
      "Você começa com um switch e três hosts. Use o construtor acima para acrescentar hubs, switches e roteadores, criar enlaces e observar a contagem mudar em tempo real. Depois responda com base no que observou.",
    topology: "switching",
    tasks: [
      {
        kind: "input",
        id: "hub-colisao",
        prompt:
          "Monte um hub com 4 hosts ligados a ele. Quantos domínios de colisão a topologia tem?",
        placeholder: "número",
        answers: ["1", "um"],
        why: "O hub replica o sinal em todas as portas: todos os hosts disputam o mesmo meio, então os quatro enlaces formam um único domínio de colisão. Trocar o hub por um switch levaria essa contagem para 4.",
      },
      {
        kind: "input",
        id: "switch-colisao",
        prompt:
          "Agora troque o hub por um switch, mantendo os 4 hosts. Quantos domínios de colisão?",
        placeholder: "número",
        answers: ["4", "quatro"],
        why: "Cada porta de switch é um domínio de colisão independente, porque o switch armazena o quadro antes de encaminhá-lo em vez de replicar o sinal.",
      },
      {
        kind: "input",
        id: "roteador-broadcast",
        prompt:
          "Ligue dois switches a um roteador, cada switch com dois hosts. Quantos domínios de broadcast?",
        placeholder: "número",
        answers: ["2", "dois"],
        why: "O roteador não encaminha broadcast de camada 2 entre suas interfaces: cada lado é um domínio. Os switches não separam nada: eles apenas estendem o domínio de cada lado.",
      },
      {
        kind: "choice",
        id: "regra",
        prompt: "Qual regra resume o que você observou?",
        options: [
          {
            id: "a",
            label:
              "Switch segmenta colisão; roteador segmenta broadcast; hub não segmenta nada.",
            correct: true,
            why: "É exatamente o que a contagem mostra em cada montagem. A VLAN é a exceção interessante: ela segmenta broadcast dentro do próprio switch.",
          },
          {
            id: "b",
            label: "Switch e roteador segmentam as duas coisas igualmente.",
            correct: false,
            why: "O switch não separa broadcast: ligue dois switches e monte hosts nos dois, e a contagem de broadcast continua em 1.",
          },
          {
            id: "c",
            label: "O hub segmenta colisão porque tem várias portas.",
            correct: false,
            why: "Quantidade de portas não é o critério. O hub replica o sinal, então todas as portas ficam no mesmo domínio de colisão.",
          },
        ],
      },
    ],
    conclusion: [
      "Cada enlace é um domínio de colisão, exceto onde um hub funde todos os seus.",
      "Só o roteador separa domínios de broadcast; hub e switch deixam o broadcast atravessar.",
      "Contar é aplicar a regra por equipamento, não decorar o resultado de uma topologia específica.",
    ],
  },

  {
    href: "/laboratorios/switching",
    source: "complementar",
    objective:
      "Prever o comportamento de um switch quadro a quadro e conferir contra a tabela CAM resultante.",
    scenario:
      "Um switch recém-ligado, com a tabela CAM vazia, e quatro hosts nas portas Fa0/1 a Fa0/4. PC1 vai enviar um quadro para PC2.",
    topology: "switching",
    tasks: [
      {
        kind: "choice",
        id: "primeiro",
        prompt:
          "PC1 envia o primeiro quadro para PC2. O que o switch faz com esse quadro?",
        options: [
          { id: "a", label: "Encaminha só pela porta Fa0/2.", correct: false, why: "O switch ainda não sabe onde PC2 está: a tabela CAM está vazia." },
          { id: "b", label: "Inunda por todas as portas exceto a de entrada.", correct: true, why: "Destino desconhecido é inundado. É assim que o quadro chega ao destino mesmo antes de o switch aprender onde ele está." },
          { id: "c", label: "Descarta o quadro.", correct: false, why: "Descartar impediria qualquer comunicação inicial; o switch inunda justamente para não descartar." },
        ],
      },
      {
        kind: "choice",
        id: "aprendizado",
        prompt: "Nesse mesmo quadro, o que o switch aprende?",
        options: [
          { id: "a", label: "Que PC2 está em Fa0/2.", correct: false, why: "O switch não aprende com o MAC de destino, e ainda não viu nenhum quadro vindo de PC2." },
          { id: "b", label: "Que PC1 está em Fa0/1.", correct: true, why: "O aprendizado é sempre pelo MAC de origem: o quadro entrou por Fa0/1 trazendo o MAC de PC1." },
          { id: "c", label: "Nada, porque a tabela estava vazia.", correct: false, why: "É exatamente o contrário: a tabela vazia começa a ser preenchida com este quadro." },
        ],
      },
      {
        kind: "choice",
        id: "resposta",
        prompt: "PC2 responde a PC1. O que acontece com o quadro de resposta?",
        options: [
          { id: "a", label: "É encaminhado só por Fa0/1, e o switch aprende PC2 em Fa0/2.", correct: true, why: "O destino PC1 já está na CAM, então há encaminhamento unicast; e o MAC de origem PC2 é aprendido na porta de entrada." },
          { id: "b", label: "É inundado de novo.", correct: false, why: "PC1 já foi aprendido no quadro anterior; não há mais motivo para inundar." },
          { id: "c", label: "É descartado por falta de entrada na CAM.", correct: false, why: "A entrada de PC1 existe desde o primeiro quadro." },
        ],
      },
      {
        kind: "multi",
        id: "broadcast",
        prompt: "Quando um quadro de broadcast é encaminhado por todas as portas da VLAN?",
        help: "Marque todas as que se aplicam.",
        options: [
          { id: "a", label: "Quando o MAC de destino é ff:ff:ff:ff:ff:ff.", correct: true, why: "É o endereço de broadcast: por definição, destina-se a todos os hosts do domínio." },
          { id: "b", label: "Quando o MAC de destino não está na tabela CAM.", correct: true, why: "Destino desconhecido é inundado: o efeito prático é o mesmo, embora o motivo seja diferente." },
          { id: "c", label: "Sempre que a porta de origem é uma porta de acesso.", correct: false, why: "O modo da porta define a qual VLAN o quadro pertence, não se ele será inundado." },
        ],
      },
    ],
    conclusion: [
      "O switch aprende pelo MAC de origem e decide pelo MAC de destino, e são coisas distintas.",
      "Inundar não é falha: é o mecanismo que permite a comunicação antes do aprendizado.",
      "Depois da primeira troca em cada sentido, a comunicação vira unicast.",
    ],
  },

  {
    href: "/laboratorios/vlan",
    source: "complementar",
    objective:
      "Determinar quem se comunica com quem depois de segmentar um switch em VLANs, e o que o trunk acrescenta.",
    scenario:
      "Um switch com quatro portas de acesso: PC1 e PC3 na VLAN 10, PC2 e PC4 na VLAN 20. A porta Gi0/1 é um trunk 802.1Q com as VLANs 10 e 20 permitidas e VLAN nativa 1.",
    topology: "vlan",
    tasks: [
      {
        kind: "multi",
        id: "quem-fala",
        prompt: "Sem nenhum roteador na topologia, quais comunicações funcionam?",
        help: "Marque todas as que funcionam.",
        options: [
          { id: "a", label: "PC1 → PC3", correct: true, why: "Mesma VLAN, mesmo domínio de broadcast: o switch encaminha normalmente." },
          { id: "b", label: "PC2 → PC4", correct: true, why: "Também estão na mesma VLAN (20)." },
          { id: "c", label: "PC1 → PC2", correct: false, why: "VLANs diferentes são domínios de broadcast diferentes. Sem um equipamento de camada 3, não há comunicação entre elas." },
          { id: "d", label: "PC3 → PC4", correct: false, why: "Mesma situação: VLAN 10 e VLAN 20 não se falam em camada 2." },
        ],
      },
      {
        kind: "choice",
        id: "tag",
        prompt:
          "PC1 (VLAN 10) envia um quadro de broadcast. O que sai pela porta trunk Gi0/1?",
        options: [
          { id: "a", label: "O quadro sai marcado com a VLAN 10.", correct: true, why: "O trunk transporta várias VLANs, então precisa identificar a qual cada quadro pertence, e é isso que a marcação 802.1Q faz." },
          { id: "b", label: "O quadro sai sem marcação.", correct: false, why: "Sem marcação, o switch do outro lado não saberia em qual VLAN entregar o quadro. Só a VLAN nativa sai sem marcação." },
          { id: "c", label: "Nada sai: broadcast não atravessa trunk.", correct: false, why: "Broadcast atravessa o trunk normalmente, restrito à sua própria VLAN." },
        ],
      },
      {
        kind: "choice",
        id: "nativa",
        prompt: "O que caracteriza a VLAN nativa de um trunk?",
        options: [
          { id: "a", label: "É a VLAN cujo tráfego atravessa o trunk sem marcação.", correct: true, why: "Por isso ela precisa coincidir nas duas pontas: se divergir, o tráfego não marcado é interpretado como pertencente a VLANs diferentes em cada lado." },
          { id: "b", label: "É a VLAN com mais portas de acesso.", correct: false, why: "A quantidade de portas não define a VLAN nativa; ela é configurada explicitamente no trunk." },
          { id: "c", label: "É sempre a VLAN 10.", correct: false, why: "O padrão de fábrica costuma ser a VLAN 1, e o valor é configurável." },
        ],
      },
      {
        kind: "input",
        id: "faixa",
        prompt: "Qual é o maior identificador de VLAN válido em 802.1Q?",
        placeholder: "número",
        answers: ["4094", "vlan 4094"],
        why: "O campo de identificação tem 12 bits, o que daria 0 a 4095; os valores 0 e 4095 são reservados, restando a faixa utilizável de 1 a 4094.",
      },
    ],
    conclusion: [
      "VLAN separa domínios de broadcast dentro do mesmo switch físico.",
      "Comunicação entre VLANs exige camada 3, e não é o switch de acesso que faz isso.",
      "O trunk marca o quadro para preservar a identidade da VLAN entre equipamentos; a VLAN nativa é a exceção que trafega sem marcação.",
    ],
  },

  {
    href: "/laboratorios/wireless",
    source: "complementar",
    objective:
      "Configurar um ponto de acesso de forma consciente e escolher o mecanismo de segurança adequado.",
    scenario:
      "Um ponto de acesso novo será instalado em um laboratório com equipamentos de fabricação recente. É preciso definir SSID, canal e segurança.",
    topology: "wireless",
    tasks: [
      {
        kind: "choice",
        id: "seguranca",
        prompt:
          "Todos os clientes são recentes e suportam qualquer mecanismo. Qual escolher?",
        options: [
          { id: "a", label: "WEP", correct: false, why: "O WEP tem falhas conhecidas no uso do vetor de inicialização que permitem a recuperação da chave; está obsoleto e não deve ser usado." },
          { id: "b", label: "WPA com TKIP", correct: false, why: "O WPA com TKIP foi um passo intermediário para permitir atualização de hardware antigo; também já é considerado superado." },
          { id: "c", label: "WPA3", correct: true, why: "É o mecanismo mais recente da série e o indicado quando todos os clientes o suportam. Se algum cliente antigo não suportar, o WPA2 com AES é o piso aceitável." },
          { id: "d", label: "Rede aberta com portal", correct: false, why: "Rede aberta não cifra o enlace: qualquer um no alcance lê o tráfego não protegido por outra camada." },
        ],
      },
      {
        kind: "choice",
        id: "ieee",
        prompt: "Qual padrão do IEEE define os mecanismos de segurança que deram origem ao WPA2?",
        options: [
          { id: "a", label: "IEEE 802.11i", correct: true, why: "É a emenda de segurança do 802.11; o WPA2 é a certificação da Wi-Fi Alliance baseada nela." },
          { id: "b", label: "IEEE 802.1Q", correct: false, why: "802.1Q é marcação de VLAN em redes cabeadas, sem relação com segurança sem fio." },
          { id: "c", label: "IEEE 802.3", correct: false, why: "802.3 é Ethernet, o padrão da rede cabeada." },
        ],
      },
      {
        kind: "multi",
        id: "ssid",
        prompt: "Sobre a configuração do SSID, o que é correto?",
        help: "Marque todas as que se aplicam.",
        options: [
          { id: "a", label: "O SSID identifica a rede sem fio para os clientes.", correct: true, why: "É o nome anunciado nos quadros de beacon." },
          { id: "b", label: "Ocultar o SSID torna a rede segura.", correct: false, why: "O SSID oculto continua visível em quadros de associação; é obscuridade, não segurança. A proteção vem da cifragem." },
          { id: "c", label: "Dois pontos de acesso podem usar o mesmo SSID para cobrir uma área maior.", correct: true, why: "É como funciona a itinerância entre APs de uma mesma rede." },
        ],
      },
      {
        kind: "choice",
        id: "canal",
        prompt:
          "Na faixa de 2,4 GHz, por que costuma-se escolher entre os canais 1, 6 e 11?",
        options: [
          { id: "a", label: "São os únicos permitidos no Brasil.", correct: false, why: "A faixa tem mais canais disponíveis; a restrição é técnica, não regulatória." },
          { id: "b", label: "São os que não se sobrepõem entre si.", correct: true, why: "Cada canal ocupa uma largura maior que o espaçamento entre canais vizinhos. 1, 6 e 11 são suficientemente afastados para não interferirem." },
          { id: "c", label: "São os mais rápidos.", correct: false, why: "A velocidade não depende do número do canal, e sim da largura de banda, do padrão e das condições do meio." },
        ],
      },
    ],
    conclusion: [
      "Escolher o mecanismo de segurança é escolher o mais recente que todos os clientes suportam.",
      "Ocultar o SSID não substitui cifragem.",
      "Canais que não se sobrepõem reduzem interferência entre pontos de acesso vizinhos.",
    ],
  },
];

export function getLabDefinition(href: string): LabDefinition | undefined {
  return LAB_DEFINITIONS.find((l) => l.href === href);
}
