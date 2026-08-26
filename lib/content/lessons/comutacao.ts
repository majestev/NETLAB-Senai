import type { LessonContent } from "./types";

export const COMUTACAO_LESSONS: LessonContent[] = [
  {
    href: "/curso/comutacao/mac",
    source: "complementar",
    references: ["IEEE 802.3", "IEEE 802"],
    whatIs:
      "O endereço MAC é um identificador de 48 bits gravado na interface de rede, usado para entregar quadros dentro de um mesmo segmento de camada 2.",
    whyExists:
      "Dentro de um segmento não existe hierarquia nem roteamento: é preciso um identificador plano que diga exatamente qual placa deve receber aquele quadro. O endereço IP não serve para isso, porque identifica uma posição lógica na rede, não a interface física que vai receber os bits.",
    sections: [
      {
        kind: "prose",
        title: "Estrutura",
        paragraphs: [
          "Os 48 bits são escritos como seis octetos em hexadecimal, separados por dois-pontos ou por hífen, como em 00:1a:2b:3c:4d:5e. Os três primeiros octetos formam o identificador único da organização, atribuído pelo IEEE ao fabricante. Os três últimos são atribuídos pelo próprio fabricante a cada interface.",
          "Essa divisão é o que torna o endereço globalmente único sem precisar de um registro central de cada placa: o IEEE controla apenas o prefixo do fabricante, e cada fabricante controla o restante.",
        ],
      },
      {
        kind: "table",
        title: "Tipos de endereço de destino",
        caption: "Categorias de endereço MAC de destino e seu alcance",
        headers: ["Tipo", "Exemplo", "Alcance"],
        monoColumns: [1],
        rows: [
          ["Unicast", "00:1a:2b:3c:4d:5e", "uma interface específica"],
          ["Multicast", "01:00:5e:00:00:01", "um grupo de interfaces interessadas"],
          ["Broadcast", "ff:ff:ff:ff:ff:ff", "todas as interfaces do domínio de broadcast"],
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Como distinguir unicast de multicast",
        body:
          "O bit menos significativo do primeiro octeto indica se o endereço é individual ou de grupo: em 0, é unicast; em 1, é de grupo. Por isso 01:00:5e:… é multicast e 00:1a:2b:… é unicast. O broadcast é o caso extremo, com todos os 48 bits em 1.",
      },
      {
        kind: "prose",
        title: "MAC e IP trabalham juntos",
        paragraphs: [
          "Quando um host quer falar com outro na mesma rede, ele precisa descobrir o MAC correspondente ao IP de destino. Quem faz essa tradução é o ARP: uma requisição em broadcast pergunta quem tem determinado IP, e o dono responde em unicast com o próprio MAC.",
          "Quando o destino está em outra rede, a lógica muda. O host mantém o IP de destino do host remoto, mas endereça o quadro ao MAC do gateway padrão, porque é o gateway que precisa receber os bits para poder rotear. É a distinção entre entrega local e entrega fim a fim.",
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Achar que o MAC do destino remoto aparece no quadro.",
        why:
          "Quando o destino está em outra rede, o MAC de destino é o do gateway. O endereço da máquina remota só existe no campo IP.",
      },
      {
        mistake: "Supor que o endereço MAC nunca muda.",
        why:
          "Ele é gravado de fábrica, mas pode ser alterado por software na maioria dos sistemas. Por isso filtro de MAC não é mecanismo de segurança.",
      },
    ],
    summary: [
      "48 bits, sendo os 24 primeiros do fabricante e os 24 últimos da interface.",
      "O bit menos significativo do primeiro octeto separa unicast de endereços de grupo.",
      "MAC entrega dentro do segmento; IP identifica fim a fim. O ARP faz a ponte entre os dois.",
    ],
  },

  {
    href: "/curso/comutacao/colisoes",
    source: "complementar",
    references: ["IEEE 802.3"],
    whatIs:
      "Domínio de colisão é o conjunto de dispositivos que disputam o mesmo meio de transmissão. Domínio de broadcast é o conjunto de dispositivos que recebem um quadro de broadcast enviado por qualquer um deles.",
    whyExists:
      "São as duas medidas que descrevem a saúde de um segmento. Domínios de colisão grandes desperdiçam capacidade com retransmissões; domínios de broadcast grandes desperdiçam capacidade com tráfego que todos precisam processar mesmo sem interesse.",
    sections: [
      {
        kind: "prose",
        title: "Colisão",
        paragraphs: [
          "No Ethernet compartilhado original, só um dispositivo podia transmitir por vez. Se dois transmitissem simultaneamente, os sinais se somavam e ambos os quadros eram destruídos: é a colisão. O método de acesso, chamado CSMA/CD, mandava escutar antes de transmitir, detectar a colisão durante a transmissão, parar, esperar um tempo aleatório e tentar de novo.",
          "Cada porta de switch cria um domínio de colisão separado, porque o switch armazena o quadro antes de encaminhá-lo em vez de replicar o sinal. Com apenas um dispositivo em cada domínio e operação full-duplex, não há mais disputa: colisões deixam de existir em redes comutadas modernas.",
        ],
      },
      {
        kind: "prose",
        title: "Broadcast",
        paragraphs: [
          "Um quadro de broadcast é entregue a todos os dispositivos do domínio. Ele é necessário, e o ARP depende dele, mas cada broadcast consome banda em todos os enlaces e obriga cada host a processar o quadro até descobrir que não lhe interessa.",
          "O switch não delimita broadcast: por padrão, todas as suas portas estão no mesmo domínio. Quem delimita é o roteador, que não encaminha broadcast de camada 2 entre suas interfaces. A VLAN é o mecanismo que permite ao switch criar vários domínios de broadcast sem exigir equipamentos físicos separados.",
        ],
      },
      {
        kind: "table",
        title: "Contagem por equipamento",
        caption: "Quantos domínios cada equipamento cria",
        headers: ["Equipamento", "Domínios de colisão", "Domínios de broadcast"],
        rows: [
          ["Hub com 8 portas", "1", "1"],
          ["Switch com 8 portas, sem VLAN", "8, um por porta", "1"],
          ["Switch com 8 portas e 2 VLANs", "8, um por porta", "2, um por VLAN"],
          ["Roteador com 3 interfaces", "3, um por interface", "3, um por interface"],
        ],
      },
      {
        kind: "callout",
        tone: "dica",
        title: "Como contar numa prova",
        body:
          "Conte domínios de colisão pelas portas de switch e interfaces de roteador ativas; cada hub inteiro conta como um só. Conte domínios de broadcast pelas interfaces de roteador e pelas VLANs, nunca pelas portas de switch.",
      },
    ],
    commonErrors: [
      {
        mistake: "Contar cada porta de hub como um domínio de colisão.",
        why:
          "O hub inteiro é um único domínio: ele replica o sinal em todas as portas, e todos disputam o mesmo meio.",
      },
      {
        mistake: "Achar que switch separa broadcast.",
        why:
          "Sem VLAN, todas as portas do switch pertencem ao mesmo domínio de broadcast. A separação vem do roteador ou da VLAN.",
      },
      {
        mistake: "Procurar colisões numa rede comutada full-duplex.",
        why:
          "Com um dispositivo por porta e full-duplex, não há disputa pelo meio. Colisão nessa situação indica negociação de duplex incorreta, não comportamento normal.",
      },
    ],
    summary: [
      "Cada porta de switch é um domínio de colisão; o hub inteiro é apenas um.",
      "Domínio de broadcast é delimitado por roteador ou por VLAN, nunca por porta de switch.",
      "Em rede comutada full-duplex, colisão é sintoma de problema de configuração.",
    ],
  },

  {
    href: "/curso/comutacao/cam",
    source: "complementar",
    references: ["IEEE 802.1D"],
    whatIs:
      "A tabela CAM é onde o switch registra qual endereço MAC foi visto em qual porta. É a base de toda decisão de encaminhamento de camada 2.",
    whyExists:
      "Sem essa tabela, o switch não teria como saber por qual porta alcançar um destino e precisaria replicar todo quadro em todas as portas, que é comportamento de hub. A CAM é o que transforma replicação cega em encaminhamento seletivo.",
    sections: [
      {
        kind: "topology",
        topology: "switching",
        title: "A topologia deste exemplo",
      },
      {
        kind: "cam-story",
        title: "Da tabela vazia ao encaminhamento por uma porta",
      },
      {
        kind: "list",
        title: "O ciclo do switch, quadro a quadro",
        ordered: true,
        items: [
          "O quadro chega por uma porta. O switch lê o MAC de ORIGEM e registra na tabela: este MAC está nesta porta.",
          "O switch lê o MAC de DESTINO e procura na tabela.",
          "Se o destino está na tabela e é outra porta, encaminha apenas por ela, em unicast.",
          "Se o destino está na tabela e é a mesma porta de entrada, descarta o quadro. É a filtragem: devolver o quadro ao segmento de onde veio não teria utilidade.",
          "Se o destino não está na tabela, inunda o quadro por todas as portas da VLAN, menos a de entrada.",
          "Se o destino é broadcast ou multicast, inunda sempre, independentemente da tabela.",
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Aprende pela origem, decide pelo destino",
        body:
          "São duas operações distintas no mesmo quadro, e trocá-las é o erro conceitual mais comum. O switch nunca aprende com o MAC de destino: se aprendesse, registraria a localização de um host do qual ainda não recebeu nada.",
      },
      {
        kind: "simulator",
        href: "/simuladores/switch",
        title: "Preencher uma tabela CAM do zero",
        invite:
          "Envie quadros entre quatro hosts e veja a inundação virar encaminhamento unicast.",
      },
      {
        kind: "prose",
        title: "Envelhecimento das entradas",
        paragraphs: [
          "Entradas aprendidas não são permanentes: cada uma tem um temporizador que é reiniciado sempre que um novo quadro daquele MAC chega. Se o host ficar em silêncio por tempo suficiente, a entrada é removida.",
          "Isso é necessário para que a tabela acompanhe mudanças físicas. Se um computador for movido de porta, a entrada antiga precisa deixar de valer. Na prática, o primeiro quadro enviado da nova porta já sobrescreve o registro.",
        ],
      },
      {
        kind: "deep-dive",
        title: "O que acontece quando a tabela CAM enche",
        teaser:
          "A tabela tem tamanho finito. O que o switch faz ao esgotá-la é a base de um ataque clássico de camada 2.",
        paragraphs: [
          "A tabela CAM vive em memória dedicada e tem um número máximo de entradas, definido pelo hardware do switch. Em operação normal esse limite é folgado: uma rede com algumas centenas de hosts não chega perto dele.",
          "Quando a tabela enche, o switch não deixa de encaminhar: ele volta a se comportar como se não soubesse onde os destinos estão, e passa a inundar. É o comportamento seguro: melhor entregar em excesso do que descartar. Mas o efeito colateral é que o tráfego que deveria sair por uma porta só passa a sair por todas.",
          "É exatamente isso que um ataque de inundação de MAC explora. O atacante gera quadros com endereços de origem falsos, um diferente a cada quadro, até esgotar a tabela. A partir daí, o switch inunda o tráfego legítimo, e uma máquina em qualquer porta da VLAN passa a receber cópias de conversas que não lhe diziam respeito, e o switch deixa de dar a separação que era a razão de existir dele.",
          "A defesa padrão é limitar quantos endereços de origem cada porta de acesso pode aprender. Uma porta que atende um único computador não tem motivo para apresentar dezenas de endereços diferentes, e o switch pode tratar isso como violação em vez de aprendizado.",
        ],
      },
      {
        kind: "code",
        title: "Consultando no equipamento",
        code: `SW1# show mac address-table
          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type      Ports
----    -----------       ----      -----
   1    0011.1111.1111    DYNAMIC   Fa0/1
   1    0022.2222.2222    DYNAMIC   Fa0/2
  10    0033.3333.3333    DYNAMIC   Fa0/3

SW1# clear mac address-table dynamic`,
        explanations: [
          {
            line: "DYNAMIC",
            explanation:
              "Entrada aprendida automaticamente a partir do MAC de origem dos quadros. Entradas estáticas, configuradas à mão, aparecem como STATIC e não envelhecem.",
          },
          {
            line: "Vlan",
            explanation:
              "A tabela é por VLAN. O mesmo endereço MAC pode aparecer em VLANs diferentes como entradas independentes.",
          },
          {
            line: "clear mac address-table dynamic",
            explanation:
              "Apaga as entradas aprendidas. O switch volta a inundar até reaprender, o que é útil para diagnosticar e um bom jeito de observar o aprendizado acontecendo.",
          },
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Dizer que o switch aprende o MAC de destino.",
        why:
          "O aprendizado é sempre pelo MAC de origem. O destino é usado apenas para a consulta que decide a porta de saída.",
      },
      {
        mistake: "Tratar inundação como falha.",
        why:
          "Inundar é o comportamento correto para um destino ainda desconhecido: é o que permite a comunicação acontecer antes de o switch aprender.",
      },
      {
        mistake: "Esquecer que a tabela é por VLAN.",
        why:
          "Conhecer um MAC na VLAN 20 não ajuda a encaminhar um quadro da VLAN 10 para o mesmo endereço: são domínios separados e entradas separadas.",
      },
    ],
    summary: [
      "O switch aprende pelo MAC de origem e decide pelo MAC de destino.",
      "Destino desconhecido é inundado; destino na mesma porta de entrada é filtrado.",
      "As entradas envelhecem, e a tabela é mantida por VLAN.",
    ],
  },

  {
    href: "/curso/comutacao/metodos",
    source: "complementar",
    references: ["IEEE 802.3"],
    whatIs:
      "Os métodos de encaminhamento definem em que momento o switch começa a transmitir um quadro pela porta de saída: depois de recebê-lo inteiro, logo após ler o endereço de destino, ou num ponto intermediário.",
    whyExists:
      "Há uma troca direta entre latência e verificação de integridade. Esperar o quadro inteiro permite descartar quadros corrompidos antes de propagá-los, mas atrasa a entrega. Começar antes reduz a latência, mas propaga erros.",
    sections: [
      {
        kind: "table",
        title: "Os três métodos",
        caption: "Comparação entre os métodos de encaminhamento de um switch",
        headers: ["Método", "Começa a transmitir", "Verifica o FCS?", "Latência"],
        rows: [
          [
            "Store-and-forward",
            "após receber o quadro inteiro",
            "sim",
            "maior, proporcional ao tamanho do quadro",
          ],
          [
            "Cut-through",
            "após ler os 6 bytes do MAC de destino",
            "não",
            "menor e constante",
          ],
          [
            "Fragment-free",
            "após receber os primeiros 64 bytes",
            "parcialmente",
            "intermediária",
          ],
        ],
      },
      {
        kind: "prose",
        title: "Por que 64 bytes",
        paragraphs: [
          "O fragment-free espera exatamente 64 bytes porque esse é o tamanho mínimo de um quadro Ethernet válido. Colisões, quando existiam, ocorriam quase sempre dentro dessa janela inicial de transmissão, produzindo fragmentos menores que o mínimo.",
          "Ao esperar os 64 bytes, o switch descarta esses fragmentos sem pagar o custo de aguardar o quadro inteiro. É um meio-termo: filtra o erro mais provável mantendo a latência baixa.",
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "O que é o FCS",
        body:
          "O FCS é o campo de verificação no fim do quadro, calculado sobre todo o conteúdo. Como está no final, só é possível conferi-lo depois de receber o quadro completo, e é por isso que apenas o store-and-forward consegue validá-lo antes de encaminhar.",
      },
      {
        kind: "prose",
        title: "O que se usa hoje",
        paragraphs: [
          "Switches modernos operam predominantemente em store-and-forward. A capacidade de processamento tornou a latência adicional desprezível para a maioria das aplicações, e a validação do FCS evita que quadros corrompidos consumam banda no restante da rede.",
          "O cut-through permanece relevante em nichos onde a latência é crítica e previsível, como certos ambientes de negociação financeira e clusters de alto desempenho.",
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Achar que cut-through corrige erros mais rápido.",
        why:
          "Cut-through não verifica erro nenhum: o quadro já foi encaminhado quando o FCS chegaria. Ele é mais rápido justamente porque não verifica.",
      },
      {
        mistake: "Dizer que fragment-free verifica o FCS.",
        why:
          "Ele só descarta quadros menores que 64 bytes. O FCS está no fim do quadro e continua sem ser conferido.",
      },
    ],
    summary: [
      "Store-and-forward espera o quadro inteiro e valida o FCS; é o padrão atual.",
      "Cut-through encaminha após o MAC de destino, com a menor latência e nenhuma verificação.",
      "Fragment-free espera 64 bytes, o tamanho mínimo de um quadro válido.",
    ],
  },

  {
    href: "/curso/comutacao/configuracao",
    source: "complementar",
    whatIs:
      "A configuração básica de um switch: identificação, acesso administrativo, endereço de gerência, parâmetros de porta e verificação do resultado.",
    whyExists:
      "Um switch funciona encaminhando quadros sem nenhuma configuração. O que a configuração acrescenta é o que torna a rede administrável: identificar o equipamento, acessá-lo remotamente com segurança, documentar o uso das portas e diagnosticar problemas.",
    sections: [
      {
        kind: "code",
        title: "Identificação e acesso",
        code: `Switch> enable
Switch# configure terminal
Switch(config)# hostname SW1
SW1(config)# enable secret NetLab#2026
SW1(config)# service password-encryption
SW1(config)# banner motd #Acesso restrito#

SW1(config)# line console 0
SW1(config-line)# password ConsoleNetLab
SW1(config-line)# login
SW1(config-line)# exit`,
        explanations: [
          {
            line: "hostname SW1",
            explanation:
              "Nomear o equipamento é a primeira coisa a fazer: o prompt passa a identificá-lo, o que evita configurar o switch errado.",
          },
          {
            line: "enable secret NetLab#2026",
            explanation:
              "Define a senha do modo privilegiado com armazenamento em resumo criptográfico. Prefira enable secret a enable password, que guarda a senha de forma reversível.",
          },
          {
            line: "service password-encryption",
            explanation:
              "Ofusca as demais senhas no arquivo de configuração. É proteção contra leitura casual, não contra análise dedicada.",
          },
        ],
      },
      {
        kind: "code",
        title: "Gerência e portas",
        code: `SW1(config)# interface vlan 1
SW1(config-if)# ip address 192.168.1.2 255.255.255.0
SW1(config-if)# no shutdown
SW1(config-if)# exit
SW1(config)# ip default-gateway 192.168.1.1

SW1(config)# interface FastEthernet0/1
SW1(config-if)# description PC1 - laboratorio
SW1(config-if)# speed auto
SW1(config-if)# duplex auto
SW1(config-if)# no shutdown`,
        explanations: [
          {
            line: "interface vlan 1",
            explanation:
              "Um switch de camada 2 não tem endereço IP por porta. O endereço fica numa interface virtual de VLAN e serve apenas para administrar o equipamento.",
          },
          {
            line: "ip default-gateway 192.168.1.1",
            explanation:
              "Necessário para administrar o switch de fora da sua própria rede. Sem isso, o acesso remoto só funciona de dentro da mesma sub-rede.",
          },
          {
            line: "description PC1 - laboratorio",
            explanation:
              "Documentação que fica no equipamento. Aparece em show interfaces e economiza tempo de diagnóstico meses depois.",
          },
        ],
      },
      {
        kind: "table",
        title: "Comandos de verificação",
        caption: "O que cada comando de exibição mostra",
        headers: ["Comando", "Mostra"],
        monoColumns: [0],
        rows: [
          ["show running-config", "a configuração ativa completa"],
          ["show interfaces status", "estado, VLAN, duplex e velocidade de cada porta"],
          ["show mac address-table", "os endereços MAC aprendidos e suas portas"],
          ["show vlan brief", "as VLANs existentes e as portas de cada uma"],
          ["show interfaces trunk", "as portas em modo trunk e as VLANs permitidas"],
          ["show ip interface brief", "os endereços IP das interfaces e seu estado"],
        ],
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "Salvar não é opcional",
        body:
          "copy running-config startup-config grava a configuração ativa na memória de inicialização. Sem esse comando, tudo o que foi feito desaparece no próximo reinício, e o problema só aparece muito depois do erro.",
      },
    ],
    commonErrors: [
      {
        mistake: "Tentar colocar endereço IP numa porta física do switch.",
        why:
          "Num switch de camada 2, as portas físicas não recebem IP. O endereço de gerência fica na interface virtual da VLAN.",
      },
      {
        mistake: "Configurar velocidade e duplex fixos em um lado só.",
        why:
          "Se um lado está fixo e o outro em automático, a negociação falha e resulta em duplex incompatível, com colisões e desempenho péssimo numa rede que deveria ser full-duplex.",
      },
      {
        mistake: "Usar enable password em vez de enable secret.",
        why:
          "enable password armazena a senha de forma reversível. enable secret usa resumo criptográfico e é o que deve ser usado.",
      },
    ],
    summary: [
      "Nomear, proteger o acesso e documentar as portas é o mínimo de uma configuração administrável.",
      "O IP de gerência de um switch de camada 2 fica numa interface de VLAN, não nas portas físicas.",
      "Verificar com os comandos show é parte do procedimento, não uma etapa opcional.",
    ],
  },

  {
    href: "/curso/comutacao/ethernet",
    source: "complementar",
    references: ["IEEE 802.3"],
    whatIs:
      "Ethernet é o conjunto de padrões que define como os bits são transmitidos e como os quadros são formados nas redes locais cabeadas. É normatizado pelo IEEE sob a designação 802.3.",
    whyExists:
      "Para que equipamentos de fabricantes diferentes se comuniquem, é preciso um acordo sobre o formato exato do quadro, a codificação dos sinais, os conectores e o método de acesso ao meio. Ethernet é esse acordo, e sua estabilidade ao longo de décadas é o que permitiu a rede evoluir de 10 Mb/s a velocidades muito maiores sem trocar o modelo de quadro.",
    sections: [
      {
        kind: "table",
        title: "Campos do quadro Ethernet",
        caption: "Estrutura de um quadro Ethernet II e o tamanho de cada campo",
        headers: ["Campo", "Tamanho", "Função"],
        rows: [
          ["Preâmbulo e SFD", "8 bytes", "sincroniza o receptor e marca o início do quadro"],
          ["MAC de destino", "6 bytes", "para quem o quadro se destina no segmento"],
          ["MAC de origem", "6 bytes", "quem enviou; é o que o switch usa para aprender"],
          ["EtherType", "2 bytes", "identifica o protocolo encapsulado (0x0800 para IPv4, 0x0806 para ARP)"],
          ["Dados", "46 a 1500 bytes", "o pacote da camada superior"],
          ["FCS", "4 bytes", "verificação de integridade do quadro"],
        ],
      },
      {
        kind: "prose",
        title: "Tamanho mínimo e máximo",
        paragraphs: [
          "O campo de dados vai de 46 a 1500 bytes. O limite superior é a unidade máxima de transmissão do Ethernet: um pacote IP maior que isso precisa ser fragmentado antes de caber no quadro.",
          "O limite inferior existe por causa do método de detecção de colisão original: um quadro precisava ser longo o bastante para que a colisão fosse detectada antes do fim da transmissão. Quando os dados são menores que 46 bytes, um preenchimento é acrescentado até atingir o mínimo. Somando os cabeçalhos, o quadro mínimo tem 64 bytes, o mesmo número que aparece no método fragment-free.",
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Ethernet II e IEEE 802.3 no mesmo lugar",
        body:
          "Existem dois formatos históricos que diferem no campo após os endereços: no Ethernet II ele é o EtherType, que identifica o protocolo; no formato original do 802.3 ele indica o comprimento dos dados. A distinção é feita pelo valor: acima de 1536 é EtherType, abaixo é comprimento. Na prática, quase todo tráfego atual usa Ethernet II.",
      },
      {
        kind: "deep-dive",
        title: "O que existe no fio antes do primeiro byte do quadro",
        teaser:
          "A tabela de campos começa no MAC de destino. No cabo, alguma coisa vem antes, e depois do último byte há um silêncio obrigatório.",
        paragraphs: [
          "Antes de cada quadro, a interface transmite sete bytes de preâmbulo: uma alternância regular de uns e zeros. Eles não carregam dado nenhum. Servem para o receptor sincronizar o próprio relógio com o do transmissor, porque não há linha de relógio separada: a temporização precisa ser recuperada do próprio sinal.",
          "Em seguida vem um oitavo byte, o delimitador de início de quadro, cujos dois últimos bits quebram o padrão da alternância. É esse desvio que marca o instante exato em que o preâmbulo terminou e o primeiro byte do endereço de destino começa.",
          "Depois do último byte, o transmissor é obrigado a ficar em silêncio por um intervalo mínimo antes de enviar o próximo quadro. Esse intervalo dá ao receptor tempo de processar o que chegou e de se preparar para a próxima sincronização.",
          "Preâmbulo e intervalo não aparecem na contagem de 1518 bytes nem no analisador de protocolos, porque a placa de rede os consome antes de entregar o quadro ao sistema. Eles existem no cabo e ocupam tempo, e é por isso que a taxa útil de um enlace é sempre um pouco menor do que a velocidade nominal sugere, especialmente com quadros pequenos.",
        ],
      },
      {
        kind: "table",
        title: "Variantes de velocidade",
        caption: "Designações comuns do padrão Ethernet",
        headers: ["Designação", "Velocidade", "Meio típico"],
        monoColumns: [0],
        rows: [
          ["10BASE-T", "10 Mb/s", "par trançado"],
          ["100BASE-TX", "100 Mb/s", "par trançado categoria 5"],
          ["1000BASE-T", "1 Gb/s", "par trançado categoria 5e ou superior"],
          ["10GBASE-T", "10 Gb/s", "par trançado categoria 6a ou superior"],
          ["1000BASE-LX", "1 Gb/s", "fibra óptica"],
        ],
      },
    ],
    commonErrors: [
      {
        mistake: "Confundir o tamanho do quadro com o tamanho dos dados.",
        why:
          "1500 bytes é o limite do campo de dados. O quadro completo é maior, porque inclui endereços, EtherType e FCS.",
      },
      {
        mistake: "Achar que o FCS corrige erros.",
        why:
          "O FCS detecta corrupção; não corrige. Um quadro com FCS inválido é descartado, e a recuperação fica a cargo de uma camada superior.",
      },
    ],
    summary: [
      "O quadro carrega MAC de destino, MAC de origem, EtherType, dados e FCS.",
      "O campo de dados vai de 46 a 1500 bytes; o quadro mínimo completo tem 64 bytes.",
      "O EtherType diz qual protocolo está encapsulado: 0x0800 é IPv4 e 0x0806 é ARP.",
    ],
  },

  {
    href: "/curso/comutacao/elementos",
    source: "complementar",
    references: ["IEEE 802.3", "IEEE 802.1D"],
    whatIs:
      "Os elementos que compõem a operação de um switch: portas, enlaces, velocidade, modo duplex, negociação automática e a proteção contra laços de camada 2.",
    whyExists:
      "Grande parte dos problemas de desempenho numa rede comutada não está na configuração lógica, e sim nesses parâmetros. Um duplex incompatível derruba o desempenho de um enlace gigabit a níveis inutilizáveis sem gerar nenhum erro de configuração visível.",
    sections: [
      {
        kind: "prose",
        title: "Duplex e negociação",
        paragraphs: [
          "Half-duplex significa transmitir ou receber, um de cada vez. Full-duplex significa os dois simultaneamente, o que só é possível quando não há disputa pelo meio, isto é, quando há apenas um dispositivo em cada ponta.",
          "A negociação automática faz as duas pontas combinarem velocidade e duplex. Ela funciona bem quando ambos os lados estão em automático. O problema aparece quando um lado é fixado manualmente e o outro não: o lado automático não consegue detectar o duplex do outro, assume half-duplex por segurança, e o enlace fica com as pontas em modos diferentes.",
          "O sintoma é característico: o enlace funciona, mas com desempenho muito baixo e contadores de colisão tardia crescendo. Por isso a recomendação é deixar os dois lados em automático ou fixar os dois, nunca só um.",
        ],
      },
      {
        kind: "table",
        title: "Sinais de problema numa porta",
        caption: "Contadores de interface e o que costumam indicar",
        headers: ["Sintoma", "Causa provável"],
        rows: [
          ["Colisões tardias em enlace comutado", "duplex incompatível entre as pontas"],
          ["Erros de FCS crescendo", "cabo danificado, conector mal crimpado ou interferência"],
          ["Porta oscilando entre ativa e inativa", "cabo intermitente ou problema de alimentação no equipamento remoto"],
          ["Descartes na fila de saída", "porta congestionada; o tráfego excede a capacidade do enlace"],
        ],
      },
      {
        kind: "prose",
        title: "Laços de camada 2",
        paragraphs: [
          "Se dois switches forem interligados por dois caminhos, um quadro de broadcast passa a circular indefinidamente entre eles. Diferente do que acontece em camada 3, não existe TTL no quadro Ethernet para interromper o ciclo, e o quadro se multiplica a cada volta até saturar a rede. É a tempestade de broadcast.",
          "O protocolo de árvore de espalhamento resolve isso: os switches trocam informações entre si, elegem um ponto de referência e calculam quais portas devem ficar em bloqueio para que reste apenas um caminho ativo entre quaisquer dois pontos. Se o caminho ativo cair, uma porta bloqueada é reativada e a redundância física passa a ser usada.",
        ],
      },
      {
        kind: "callout",
        tone: "erro",
        title: "Por que a tempestade de broadcast é grave",
        body:
          "Sem TTL em camada 2, um laço não se auto-resolve: o tráfego cresce até consumir toda a capacidade dos enlaces e a memória dos switches. A rede inteira para, e desligar um cabo costuma ser a única forma rápida de interromper.",
      },
    ],
    commonErrors: [
      {
        mistake: "Fixar velocidade e duplex em apenas um lado do enlace.",
        why:
          "O lado em automático não detecta o duplex do outro e assume half-duplex. O enlace fica incompatível e o desempenho despenca sem erro aparente de configuração.",
      },
      {
        mistake: "Interligar switches por dois cabos para “dobrar a banda”.",
        why:
          "Sem agregação de enlaces configurada, isso cria um laço de camada 2. O resultado é tempestade de broadcast, não mais banda.",
      },
    ],
    summary: [
      "Duplex incompatível é uma das causas mais comuns e mais silenciosas de baixo desempenho.",
      "Deixe os dois lados do enlace em negociação automática, ou fixe os dois.",
      "Quadros Ethernet não têm TTL: laços de camada 2 exigem a árvore de espalhamento para não saturar a rede.",
    ],
  },

  {
    href: "/curso/comutacao/vlan",
    source: "complementar",
    references: ["IEEE 802.1Q"],
    whatIs:
      "VLAN é a divisão lógica de um switch em vários domínios de broadcast independentes. Portas na VLAN 10 e portas na VLAN 20 comportam-se como se estivessem em switches fisicamente separados.",
    whyExists:
      "Separar setores da rede exigiria, de outro modo, um switch para cada um. A VLAN permite fazer essa separação por configuração, agrupando portas por função e não por posição física. O agrupamento pode ser alterado sem mexer em cabo nenhum.",
    sections: [
      {
        kind: "topology",
        topology: "vlan",
        title: "A topologia deste exemplo",
      },
      {
        kind: "prose",
        title: "Porta de acesso e porta trunk",
        paragraphs: [
          "Uma porta de acesso pertence a uma única VLAN e conecta um dispositivo final. O quadro entra e sai dela sem nenhuma marcação: o computador ligado ali não sabe, e não precisa saber, que existe VLAN.",
          "Uma porta trunk transporta o tráfego de várias VLANs pelo mesmo cabo, tipicamente entre dois switches ou entre um switch e um roteador. Como um único enlace carrega quadros de VLANs diferentes, é preciso identificar a qual VLAN cada quadro pertence, e é isso que o 802.1Q faz.",
        ],
      },
      {
        kind: "prose",
        title: "A marcação 802.1Q",
        paragraphs: [
          "Ao sair por um trunk, o quadro recebe uma marcação de 4 bytes inserida entre o endereço MAC de origem e o campo EtherType. Dentro dela há um identificador de 12 bits que carrega o número da VLAN.",
          "Doze bits dariam de 0 a 4095, mas os valores 0 e 4095 são reservados: a faixa utilizável é de 1 a 4094. Ao chegar do outro lado, o switch lê a marcação, sabe em qual VLAN entregar o quadro e a remove antes de encaminhá-lo por uma porta de acesso.",
          "A VLAN nativa é a exceção: o tráfego dela atravessa o trunk sem marcação. Justamente por isso, ela precisa ser a mesma nas duas pontas: se divergir, cada lado interpretará o tráfego não marcado como pertencente a uma VLAN diferente.",
        ],
      },
      {
        kind: "dot1q",
        title: "Os quatro bytes entrando e saindo do quadro",
      },
      {
        kind: "simulator",
        href: "/simuladores/vlan",
        title: "Ver a marcação sendo inserida e removida",
        invite:
          "Envie quadros entre VLANs diferentes e acompanhe o que sai por cada porta do trunk.",
      },
      {
        kind: "code",
        title: "Criando VLANs e configurando as portas",
        code: `SW1(config)# vlan 10
SW1(config-vlan)# name Vendas
SW1(config-vlan)# exit
SW1(config)# vlan 20
SW1(config-vlan)# name Engenharia
SW1(config-vlan)# exit

! Portas de acesso
SW1(config)# interface range FastEthernet0/1 - 2
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 10
SW1(config-if-range)# exit

! Porta trunk
SW1(config)# interface GigabitEthernet0/1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20
SW1(config-if)# switchport trunk native vlan 99`,
        explanations: [
          {
            line: "switchport mode access",
            explanation:
              "Fixa a porta como de acesso. Sem isso, a porta pode negociar o modo automaticamente com o vizinho, o que é imprevisível e indesejável.",
          },
          {
            line: "switchport access vlan 10",
            explanation:
              "Associa a porta à VLAN 10. Todo quadro que entrar por ela passa a pertencer a essa VLAN.",
          },
          {
            line: "switchport trunk allowed vlan 10,20",
            explanation:
              "Restringe o trunk a transportar apenas essas VLANs. Permitir só o necessário reduz tráfego desnecessário e limita o alcance de um problema.",
          },
          {
            line: "switchport trunk native vlan 99",
            explanation:
              "Move a VLAN nativa para uma VLAN sem uso. Deixar a nativa na VLAN 1, onde há tráfego de controle, é uma prática desaconselhada.",
          },
        ],
      },
      {
        kind: "callout",
        tone: "atencao",
        title: "VLANs diferentes não se falam sozinhas",
        body:
          "Segmentar em VLANs cria domínios de broadcast independentes, e é por isso que hosts de VLANs diferentes não se comunicam em camada 2. Para que voltem a se comunicar, é preciso um roteador ou um switch multicamada fazendo o roteamento entre elas.",
      },
    ],
    commonErrors: [
      {
        mistake: "Esperar que hosts de VLANs diferentes se comuniquem sem roteador.",
        why:
          "A separação é o objetivo da VLAN. Sem um equipamento de camada 3 entre elas, não há caminho.",
      },
      {
        mistake: "Configurar VLANs nativas diferentes nas duas pontas do trunk.",
        why:
          "O tráfego sem marcação é interpretado como de VLANs diferentes em cada lado, e o resultado é comunicação entre VLANs que deveriam estar separadas.",
      },
      {
        mistake: "Deixar a porta em modo dinâmico e supor que é trunk.",
        why:
          "O modo negociado depende do vizinho e pode mudar. Fixe explicitamente access ou trunk em cada porta.",
      },
      {
        mistake: "Criar a VLAN e esquecer de associá-la às portas.",
        why:
          "A VLAN existe no equipamento, mas nenhuma porta pertence a ela. show vlan brief mostra a VLAN sem portas, que é o sinal do que faltou.",
      },
    ],
    summary: [
      "VLAN cria domínios de broadcast independentes dentro do mesmo switch físico.",
      "Porta de acesso pertence a uma VLAN e não marca; trunk transporta várias e marca com 802.1Q.",
      "A faixa válida de VLAN é 1 a 4094, e a VLAN nativa trafega sem marcação nas duas pontas.",
    ],
  },
];
