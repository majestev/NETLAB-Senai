import type { LessonContent } from "./types";

export const DIVERSOS_LESSONS: LessonContent[] = [
  {
    href: "/curso/interfaces/gui-cli",
    source: "complementar",
    whatIs:
      "As duas formas de configurar um equipamento de rede: a interface gráfica, acessada normalmente por navegador, e a interface de linha de comando, acessada por console, SSH ou Telnet.",
    whyExists:
      "A interface gráfica reduz a barreira de entrada e é adequada para tarefas pontuais em poucos equipamentos. A linha de comando é o que permite precisão, repetibilidade e automação, e é a única forma de acessar um equipamento cuja rede ainda não está configurada, pela porta de console.",
    sections: [
      {
        kind: "table",
        title: "Quando usar cada uma",
        caption: "Comparação entre interface gráfica e linha de comando",
        headers: ["Critério", "Interface gráfica", "Linha de comando"],
        rows: [
          ["Curva de aprendizado", "menor", "maior"],
          ["Precisão do que foi feito", "depende do formulário", "o comando é o registro exato"],
          ["Repetir em vários equipamentos", "manual, sujeito a erro", "copiar e colar o mesmo bloco"],
          ["Documentar a configuração", "captura de tela", "texto versionável"],
          ["Acesso sem rede configurada", "não", "sim, pela porta de console"],
          ["Diagnóstico detalhado", "limitado ao que a tela mostra", "comandos show e debug"],
        ],
      },
      {
        kind: "gui-vs-cli",
        title: "A mesma tarefa, nas duas interfaces",
      },
      {
        kind: "cli-modes",
        title: "O prompt diz em que modo você está",
      },
      {
        kind: "prose",
        title: "Os modos da linha de comando",
        paragraphs: [
          "A CLI de equipamentos de rede é organizada em modos, e cada modo aceita um conjunto diferente de comandos. Reconhecer o modo pelo prompt é a primeira habilidade a desenvolver: o símbolo no fim da linha diz onde você está.",
          "O modo usuário, indicado por >, permite apenas comandos de exibição básicos. O modo privilegiado, indicado por #, dá acesso aos comandos de diagnóstico e à configuração. O modo de configuração global, indicado por (config)#, é onde as alterações são feitas, e a partir dele entram-se em modos específicos, como (config-if)# para uma interface.",
        ],
      },
      {
        kind: "code",
        title: "Navegando entre os modos",
        code: `Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# interface FastEthernet0/1
SW1(config-if)# description Porta do PC1
SW1(config-if)# exit
SW1(config)# exit
SW1# show running-config
SW1# copy running-config startup-config`,
        explanations: [
          {
            line: "Switch> enable",
            explanation:
              "Do modo usuário para o modo privilegiado. O prompt muda de > para #.",
          },
          {
            line: "Switch# configure terminal",
            explanation:
              "Entra no modo de configuração global. Só a partir daqui é possível alterar o equipamento.",
          },
          {
            line: "SW1(config)# interface FastEthernet0/1",
            explanation:
              "Entra no modo de configuração de uma interface específica. O prompt passa a (config-if)#.",
          },
          {
            line: "SW1# copy running-config startup-config",
            explanation:
              "Salva a configuração ativa na memória de inicialização. Sem isso, tudo se perde ao reiniciar, e esse é o erro mais comum de laboratório.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "running-config não é startup-config",
        body:
          "A configuração em execução vive na memória volátil e passa a valer imediatamente. A de inicialização é a que o equipamento carrega ao ligar. Alterar sem salvar significa perder tudo no próximo reinício.",
      },
    ],
    commonErrors: [
      {
        mistake: "Tentar configurar a partir do modo usuário.",
        why:
          "O prompt terminado em > não aceita comandos de configuração. É preciso passar por enable e configure terminal.",
      },
      {
        mistake: "Esquecer de salvar a configuração.",
        why:
          "O equipamento funciona perfeitamente até ser reiniciado, quando volta ao estado anterior. O sintoma aparece muito depois da causa.",
      },
      {
        mistake: "Usar Telnet em vez de SSH.",
        why:
          "O Telnet transmite credenciais em texto claro. Qualquer captura na rede revela a senha de acesso ao equipamento.",
      },
    ],
    summary: [
      "A interface gráfica facilita tarefas pontuais; a CLI dá precisão, repetibilidade e acesso por console.",
      "O prompt indica o modo: > é usuário, # é privilegiado, (config)# é configuração global.",
      "Configuração só sobrevive ao reinício depois de copiada para startup-config.",
    ],
  },

  {
    href: "/curso/analisadores/captura",
    source: "complementar",
    references: ["RFC 791 (IPv4)", "RFC 9293 (TCP)", "RFC 826 (ARP)"],
    whatIs:
      "Um analisador de protocolos captura os quadros que passam por uma interface e os apresenta decodificados, campo a campo, camada por camada.",
    whyExists:
      "Quando algo não funciona, a configuração mostra o que deveria acontecer e a captura mostra o que está de fato acontecendo. É a diferença entre supor e verificar: dá para ver se o pacote saiu, se chegou, com que TTL, e o que foi respondido.",
    sections: [
      {
        kind: "prose",
        title: "O que a lista de pacotes mostra",
        paragraphs: [
          "A tela principal de um analisador é uma lista em que cada linha é um quadro capturado. As colunas padrão são o número sequencial, o instante da captura, origem, destino, o protocolo de mais alto nível reconhecido, o tamanho em bytes e um resumo do conteúdo.",
          "Repare que origem e destino mudam de natureza conforme o protocolo. Em um quadro ARP, aparecem endereços MAC, porque o ARP opera antes de haver conhecimento de camada 3. Em um pacote TCP, aparecem endereços IP. O analisador mostra a identificação mais relevante para aquele protocolo.",
        ],
      },
      {
        kind: "prose",
        title: "O detalhamento por camada",
        paragraphs: [
          "Ao selecionar um pacote, o analisador expande sua estrutura em árvore, uma camada por vez: o quadro Ethernet, o pacote IPv4 dentro dele, o segmento TCP dentro do pacote, e os dados de aplicação dentro do segmento. Essa árvore é o encapsulamento visível.",
          "É aqui que conceitos abstratos ficam concretos. O campo TTL de um pacote vindo de um servidor remoto chega com valor menor que o inicial, e a diferença revela quantos roteadores ele atravessou. O MAC de origem de um pacote que veio de fora da LAN é o do gateway, não o do servidor, porque o quadro foi reescrito no último salto.",
        ],
      },
      {
        kind: "encapsulation",
        title: "O dado descendo e subindo a pilha",
      },
      {
        kind: "simulator",
        href: "/simuladores/analisador",
        title: "Abrir uma captura e navegar pelos campos",
        invite:
          "Percorra uma sessão HTTP completa, do ARP inicial ao encerramento da conexão.",
      },
      {
        kind: "list",
        title: "O que procurar numa captura",
        items: [
          "Há resposta? Uma requisição sem resposta indica que o caminho de volta falhou ou que o destino não respondeu.",
          "O TTL bate com a quantidade esperada de saltos? Um TTL menor que o previsto indica caminho mais longo do que se imagina.",
          "O MAC de destino é o do gateway ou o do host final? Isso revela se o destino foi tratado como local ou remoto.",
          "Há retransmissões? Elas indicam perda no caminho, não necessariamente no destino.",
          "O handshake TCP se completou? SYN sem SYN-ACK aponta para bloqueio antes do destino.",
        ],
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "Capturar tráfego é uma atividade sensível",
        body:
          "Uma captura expõe conteúdo não cifrado de terceiros. Faça isso apenas em redes que você administra ou com autorização explícita, e trate o arquivo resultante como dado sensível.",
      },
    ],
    commonErrors: [
      {
        mistake: "Capturar no lugar errado.",
        why:
          "Um switch entrega quadros unicast apenas à porta de destino. Capturar numa porta qualquer não mostra o tráfego entre outros dois hosts; é preciso espelhar a porta ou capturar em uma das pontas.",
      },
      {
        mistake: "Confundir o MAC do gateway com o do servidor remoto.",
        why:
          "Na LAN de origem, todo quadro vindo de fora traz o MAC do roteador local. O endereço do servidor remoto só aparece no campo IP.",
      },
      {
        mistake: "Concluir que não há tráfego porque o filtro está errado.",
        why:
          "Um filtro de exibição mal escrito esconde exatamente o que se procura. Comece sem filtro e vá restringindo.",
      },
    ],
    summary: [
      "A lista de pacotes resume; a árvore de detalhes mostra o encapsulamento campo a campo.",
      "TTL e endereços MAC numa captura contam a história do caminho percorrido.",
      "Capturar exige estar no ponto certo da topologia, e exige autorização.",
    ],
  },

  {
    href: "/curso/ativos/equipamentos",
    source: "complementar",
    references: ["IEEE 802.3", "IEEE 802.11"],
    whatIs:
      "Ativos de rede são os equipamentos que processam o tráfego: repetidores, hubs, switches, roteadores, pontos de acesso e firewalls. Cada um atua numa camada e, por isso, enxerga informações diferentes.",
    whyExists:
      "Escolher o equipamento certo é escolher a camada certa. Um problema de domínio de broadcast não se resolve trocando o switch por outro switch; um problema de colisão não se resolve com um roteador. A camada em que o equipamento opera determina o que ele consegue fazer.",
    sections: [
      {
        kind: "table",
        title: "Equipamento por camada",
        caption: "Ativos de rede, camada de atuação e critério de encaminhamento",
        headers: ["Equipamento", "Camada", "Decide com base em", "Efeito na topologia"],
        rows: [
          ["Repetidor", "1 — física", "nada, apenas regenera o sinal", "estende o alcance; não segmenta nada"],
          ["Hub", "1 — física", "nada, replica em todas as portas", "um único domínio de colisão"],
          ["Bridge", "2 — enlace", "endereço MAC", "separa domínios de colisão"],
          ["Switch", "2 — enlace", "endereço MAC (tabela CAM)", "um domínio de colisão por porta"],
          ["Switch multicamada", "2 e 3", "MAC e IP", "roteia entre VLANs"],
          ["Roteador", "3 — rede", "endereço IP (tabela de roteamento)", "separa domínios de broadcast"],
          ["Ponto de acesso", "1 e 2", "MAC, sobre meio sem fio", "ponte entre o rádio e o cabo"],
          ["Firewall", "3 a 7", "regras de política", "controla o que passa entre redes"],
        ],
      },
      {
        kind: "prose",
        title: "Hub e switch não são a mesma coisa",
        paragraphs: [
          "O hub replica cada bit recebido em todas as demais portas. Todos os equipamentos ligados a ele disputam o mesmo meio, formam um único domínio de colisão e operam em half-duplex. Quanto mais hosts, mais colisões e menor o desempenho útil.",
          "O switch lê o endereço MAC de destino e encaminha o quadro apenas pela porta correta. Cada porta é um domínio de colisão independente, o que permite full-duplex e elimina a disputa pelo meio. É por isso que hubs desapareceram das redes em produção.",
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "A regra prática",
        body:
          "Switch segmenta domínios de colisão; roteador segmenta domínios de broadcast. A VLAN é a exceção interessante: ela segmenta domínios de broadcast em camada 2, sem roteador, mas então precisa de um equipamento de camada 3 para que essas VLANs voltem a se comunicar.",
      },
    ],
    commonErrors: [
      {
        mistake: "Esperar que um switch separe domínios de broadcast.",
        why:
          "Sem VLAN, todas as portas do switch estão no mesmo domínio de broadcast. Quem separa broadcast por padrão é o roteador.",
      },
      {
        mistake: "Chamar de switch qualquer caixa com muitas portas.",
        why:
          "O critério é o que o equipamento faz com o quadro. Um hub também tem várias portas e replica tudo em todas elas.",
      },
    ],
    summary: [
      "A camada de atuação determina o que o equipamento consegue decidir.",
      "Switch segmenta colisão; roteador segmenta broadcast; VLAN segmenta broadcast dentro do switch.",
      "Escolher o ativo é escolher o nível em que o problema precisa ser resolvido.",
    ],
  },

  {
    href: "/curso/redes-sem-fio/configuracao",
    source: "complementar",
    references: ["IEEE 802.11"],
    whatIs:
      "Configurar uma rede sem fio é definir como o ponto de acesso se anuncia e opera: o nome da rede, o canal de rádio usado, a largura de banda e o modo de operação.",
    whyExists:
      "O meio sem fio é compartilhado e não tem fronteiras físicas: o sinal atravessa paredes e se sobrepõe ao dos vizinhos. As decisões de configuração determinam se a rede será utilizável ou se vai disputar espectro consigo mesma e com quem está ao redor.",
    sections: [
      {
        kind: "topology",
        topology: "wireless",
        title: "Do cliente à rede cabeada",
      },
      {
        kind: "prose",
        title: "SSID e associação",
        paragraphs: [
          "O SSID é o nome da rede sem fio, anunciado periodicamente pelo ponto de acesso em quadros de beacon. É por ele que o cliente identifica a qual rede quer se conectar.",
          "Ocultar o SSID desativa o anúncio no beacon, mas não torna a rede invisível: o nome continua aparecendo nos quadros trocados durante a associação de qualquer cliente legítimo. É obscuridade, não segurança: a proteção real vem da cifragem do enlace.",
          "Vários pontos de acesso podem compartilhar o mesmo SSID para cobrir uma área maior. O cliente escolhe a qual se associar conforme a qualidade do sinal e transita entre eles conforme se desloca.",
        ],
      },
      {
        kind: "prose",
        title: "Canais e interferência",
        paragraphs: [
          "Na faixa de 2,4 GHz, os canais disponíveis se sobrepõem: canais numericamente vizinhos ocupam parte da mesma largura de espectro. Por isso a prática consagrada é usar apenas os canais 1, 6 e 11, que são suficientemente afastados para não interferirem entre si.",
          "A faixa de 5 GHz oferece mais canais sem sobreposição e sofre menos com interferência de outros equipamentos, ao custo de menor alcance e maior atenuação por obstáculos. A escolha entre as faixas é uma troca entre alcance e capacidade.",
        ],
      },
      {
        kind: "wireless-spectrum",
        title: "Por que 1, 6 e 11",
      },
      {
        kind: "callout",
        tone: "dica",
        title: "Cobertura não é a mesma coisa que capacidade",
        body:
          "Aumentar a potência de um único ponto de acesso amplia a área coberta, mas todos os clientes continuam disputando o mesmo meio. Para atender mais gente no mesmo espaço, o caminho é mais pontos de acesso com potência menor, em canais que não se sobrepõem.",
      },
      {
        kind: "list",
        title: "Roteiro de configuração",
        ordered: true,
        items: [
          "Definir o SSID com um nome que identifique a rede sem expor informação sensível sobre a organização.",
          "Escolher a faixa e o canal, evitando sobreposição com os pontos de acesso vizinhos.",
          "Selecionar o mecanismo de segurança mais recente que todos os clientes suportem.",
          "Definir uma senha longa e não trivial, ou integrar a autenticação a um servidor.",
          "Testar a cobertura nos pontos extremos da área que precisa ser atendida.",
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Deixar todos os pontos de acesso no canal automático em 2,4 GHz.",
        why:
          "A seleção automática pode convergir para canais sobrepostos entre APs próximos, degradando o desempenho de todos.",
      },
      {
        mistake: "Confiar no SSID oculto como medida de segurança.",
        why:
          "O nome aparece nos quadros de associação. Esconder o SSID atrapalha usuários legítimos e não impede quem está capturando tráfego.",
      },
      {
        mistake: "Elevar a potência para resolver falta de sinal em uma sala.",
        why:
          "Potência maior amplia a área de disputa pelo meio e a interferência com APs vizinhos. Em geral o problema se resolve com posicionamento ou com outro ponto de acesso.",
      },
    ],
    summary: [
      "O SSID identifica a rede; ocultá-lo não a protege.",
      "Em 2,4 GHz, canais 1, 6 e 11 são os que não se sobrepõem.",
      "Mais capacidade se obtém com mais pontos de acesso bem distribuídos, não com mais potência.",
    ],
  },

  {
    href: "/curso/redes-sem-fio/seguranca",
    source: "complementar",
    references: ["IEEE 802.11i", "IEEE 802.11"],
    whatIs:
      "Os mecanismos que autenticam quem entra na rede sem fio e cifram o tráfego no enlace de rádio: WEP, WPA, WPA2 e WPA3.",
    whyExists:
      "Numa rede cabeada, é preciso acesso físico ao cabo para capturar tráfego. No meio sem fio, qualquer um dentro do alcance recebe todos os quadros. Sem cifragem no enlace, a rede é aberta a quem estiver por perto, daí a necessidade de um mecanismo de proteção específico.",
    sections: [
      {
        kind: "table",
        title: "Evolução dos mecanismos",
        caption: "Comparação entre WEP, WPA, WPA2 e WPA3",
        headers: ["Mecanismo", "Cifragem", "Situação", "Observação"],
        rows: [
          [
            "WEP",
            "RC4 com vetor de inicialização curto",
            "obsoleto",
            "falhas conhecidas permitem recuperar a chave a partir de tráfego capturado",
          ],
          [
            "WPA",
            "TKIP, ainda sobre RC4",
            "superado",
            "solução de transição para permitir atualização de hardware existente",
          ],
          [
            "WPA2",
            "CCMP com AES",
            "amplamente usado",
            "certificação baseada no IEEE 802.11i; considerado o piso aceitável hoje",
          ],
          [
            "WPA3",
            "CCMP/GCMP com AES e handshake SAE",
            "mais recente",
            "melhora a proteção da troca inicial de chaves e o uso em redes abertas",
          ],
        ],
      },
      {
        kind: "wireless-assoc",
        title: "A associação, quadro a quadro",
      },
      {
        kind: "prose",
        title: "Por que o WEP falhou",
        paragraphs: [
          "O WEP combina uma chave fixa com um vetor de inicialização transmitido em claro a cada quadro. Esse vetor é curto demais, o que faz com que se repita depois de um volume relativamente pequeno de tráfego.",
          "Repetição de vetor com chave fixa é exatamente a condição que permite análise estatística. Com tráfego suficiente capturado, a chave pode ser recuperada. O problema é estrutural: não se resolve escolhendo uma senha melhor.",
        ],
      },
      {
        kind: "prose",
        title: "IEEE 802.11i, WPA2 e WPA3",
        paragraphs: [
          "O IEEE 802.11i é a emenda do padrão 802.11 que definiu o arcabouço de segurança robusta para redes sem fio, incluindo o uso de AES. O WPA2 é a certificação da Wi-Fi Alliance baseada nessa emenda, e por isso os dois nomes aparecem juntos com frequência.",
          "O WPA3 sucede o WPA2 e substitui o handshake baseado em chave pré-compartilhada por um esquema de autenticação simultânea de iguais, que dificulta ataques de dicionário feitos a partir de captura. Também introduz cifragem individualizada em redes abertas.",
        ],
      },
      {
        kind: "callout",
        tone: "dica",
        title: "Como escolher",
        body:
          "Use o mecanismo mais recente que todos os seus clientes suportam. Se todos suportam WPA3, use WPA3. Se algum equipamento antigo não suporta, WPA2 com AES é o piso aceitável. WEP e WPA com TKIP não devem ser usados em nenhuma circunstância: o modo misto que os mantém disponíveis rebaixa a segurança da rede inteira.",
      },
      {
        kind: "deep-dive",
        title: "Por que a senha nunca atravessa o ar",
        teaser:
          "O cliente prova que conhece a senha sem transmiti-la. Entender como é entender por que capturar o aperto de mão ainda assim é perigoso.",
        paragraphs: [
          "No WPA2, a senha da rede não é enviada em momento nenhum. Ela é usada dos dois lados, localmente, para derivar uma chave, e o que trafega no ar é apenas a prova de que os dois lados chegaram à mesma chave.",
          "Essa prova é construída com dois números aleatórios, um gerado pelo ponto de acesso e outro pelo cliente, trocados em claro. Cada lado combina os dois números com a chave derivada da senha e com os endereços de ambos, produzindo uma chave de sessão exclusiva daquela conexão. Como os números mudam a cada associação, a chave de sessão também muda: capturar uma sessão não ajuda a ler outra.",
          "O problema é que quem capturou o aperto de mão inteiro tem, offline, todos os elementos públicos do cálculo. Ele pode então testar senhas candidatas uma a uma, refazendo a derivação e comparando com a prova capturada, sem precisar interagir com a rede, e portanto sem limite de tentativas nem qualquer registro do lado do ponto de acesso.",
          "É por isso que uma senha curta ou previsível compromete o WPA2 mesmo com a cifragem intacta: o mecanismo está correto, e o que cede é a senha. E é exatamente esse ataque que o WPA3 mira, ao substituir a troca por um esquema em que cada tentativa de senha exige uma nova interação com a rede: o teste offline em massa deixa de ser possível.",
        ],
      },
      {
        kind: "list",
        title: "Além do mecanismo de cifragem",
        items: [
          "Senha longa e sem relação com o nome da rede ou da organização.",
          "Rede de visitantes separada, em VLAN própria, sem acesso à rede interna.",
          "Atualização do firmware do ponto de acesso, onde as correções de segurança chegam.",
          "Troca das credenciais de administração padrão do equipamento.",
          "Autenticação por servidor em ambientes corporativos, no lugar de uma senha compartilhada por todos.",
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Habilitar o modo misto WPA/WPA2 por precaução.",
        why:
          "O modo misto mantém disponível o mecanismo mais fraco, e é por ele que um atacante entra. Ele só se justifica enquanto existir um cliente que realmente não suporta o mecanismo mais recente.",
      },
      {
        mistake: "Achar que filtro de MAC protege a rede.",
        why:
          "Endereços MAC trafegam em claro mesmo em redes cifradas e podem ser copiados. O filtro é um controle administrativo, não uma barreira de segurança.",
      },
      {
        mistake: "Confundir WPA2 com IEEE 802.11i.",
        why:
          "802.11i é o padrão do IEEE; WPA2 é a certificação da Wi-Fi Alliance construída sobre ele. São camadas diferentes da mesma história.",
      },
    ],
    summary: [
      "WEP é obsoleto por falha estrutural no uso do vetor de inicialização.",
      "WPA2 baseia-se no IEEE 802.11i e usa AES; WPA3 é o sucessor e protege melhor a troca inicial de chaves.",
      "A regra é usar o mecanismo mais recente que todos os clientes suportam, sem modo misto desnecessário.",
    ],
  },
];
