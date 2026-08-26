import type { LessonContent } from "./types";

export const ROTEAMENTO_LESSONS: LessonContent[] = [
  {
    href: "/curso/roteamento-ip/fundamentos",
    source: "complementar",
    references: ["RFC 791 (IPv4)", "RFC 1812 (requisitos para roteadores IPv4)"],
    whatIs:
      "Roteamento é a decisão que um equipamento de camada 3 toma para cada pacote: por qual interface ele sai e para qual próximo salto é entregue, de modo a chegar a uma rede que não é a sua.",
    whyExists:
      "Um switch resolve a entrega dentro de um mesmo segmento, usando endereços MAC que só têm significado local. Assim que o destino está em outra rede, o MAC não ajuda mais: é preciso alguém que entenda o endereço IP, saiba quais redes existem além dele e escolha um caminho. Esse alguém é o roteador.",
    sections: [
      {
        kind: "prose",
        title: "Como o roteador decide",
        paragraphs: [
          "Quando um pacote chega, o roteador lê o endereço IP de destino e compara com cada entrada da tabela de roteamento. Comparar significa aplicar a máscara da entrada ao endereço de destino e verificar se o resultado é igual ao endereço de rede daquela entrada.",
          "Várias entradas podem casar ao mesmo tempo. Uma rota para 10.0.0.0/8 e outra para 10.1.1.0/24 ambas contêm o endereço 10.1.1.5. O critério de desempate é o prefixo mais longo: vence a entrada com a máscara mais específica, porque ela representa conhecimento mais preciso sobre onde o destino está.",
          "Só depois de resolver o prefixo é que entram os outros critérios. Se duas entradas têm o mesmo prefixo mas vieram de origens diferentes (uma rota estática e uma aprendida por RIP, por exemplo), o roteador compara a distância administrativa, que é o grau de confiança atribuído a cada origem. Persistindo o empate dentro do mesmo protocolo, compara a métrica. Se ainda assim houver empate, instala todas as rotas e distribui o tráfego entre elas: é o ECMP.",
        ],
      },
      {
        kind: "table",
        title: "Anatomia de uma entrada da tabela",
        caption: "Campos de uma entrada de tabela de roteamento e o que cada um significa",
        headers: ["Campo", "Exemplo", "O que significa"],
        monoColumns: [1],
        rows: [
          ["Rede de destino", "10.1.1.0/24", "faixa de endereços que esta entrada cobre"],
          ["Origem", "estática", "como o roteador conheceu esta rota"],
          ["Distância administrativa", "1", "confiabilidade da origem; menor é melhor"],
          ["Métrica", "0", "custo do caminho segundo o protocolo; menor é melhor"],
          ["Próximo salto", "10.0.12.2", "para quem entregar o pacote"],
          ["Interface de saída", "Gi0/0", "por onde o pacote sai fisicamente"],
        ],
      },
      {
        kind: "table",
        title: "Distâncias administrativas usuais",
        caption: "Valores de distância administrativa por origem de rota",
        headers: ["Origem", "Distância administrativa"],
        monoColumns: [1],
        rows: [
          ["Rede diretamente conectada", "0"],
          ["Rota estática", "1"],
          ["EIGRP interno", "90"],
          ["OSPF", "110"],
          ["RIP", "120"],
          ["Rota desconhecida / inutilizável", "255"],
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Distância administrativa não é métrica",
        body:
          "A distância administrativa compara origens diferentes: ela responde “em qual protocolo eu confio mais?”. A métrica compara caminhos dentro de um mesmo protocolo: responde “qual desses caminhos custa menos?”. Os dois valores aparecem juntos entre colchetes na saída do equipamento, no formato [distância/métrica].",
      },
      {
        kind: "prose",
        title: "O que muda em cada salto",
        paragraphs: [
          "Ao encaminhar um pacote, o roteador descarta o quadro de camada 2 que o trouxe e monta um quadro novo: o MAC de origem passa a ser o da sua interface de saída e o MAC de destino passa a ser o do próximo salto. O pacote IP em si segue praticamente intacto: os endereços de origem e destino não mudam.",
          "A exceção é o campo TTL, que é decrementado em 1 por cada roteador que encaminha o pacote. Quando chega a zero, o pacote é descartado e o roteador responde com uma mensagem ICMP de tempo excedido. É esse mecanismo que impede um pacote de circular para sempre caso exista um laço de roteamento.",
        ],
      },
      {
        kind: "routing-table",
        title: "A tabela de R1, campo a campo",
      },
      {
        kind: "prefix-match",
        title: "O prefixo mais longo, bit a bit",
      },
      {
        kind: "simulator",
        href: "/simuladores/roteamento",
        title: "Ver a decisão acontecendo",
        invite:
          "Informe um destino e acompanhe a eliminação das rotas candidatas critério por critério.",
      },
      {
        kind: "deep-dive",
        title: "O que o roteador faz quando duas rotas empatam em tudo",
        teaser:
          "Instalar dois caminhos de custo igual é fácil de dizer. Distribuir pacotes entre eles sem quebrar as conexões é o problema real.",
        paragraphs: [
          "Quando duas entradas sobrevivem ao prefixo mais longo, à distância administrativa e à métrica, o roteador instala as duas. A pergunta seguinte é como repartir o tráfego entre elas. A resposta ingênua, alternar pacote a pacote, é a errada.",
          "Alternar por pacote faz os pacotes de uma mesma conexão pegarem caminhos diferentes, com atrasos diferentes. Eles chegam fora de ordem, e o TCP do destino interpreta a desordem como perda: pede retransmissão e reduz a janela. A conexão fica mais lenta por causa do balanceamento que deveria acelerá-la.",
          "O que se faz na prática é balancear por fluxo. O roteador calcula um resumo a partir dos campos que identificam a conversa (endereços de origem e destino, e frequentemente também as portas) e usa esse resumo para escolher o caminho. Todos os pacotes da mesma conexão caem no mesmo caminho, sempre, e a ordem é preservada.",
          "A consequência é que o balanceamento é estatístico, não exato. Com poucas conversas grandes, dois enlaces de custo igual podem ficar com cargas bem diferentes: uma transferência única não se divide entre eles. Esperar 50% em cada é esperar demais de um mecanismo que trabalha por fluxo.",
        ],
      },
      {
        kind: "code",
        title: "Lendo a tabela no equipamento",
        code: `R1# show ip route
Codes: C - connected, S - static, R - RIP, O - OSPF

C    192.168.1.0/24 is directly connected, GigabitEthernet0/1
C    10.0.12.0/30 is directly connected, GigabitEthernet0/0
S    192.168.3.0/24 [1/0] via 10.0.12.2
R    172.16.0.0/16 [120/2] via 10.0.12.2, GigabitEthernet0/0
S*   0.0.0.0/0 [1/0] via 203.0.113.1`,
        explanations: [
          {
            line: "C    192.168.1.0/24 is directly connected",
            explanation:
              "Rede conectada: o roteador tem uma interface nela. Distância administrativa 0 e nenhum próximo salto: não há para quem entregar, porque a rede está ali.",
          },
          {
            line: "S    192.168.3.0/24 [1/0] via 10.0.12.2",
            explanation:
              "Rota estática. Entre colchetes, distância administrativa 1 e métrica 0. O tráfego para essa rede é entregue a 10.0.12.2.",
          },
          {
            line: "R    172.16.0.0/16 [120/2]",
            explanation:
              "Rota aprendida por RIP: distância administrativa 120 e métrica 2, ou seja, dois saltos até a rede de destino.",
          },
          {
            line: "S*   0.0.0.0/0",
            explanation:
              "Rota padrão. O asterisco indica que ela é a candidata a último recurso: casa com qualquer destino que nenhuma outra entrada cubra.",
          },
        ],
        caption:
          "Saída típica de show ip route. A letra à esquerda identifica a origem da rota.",
      },
    ],
    commonErrors: [
      {
        mistake: "Achar que a rota com menor métrica sempre vence.",
        why:
          "O prefixo mais longo é decidido antes. Uma rota /24 com métrica 10 vence uma /8 com métrica 1, porque a comparação de métrica só acontece entre rotas de mesmo prefixo e mesma distância administrativa.",
      },
      {
        mistake: "Confundir próximo salto com destino final.",
        why:
          "O próximo salto é sempre um endereço na rede diretamente conectada ao roteador que está decidindo. Ele é apenas o próximo trecho do caminho, nunca o destino do pacote.",
      },
      {
        mistake: "Esperar que configurar uma rota a coloque na tabela.",
        why:
          "Uma rota estática cujo próximo salto está inalcançável, ou cuja interface está desligada, não é instalada. Configuração aparece em show running-config; o que vale é o que aparece em show ip route.",
      },
    ],
    summary: [
      "O roteador escolhe pela ordem: prefixo mais longo, distância administrativa, métrica e, no empate final, ECMP.",
      "Endereços IP de origem e destino não mudam ao longo do caminho; endereços MAC mudam a cada salto.",
      "O TTL é decrementado por cada roteador e protege a rede contra pacotes em laço.",
    ],
  },

  {
    href: "/curso/roteamento-ip/estatico",
    source: "complementar",
    references: ["RFC 1812"],
    whatIs:
      "Roteamento estático é o registro manual, feito pelo administrador, de como alcançar uma rede: você declara a rede de destino, sua máscara e o próximo salto, e o roteador passa a usar essa informação.",
    whyExists:
      "Nem toda rede precisa de um protocolo dinâmico. Em topologias pequenas e estáveis, ou em pontas que só têm uma saída possível, uma rota escrita à mão é mais simples, mais previsível e não consome banda com anúncios periódicos. Também é a forma de declarar uma rota padrão para o restante da internet.",
    sections: [
      {
        kind: "topology",
        topology: "roteamento",
        title: "A topologia deste exemplo",
      },
      {
        kind: "code",
        title: "Configurando as rotas nos dois roteadores",
        code: `! Em R1: como alcançar a LAN que está atrás de R2
R1(config)# ip route 192.168.3.0 255.255.255.0 10.0.12.2

! Em R2: o caminho de volta
R2(config)# ip route 192.168.1.0 255.255.255.0 10.0.12.1

! Rota padrão em R1: tudo que não for conhecido sai por aqui
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1`,
        explanations: [
          {
            line: "ip route 192.168.3.0 255.255.255.0 10.0.12.2",
            explanation:
              "Rede de destino, máscara e próximo salto, nessa ordem. O próximo salto precisa estar numa rede diretamente conectada a R1: aqui, o outro lado do enlace 10.0.12.0/30.",
          },
          {
            line: "ip route 192.168.1.0 255.255.255.0 10.0.12.1",
            explanation:
              "A rota inversa, em R2. Sem ela, a requisição chega ao destino mas a resposta não encontra caminho de volta.",
          },
          {
            line: "ip route 0.0.0.0 0.0.0.0 203.0.113.1",
            explanation:
              "Rota padrão: rede 0.0.0.0 com máscara 0.0.0.0 casa com qualquer destino. Como tem prefixo /0, é a menos específica possível e só é usada quando nada mais casa.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "Roteamento é por sentido",
        body:
          "Configurar a rota em um lado só faz o pacote de ida chegar. A resposta é um pacote novo, com origem e destino invertidos, e precisa da rota correspondente no roteador do outro lado. Metade das falhas de conectividade em laboratório é rota inversa faltando.",
      },
      {
        kind: "prose",
        title: "Próximo salto ou interface de saída",
        paragraphs: [
          "Há duas formas de escrever uma rota estática: apontando para o endereço do próximo salto ou para a interface local de saída. Em enlaces ponto a ponto as duas funcionam, porque só existe um equipamento do outro lado.",
          "Em redes de acesso múltiplo, como um segmento Ethernet com vários roteadores, apontar apenas para a interface é problemático: o roteador não sabe a quem entregar o quadro e precisa recorrer a ARP para cada destino. Por isso, indicar o próximo salto explicitamente é a forma preferida.",
        ],
      },
      {
        kind: "code",
        title: "Verificando",
        code: `R1# show ip route static
S    192.168.3.0/24 [1/0] via 10.0.12.2
S*   0.0.0.0/0 [1/0] via 203.0.113.1

R1# ping 192.168.3.10 source 192.168.1.1`,
        caption:
          "Se a rota não aparecer em show ip route, o próximo salto está inalcançável ou a interface está desligada.",
      },
    ],
    commonErrors: [
      {
        mistake: "Configurar a rota só no roteador de origem.",
        why:
          "O pacote de resposta precisa do caminho de volta. Sem a rota inversa, o teste falha e parece problema de origem, quando o problema está no outro lado.",
      },
      {
        mistake: "Usar como próximo salto um endereço que não está em rede conectada.",
        why:
          "O roteador precisa saber por qual interface alcançar o próximo salto. Se o endereço não estiver numa rede diretamente conectada, a rota não é instalada.",
      },
      {
        mistake: "Escrever a máscara errada e criar uma rota que cobre demais.",
        why:
          "Uma rota para 192.168.0.0 255.255.0.0 cobre 192.168.0.0 a 192.168.255.255 e pode capturar tráfego que deveria seguir outro caminho, ou entrar em conflito com redes locais.",
      },
    ],
    summary: [
      "Rota estática declara destino, máscara e próximo salto, e tem distância administrativa 1.",
      "A rota precisa existir nos dois sentidos para haver comunicação.",
      "A rota padrão é 0.0.0.0/0 e só é usada quando nenhuma entrada mais específica casa.",
    ],
  },

  {
    href: "/curso/roteamento-ip/dinamico",
    source: "complementar",
    references: ["RFC 2453 (RIPv2)", "RFC 2328 (OSPF v2)"],
    whatIs:
      "Roteamento dinâmico é o uso de protocolos que fazem os roteadores trocarem informação de alcançabilidade entre si, montando e mantendo as tabelas automaticamente conforme a topologia muda.",
    whyExists:
      "Manter rotas à mão não escala. Numa rede com dezenas de sub-redes, cada mudança exigiria alterar vários equipamentos, e uma falha de enlace só seria contornada por intervenção humana. Um protocolo dinâmico descobre as redes, escolhe caminhos e reage a falhas sozinho.",
    sections: [
      {
        kind: "prose",
        title: "As duas famílias",
        paragraphs: [
          "Protocolos por vetor de distância anunciam aos vizinhos a lista de redes que conhecem e a que distância estão. Cada roteador confia no que o vizinho conta e soma o próprio custo. É simples e barato em processamento, mas ninguém tem a visão completa da topologia. A expressão usada é que esses protocolos enxergam a rede “pelos olhos do vizinho”. O RIP é o representante clássico.",
          "Protocolos por estado de enlace fazem o contrário: cada roteador anuncia o estado dos próprios enlaces para todo o domínio, e cada um monta internamente um mapa completo da topologia. Com o mapa em mãos, calcula a árvore de caminhos mais curtos até cada destino. Converge mais rápido e lida melhor com redes grandes, ao custo de mais memória e processamento. O OSPF é o representante clássico.",
        ],
      },
      {
        kind: "table",
        title: "Comparação",
        caption: "Diferenças entre vetor de distância e estado de enlace",
        headers: ["Aspecto", "Vetor de distância", "Estado de enlace"],
        rows: [
          ["O que é anunciado", "a tabela de rotas conhecida", "o estado dos próprios enlaces"],
          ["Para quem", "apenas aos vizinhos diretos", "para todo o domínio"],
          ["Visão da topologia", "indireta, pelo vizinho", "mapa completo em cada roteador"],
          ["Cálculo", "soma do custo anunciado", "árvore de caminhos mais curtos"],
          ["Convergência", "mais lenta", "mais rápida"],
          ["Custo computacional", "baixo", "maior"],
          ["Exemplo", "RIP", "OSPF"],
        ],
      },
      {
        kind: "prose",
        title: "Convergência",
        paragraphs: [
          "Convergência é o momento em que todos os roteadores do domínio passam a ter uma visão consistente da topologia. Enquanto a rede não convergiu, roteadores diferentes podem ter informações contraditórias, e pacotes podem circular em laço ou ser descartados.",
          "O tempo de convergência é a principal métrica de qualidade de um protocolo dinâmico. Protocolos por vetor de distância convergem mais devagar porque a informação precisa se propagar roteador a roteador, cada um esperando o próximo ciclo de anúncio.",
        ],
      },
      {
        kind: "callout",
        tone: "dica",
        title: "Estático e dinâmico convivem",
        body:
          "É comum usar um protocolo dinâmico no núcleo da rede e rotas estáticas nas pontas, onde só existe um caminho possível. A distância administrativa resolve o convívio: com AD 1, a rota estática vence a aprendida por RIP (120) ou OSPF (110) para o mesmo prefixo.",
      },
    ],
    commonErrors: [
      {
        mistake: "Tratar métrica de protocolos diferentes como comparável.",
        why:
          "Cada protocolo define a própria métrica: o RIP conta saltos, o OSPF usa custo derivado da largura de banda. Comparar 2 saltos com custo 20 não faz sentido, e é para isso que existe a distância administrativa.",
      },
      {
        mistake: "Habilitar o protocolo e esperar resultado imediato.",
        why:
          "A convergência leva tempo. Testar conectividade no instante seguinte ao comando pode mostrar falha que se resolve sozinha nos próximos ciclos de anúncio.",
      },
    ],
    summary: [
      "Vetor de distância anuncia a própria tabela aos vizinhos; estado de enlace anuncia os próprios enlaces a todos.",
      "Convergência é a rede inteira com visão consistente, e é o que se mede para comparar protocolos.",
      "A distância administrativa é o que permite estático e dinâmico coexistirem no mesmo roteador.",
    ],
  },

  {
    href: "/curso/roteamento-ip/classful-classless",
    source: "complementar",
    references: [
      "RFC 791",
      "RFC 1518 (arquitetura CIDR)",
      "RFC 1519 (CIDR)",
      "RFC 1918",
      "RFC 3021",
      "RFC 5737",
    ],
    whatIs:
      "Endereçamento classful é o modelo original do IPv4, em que os primeiros bits do endereço determinavam sua classe e, com ela, uma máscara fixa. Classless, ou CIDR, é o modelo atual, em que a máscara é declarada explicitamente e pode ter qualquer comprimento.",
    whyExists:
      "As classes desperdiçavam endereços em escala. Uma organização com 300 hosts não cabia numa classe C, de 254, e ao receber uma classe B ganhava 65.534 endereços, jogando fora dezenas de milhares. O CIDR eliminou essa amarração: a máscara passa a ser dimensionada conforme a necessidade real.",
    sections: [
      {
        kind: "table",
        title: "As classes históricas",
        caption: "Classes do endereçamento IPv4 original",
        headers: ["Classe", "Primeiro octeto", "Máscara padrão", "Uso"],
        monoColumns: [1, 2],
        rows: [
          ["A", "1–126", "255.0.0.0 (/8)", "redes muito grandes"],
          ["B", "128–191", "255.255.0.0 (/16)", "redes médias"],
          ["C", "192–223", "255.255.255.0 (/24)", "redes pequenas"],
          ["D", "224–239", "—", "multicast"],
          ["E", "240–255", "—", "reservada"],
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Por que 127 não aparece na classe A",
        body:
          "O bloco 127.0.0.0/8 é reservado para loopback: pacotes endereçados a ele nunca saem do próprio host. Por isso a faixa utilizável da classe A vai de 1 a 126.",
      },
      {
        kind: "prose",
        title: "Como a máscara funciona",
        paragraphs: [
          "A máscara de sub-rede é uma sequência de bits 1 seguida de bits 0, sem intercalar. Os bits 1 marcam a porção do endereço que identifica a rede; os bits 0 marcam a porção que identifica o host dentro dela. O prefixo CIDR é simplesmente a contagem de bits 1: /26 significa 26 bits de rede e 6 de host.",
          "Com h bits de host, o bloco tem 2^h endereços. Desses, um é o endereço de rede, com todos os bits de host em 0, e outro é o endereço de broadcast, com todos em 1. Sobram 2^h − 2 endereços atribuíveis a hosts. É daí que vem a fórmula.",
          "A máscara curinga é o complemento bit a bit da máscara: onde a máscara tem 1, o curinga tem 0. Ela aparece em listas de controle de acesso e em alguns comandos de protocolos de roteamento. Para /26, cuja máscara é 255.255.255.192, o curinga é 0.0.0.63.",
        ],
      },
      {
        kind: "table",
        title: "Prefixos mais usados",
        caption: "Prefixo, máscara, total de endereços e hosts utilizáveis",
        headers: ["Prefixo", "Máscara", "Endereços", "Hosts utilizáveis"],
        monoColumns: [0, 1, 2, 3],
        rows: [
          ["/24", "255.255.255.0", "256", "254"],
          ["/25", "255.255.255.128", "128", "126"],
          ["/26", "255.255.255.192", "64", "62"],
          ["/27", "255.255.255.224", "32", "30"],
          ["/28", "255.255.255.240", "16", "14"],
          ["/29", "255.255.255.248", "8", "6"],
          ["/30", "255.255.255.252", "4", "2"],
        ],
      },
      {
        kind: "prose",
        title: "VLSM",
        paragraphs: [
          "VLSM é a consequência prática do CIDR: dentro de um mesmo bloco, cada sub-rede pode ter uma máscara diferente, dimensionada conforme a quantidade de hosts que precisa atender. Uma LAN de 60 hosts recebe um /26; um enlace ponto a ponto entre dois roteadores, que precisa de apenas 2 endereços, recebe um /30.",
          "A regra do método é alocar da maior demanda para a menor. Fazendo o contrário, as sub-redes pequenas ocupam posições que fragmentam o bloco e impedem que as maiores caibam depois. Além disso, toda sub-rede precisa começar num endereço múltiplo do próprio tamanho, e é esse alinhamento que garante que os blocos não se sobreponham.",
        ],
      },
      {
        kind: "vlsm-worked",
        title: "Exemplo trabalhado: dividindo 192.168.10.0/24",
      },
      {
        kind: "vlsm-split",
        title: "O bloco sendo partido, passo a passo",
      },
      {
        kind: "simulator",
        href: "/simuladores/vlsm",
        title: "Praticar a divisão de um bloco",
        invite:
          "Distribua 192.168.10.0/24 entre LANs e enlaces e veja sobreposição, desperdício e espaço restante.",
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "As exceções /31 e /32",
        body:
          "Pela fórmula clássica, /31 daria zero hosts utilizáveis. O RFC 3021 abriu essa exceção para enlaces ponto a ponto: como só existem dois equipamentos, não há necessidade de endereço de broadcast, e os dois endereços podem ser usados. Já /32 identifica um host único e aparece em rotas de host e em interfaces de loopback.",
      },
      {
        kind: "table",
        title: "Faixas reservadas que você vai encontrar",
        caption: "Blocos IPv4 com uso especial e a norma que os define",
        headers: ["Bloco", "Uso", "Norma"],
        monoColumns: [0],
        rows: [
          ["10.0.0.0/8", "privado", "RFC 1918"],
          ["172.16.0.0/12", "privado", "RFC 1918"],
          ["192.168.0.0/16", "privado", "RFC 1918"],
          ["127.0.0.0/8", "loopback", "RFC 1122"],
          ["169.254.0.0/16", "link-local", "RFC 3927"],
          ["192.0.2.0/24", "documentação", "RFC 5737"],
          ["198.51.100.0/24", "documentação", "RFC 5737"],
          ["203.0.113.0/24", "documentação", "RFC 5737"],
          ["224.0.0.0/4", "multicast", "RFC 5771"],
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Contar 2^h em vez de 2^h − 2.",
        why:
          "O endereço de rede e o de broadcast não podem ser atribuídos a hosts. Esquecer a subtração é o erro mais comum em prova e leva a dimensionar sub-redes menores do que o necessário.",
      },
      {
        mistake: "Tomar o endereço de rede como se fosse o primeiro host.",
        why:
          "O primeiro host é o endereço de rede mais 1. Em 192.168.10.64/26, a rede é .64 e o primeiro host é .65.",
      },
      {
        mistake: "Alocar sub-redes VLSM em endereços não alinhados.",
        why:
          "Uma sub-rede /28 precisa começar num múltiplo de 16. Começar em 192.168.10.5/28 não é um endereço de rede válido e produz sobreposição com o bloco vizinho.",
      },
      {
        mistake: "Supor que o primeiro octeto ainda determina a máscara.",
        why:
          "Isso valia no modelo classful. Hoje 192.168.10.0 pode ser /24, /26 ou /30: a máscara vem escrita, não deduzida da classe.",
      },
    ],
    summary: [
      "A classe determinava a máscara; o CIDR a declara explicitamente e permite qualquer comprimento.",
      "Hosts utilizáveis são 2^h − 2, com /31 e /32 como exceções normatizadas.",
      "VLSM aloca da maior demanda para a menor, com cada sub-rede começando num múltiplo do próprio tamanho.",
    ],
  },

  {
    href: "/curso/roteamento-ip/rip",
    source: "complementar",
    references: ["RFC 1058 (RIPv1)", "RFC 2453 (RIPv2)", "RFC 2080 (RIPng)"],
    whatIs:
      "RIP é um protocolo de roteamento dinâmico por vetor de distância que usa a contagem de saltos como métrica: cada roteador atravessado no caminho conta 1.",
    whyExists:
      "É o protocolo mais simples de entender e configurar, e por muito tempo foi o suficiente para redes pequenas. Continua sendo o melhor ponto de partida para estudar roteamento dinâmico, porque todos os problemas dessa família (convergência lenta, laços, contagem ao infinito) aparecem nele de forma clara.",
    sections: [
      {
        kind: "topology",
        topology: "rip",
        title: "A topologia deste exemplo",
      },
      {
        kind: "prose",
        title: "Como o RIP aprende",
        paragraphs: [
          "Cada roteador começa conhecendo apenas as redes diretamente conectadas, com métrica 0. Periodicamente, anuncia aos vizinhos a lista completa de redes que conhece, junto com a métrica de cada uma.",
          "Ao receber um anúncio, o roteador soma 1 à métrica de cada rede, que é o custo de atravessar mais um salto, e compara com o que já tem na tabela. Se a rede é nova, instala. Se já conhece a rede por um caminho pior, troca. Se a informação veio do próprio próximo salto que estava usando, aceita mesmo que piore, porque aquele vizinho é a fonte de verdade daquele caminho.",
          "Repetindo esse ciclo, a informação se propaga roteador a roteador até que ninguém tenha mais nada novo a anunciar. Nesse ponto a rede convergiu.",
        ],
      },
      {
        kind: "table",
        title: "Limites do RIP",
        caption: "Valores característicos do RIP",
        headers: ["Característica", "Valor"],
        monoColumns: [1],
        rows: [
          ["Métrica", "contagem de saltos"],
          ["Métrica máxima utilizável", "15"],
          ["Valor que significa inalcançável", "16"],
          ["Distância administrativa", "120"],
          ["Suporte a máscara nos anúncios", "não em RIPv1; sim em RIPv2"],
        ],
      },
      {
        kind: "table",
        title: "As três versões do RIP",
        caption:
          "Diferenças entre RIPv1, RIPv2 e RIPng quanto a endereçamento, envio e recursos",
        headers: ["Aspecto", "RIPv1", "RIPv2", "RIPng"],
        rows: [
          ["Norma", "RFC 1058", "RFC 2453", "RFC 2080"],
          ["Protocolo endereçado", "IPv4", "IPv4", "IPv6"],
          ["Envia a máscara no anúncio", "não", "sim", "sim (prefixo)"],
          ["Endereçamento", "classful", "classless (suporta VLSM e CIDR)", "classless"],
          ["Forma de envio", "broadcast 255.255.255.255", "multicast 224.0.0.9", "multicast FF02::9"],
          ["Autenticação de vizinho", "não", "sim", "delegada ao IPsec do IPv6"],
          ["Porta UDP", "520", "520", "521"],
          ["Métrica", "saltos, máximo 15", "saltos, máximo 15", "saltos, máximo 15"],
        ],
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "RIPv1 não convive com VLSM",
        body:
          "Como o RIPv1 não carrega a máscara no anúncio, o roteador que recebe precisa deduzi-la, e deduz pela classe do endereço. Numa rede com sub-redes de tamanhos diferentes dentro do mesmo bloco, isso produz rotas erradas. É por esse motivo que a configuração começa com version 2 e no auto-summary.",
      },
      {
        kind: "table",
        title: "Temporizadores",
        caption:
          "Temporizadores do RIP: o que cada um controla, o valor da norma e o padrão da implementação Cisco",
        headers: ["Temporizador", "O que controla", "RFC 2453", "Padrão Cisco"],
        rows: [
          [
            "Update",
            "intervalo entre anúncios periódicos a todos os vizinhos",
            "30 s",
            "30 s",
          ],
          [
            "Invalid / timeout",
            "tempo sem receber notícia de uma rota até marcá-la como inalcançável (métrica 16)",
            "180 s",
            "180 s",
          ],
          [
            "Holddown",
            "período em que atualizações sobre uma rota recém-caída são ignoradas, para a notícia da queda se propagar antes de qualquer rota nova ser aceita",
            "não previsto na norma",
            "180 s",
          ],
          [
            "Flush / garbage-collection",
            "tempo até a rota ser efetivamente removida da tabela",
            "120 s após o timeout",
            "240 s desde a última atualização válida",
          ],
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Holddown é da implementação, não do padrão",
        body:
          "O RFC 2453 define update, timeout e garbage-collection. O temporizador de holddown é um acréscimo da implementação Cisco, e por isso os valores que você vê num equipamento podem não corresponder ao que a norma descreve. Ao estudar, vale separar o que é padrão do que é comportamento de fabricante.",
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "16 é infinito, não uma distância",
        body:
          "O RIP trata 16 saltos como inalcançável. Isso limita o diâmetro da rede a 15 saltos, mas resolve um problema maior: sem um teto, a métrica de uma rota que deixou de existir cresceria indefinidamente, com dois roteadores se apoiando um no outro. É a contagem ao infinito.",
      },
      {
        kind: "prose",
        title: "Mecanismos contra laço",
        paragraphs: [
          "Sozinho, o vetor de distância é vulnerável: quando uma rede cai, dois roteadores podem passar a se apoiar mutuamente numa rota que já não existe, cada um achando que o outro tem o caminho. A métrica cresce de um em um, indefinidamente. É a contagem ao infinito, e o RIP combina cinco mecanismos para contê-la.",
          "O teto de 16 é o mais direto: a contagem até pode subir, mas para ao chegar em 16, valor que significa inalcançável. Isso limita o estrago em tempo, mas não impede o laço de existir. Os outros quatro mecanismos atacam a causa.",
        ],
      },
      {
        kind: "table",
        title: "Os cinco mecanismos",
        caption:
          "Mecanismos de prevenção de laço do RIP e o que cada um faz",
        headers: ["Mecanismo", "O que faz", "Contra o quê"],
        rows: [
          [
            "Métrica máxima (16 = infinito)",
            "Impede a métrica de crescer além de 16, quando a rota é declarada inalcançável.",
            "limita a duração do problema",
          ],
          [
            "Split horizon",
            "Proíbe anunciar uma rota de volta pela interface por onde ela foi aprendida.",
            "laço entre dois roteadores vizinhos",
          ],
          [
            "Poison reverse",
            "Em vez de apenas omitir a rota, anuncia-a de volta com métrica 16, dizendo explicitamente ao vizinho que aquele caminho não serve.",
            "ambiguidade do silêncio do split horizon",
          ],
          [
            "Route poisoning",
            "Ao detectar que a própria rede caiu, anuncia-a imediatamente com métrica 16 em vez de deixar expirar.",
            "lentidão da expiração por temporizador",
          ],
          [
            "Triggered update",
            "Envia a atualização assim que algo muda, sem esperar os 30 s do temporizador de update.",
            "atraso na propagação da notícia",
          ],
        ],
      },
      {
        kind: "prose",
        title: "Split horizon e poison reverse não são a mesma coisa",
        paragraphs: [
          "O split horizon simples resolve por omissão: R2 apenas não menciona a R1 a rota que aprendeu dele. O silêncio é interpretado corretamente na maioria dos casos, mas é ambíguo: não anunciar pode significar “não sei” ou “não serve”.",
          "O split horizon com poison reverse resolve por afirmação: R2 anuncia a rota de volta a R1, mas com métrica 16. Não há ambiguidade, e R1 sabe imediatamente que não deve usar R2 como caminho para aquela rede. O custo é tráfego de anúncio maior, já que rotas envenenadas continuam sendo transmitidas.",
          "O holddown atua depois da queda: ao saber que uma rota ficou inalcançável, o roteador passa um período recusando informações novas sobre ela, mesmo que alguém anuncie um caminho aparentemente válido. A ideia é dar tempo para a notícia da queda circular por toda a rede antes de aceitar qualquer alternativa. Sem isso, uma informação velha ainda em trânsito poderia reinstalar a rota morta.",
        ],
      },
      {
        kind: "deep-dive",
        title: "Por que a métrica infinita é 16, e não um número grande",
        teaser:
          "Um limite tão baixo parece uma limitação arbitrária do protocolo. É o contrário: é o que faz o RIP terminar.",
        paragraphs: [
          "O RIP não escolhe 16 por economia de bits: o campo da métrica comporta muito mais. O 16 existe porque é o valor a partir do qual a contagem ao infinito para.",
          "Num laço de roteamento, dois roteadores ensinam um ao outro uma rota que já não existe, cada um somando um salto ao que ouviu. A métrica sobe indefinidamente, e é isso que dá nome ao problema. Sem um teto, ela nunca alcançaria valor nenhum que sinalizasse \"desista\": subiria para sempre.",
          "O teto transforma um laço infinito num laço curto. Com 16 valendo inalcançável, bastam poucas rodadas de anúncio para a métrica cruzar o limite e a rota ser descartada nos dois lados. Quanto maior fosse o teto, mais rodadas seriam necessárias, e mais tempo a rede passaria encaminhando pacotes por um caminho que não leva a lugar nenhum.",
          "O preço é o alcance: uma rede RIP não pode ter um destino a mais de 15 saltos de distância, porque o 16º já significa inalcançável. É uma troca explícita, e é a razão de o RIP não servir para redes grandes. Split horizon e envenenamento de rota reduzem a frequência do problema; o teto é o que garante que, quando ele acontecer, termine.",
        ],
      },
      {
        kind: "simulator",
        href: "/simuladores/rip",
        title: "Ver a convergência iteração por iteração",
        invite:
          "Derrube um enlace, ligue e desligue o split horizon e acompanhe cada tabela mudando.",
      },
      {
        kind: "code",
        title: "Configuração básica",
        code: `R1(config)# router rip
R1(config-router)# version 2
R1(config-router)# no auto-summary
R1(config-router)# network 192.168.1.0
R1(config-router)# network 10.0.12.0

! Não anunciar por uma interface que só tem hosts
R1(config-router)# passive-interface GigabitEthernet0/1

! Temporizadores explícitos: update, invalid, holddown e flush
R1(config-router)# timers basic 30 180 180 240

R1# show ip protocols
R1# show ip route rip
R1# debug ip rip`,
        explanations: [
          {
            line: "router rip",
            explanation: "Entra no modo de configuração do processo RIP.",
          },
          {
            line: "version 2",
            explanation:
              "Seleciona o RIPv2, que envia a máscara junto com a rede nos anúncios. Sem isso, o RIPv1 não suporta VLSM.",
          },
          {
            line: "no auto-summary",
            explanation:
              "Desliga a sumarização automática para a fronteira de classe, que descartaria a informação de máscara e quebraria topologias com VLSM.",
          },
          {
            line: "network 192.168.1.0",
            explanation:
              "Indica quais interfaces participam do RIP. O comando não anuncia a rede em si: ele habilita o protocolo nas interfaces cujo endereço pertence a essa rede.",
          },
          {
            line: "passive-interface GigabitEthernet0/1",
            explanation:
              "A interface continua tendo sua rede anunciada aos vizinhos, mas para de enviar anúncios por ali. Usa-se em interfaces que só têm hosts: não há roteador do outro lado para ouvir, e o anúncio periódico só consumiria banda.",
          },
          {
            line: "timers basic 30 180 180 240",
            explanation:
              "Define, nesta ordem, update (30 s), invalid (180 s), holddown (180 s) e flush (240 s). Os valores precisam ser idênticos em todos os roteadores do domínio; divergência causa instabilidade difícil de diagnosticar.",
          },
          {
            line: "show ip protocols",
            explanation:
              "Mostra o protocolo em execução, os temporizadores em vigor, as redes anunciadas e os vizinhos de quem se recebe atualização. É o primeiro comando a rodar quando o RIP não converge.",
          },
          {
            line: "debug ip rip",
            explanation:
              "Exibe cada anúncio enviado e recebido, em tempo real. Poderoso para entender a convergência, mas pesado: em produção, ligue com critério e desligue com undebug all.",
          },
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Ler métrica 16 como “16 saltos de distância”.",
        why:
          "16 é o valor reservado para inalcançável. Uma rota utilizável tem no máximo 15 saltos.",
      },
      {
        mistake: "Deixar o RIPv1 e usar VLSM.",
        why:
          "O RIPv1 não carrega a máscara nos anúncios, então sub-redes de tamanhos diferentes dentro do mesmo bloco não são divulgadas corretamente. É o motivo do version 2 e do no auto-summary.",
      },
      {
        mistake: "Tratar split horizon e poison reverse como sinônimos.",
        why:
          "O split horizon simples omite a rota; o poison reverse a anuncia de volta com métrica 16. Um resolve por silêncio, o outro por afirmação explícita, e é o segundo que elimina a ambiguidade.",
      },
      {
        mistake: "Configurar temporizadores diferentes em roteadores do mesmo domínio.",
        why:
          "Os valores precisam coincidir em todos. Divergência gera rotas expirando em momentos distintos, instabilidade intermitente e diagnóstico difícil, porque o sintoma não aponta para a causa.",
      },
      {
        mistake: "Procurar o temporizador de holddown na RFC 2453.",
        why:
          "Ele não está lá: a norma define update, timeout e garbage-collection. Holddown é acréscimo da implementação Cisco. Confundir os dois leva a esperar um comportamento que o padrão não garante.",
      },
      {
        mistake: "Entender network como “anuncie esta rede”.",
        why:
          "O comando seleciona em quais interfaces o RIP vai operar. As redes anunciadas são as das interfaces habilitadas. O efeito costuma parecer o mesmo, mas o raciocínio muda em topologias com várias interfaces.",
      },
    ],
    summary: [
      "A métrica do RIP é a contagem de saltos; 15 é o máximo utilizável e 16 significa inalcançável.",
      "Cinco mecanismos contêm o laço: teto de 16, split horizon, poison reverse, route poisoning e triggered update; o holddown age depois da queda, recusando informação nova enquanto a notícia circula.",
      "RIPv1 é classful e não carrega máscara; RIPv2 é classless e usa multicast 224.0.0.9; RIPng é a versão para IPv6 (RFC 2080).",
      "Temporizadores padrão: update 30 s, invalid 180 s, holddown 180 s e flush 240 s. O holddown é da implementação, não da norma.",
      "RIPv2 com no auto-summary é o mínimo para operar com VLSM.",
    ],
  },
];
