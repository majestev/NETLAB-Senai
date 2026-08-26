import type { ContentSource } from "./source";

export interface QuizOption {
  id: string;
  label: string;
  correct: boolean;

  why: string;
}

export interface QuizQuestion {
  id: string;
  moduleId: string;
  lesson: string;

  section: string;
  prompt: string;
  options: QuizOption[];
  source: ContentSource;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "q-lpm",
    section: "1.1",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/fundamentos",
    prompt:
      "A tabela tem 10.0.0.0/8 com métrica 1 e 10.1.1.0/24 com métrica 10. Para onde vai um pacote destinado a 10.1.1.5?",
    source: "complementar",
    options: [
      { id: "a", label: "Pela rota /8, que tem métrica menor.", correct: false, why: "A métrica só é comparada entre rotas de mesmo prefixo e mesma distância administrativa. O prefixo é decidido antes." },
      { id: "b", label: "Pela rota /24, por ser o prefixo mais longo.", correct: true, why: "Prefixo mais longo é o primeiro critério: a entrada mais específica vence, independentemente da métrica." },
      { id: "c", label: "É descartado por ambiguidade.", correct: false, why: "Não há ambiguidade: existe uma regra de desempate determinística." },
    ],
  },
  {
    id: "q-ad",
    section: "1.1",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/fundamentos",
    prompt: "Qual é a distância administrativa de uma rota estática?",
    source: "complementar",
    options: [
      { id: "a", label: "0", correct: false, why: "0 é de rede diretamente conectada, a origem mais confiável de todas." },
      { id: "b", label: "1", correct: true, why: "Rota estática tem AD 1, ficando atrás apenas das redes conectadas." },
      { id: "c", label: "120", correct: false, why: "120 é a distância administrativa do RIP, uma das mais altas entre os protocolos usuais, justamente porque o vetor de distância é considerado menos confiável que o estado de enlace." },
    ],
  },
  {
    id: "q-ttl",
    section: "1.1",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/fundamentos",
    prompt: "O que acontece com o campo TTL ao longo do caminho de um pacote?",
    source: "complementar",
    options: [
      { id: "a", label: "É decrementado em 1 por cada roteador que encaminha o pacote.", correct: true, why: "Ao chegar a zero o pacote é descartado, o que impede circulação infinita em caso de laço." },
      { id: "b", label: "É decrementado por cada switch atravessado.", correct: false, why: "Switch opera em camada 2 e não toca no cabeçalho IP." },
      { id: "c", label: "Permanece constante de ponta a ponta.", correct: false, why: "O que permanece constante são os endereços IP de origem e destino." },
    ],
  },
  {
    id: "q-rota-inversa",
    section: "1.2",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/estatico",
    prompt:
      "Você configurou a rota estática só em R1. O ping da LAN de R1 para a LAN de R2 falha. Por quê?",
    source: "complementar",
    options: [
      { id: "a", label: "A rota de R1 está errada.", correct: false, why: "A rota pode estar perfeita; o problema é o que falta do outro lado." },
      { id: "b", label: "Falta a rota inversa em R2, para o pacote de resposta voltar.", correct: true, why: "Roteamento é por sentido: a resposta é um pacote novo e precisa da própria rota." },
      { id: "c", label: "Rotas estáticas não funcionam com ping.", correct: false, why: "Não há relação entre o tipo de rota e o protocolo de teste." },
    ],
  },
  {
    id: "q-default",
    section: "1.2",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/estatico",
    prompt: "O que representa a rota 0.0.0.0/0?",
    source: "complementar",
    options: [
      { id: "a", label: "A rota padrão, usada quando nenhuma entrada mais específica casa.", correct: true, why: "Com prefixo /0 ela casa com qualquer destino, e por ser a menos específica só é escolhida em último caso." },
      { id: "b", label: "Uma rota inválida.", correct: false, why: "É uma rota perfeitamente válida e presente em praticamente toda rede conectada à internet." },
      { id: "c", label: "A rota para a rede local.", correct: false, why: "A rede local aparece como rota conectada, com prefixo específico." },
    ],
  },
  {
    id: "q-vetor",
    section: "1.3",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/dinamico",
    prompt: "O que caracteriza um protocolo por vetor de distância?",
    source: "complementar",
    options: [
      { id: "a", label: "Cada roteador anuncia o estado dos próprios enlaces a todo o domínio.", correct: false, why: "Essa é a descrição de protocolos por estado de enlace, como o OSPF." },
      { id: "b", label: "Cada roteador anuncia aos vizinhos as redes que conhece e a que distância estão.", correct: true, why: "Por isso se diz que ele enxerga a rede pelos olhos do vizinho: não há mapa completo da topologia." },
      { id: "c", label: "Cada roteador calcula a árvore de caminhos mais curtos.", correct: false, why: "O cálculo de árvore de caminhos mais curtos é característico do estado de enlace." },
    ],
  },
  {
    id: "q-rip-16",
    section: "1.5",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/rip",
    prompt: "No RIP, o que significa uma rota com métrica 16?",
    source: "complementar",
    options: [
      { id: "a", label: "Rede inalcançável.", correct: true, why: "16 é o infinito do RIP. É o teto que impede a contagem ao infinito de crescer indefinidamente." },
      { id: "b", label: "A rede está a 16 saltos.", correct: false, why: "A métrica máxima utilizável é 15." },
      { id: "c", label: "A rota tem prioridade máxima.", correct: false, why: "No RIP, métrica menor é melhor." },
    ],
  },
  {
    id: "q-split",
    section: "1.5",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/rip",
    prompt: "O que o split horizon evita?",
    source: "complementar",
    options: [
      { id: "a", label: "Que a métrica passe de 15.", correct: false, why: "Quem limita a métrica é o valor 16 como infinito." },
      { id: "b", label: "Que um roteador anuncie uma rota de volta pela interface por onde a aprendeu.", correct: true, why: "Sem essa regra, dois roteadores passariam a se apoiar mutuamente numa rota que já não existe." },
      { id: "c", label: "Que dois roteadores anunciem simultaneamente.", correct: false, why: "Anúncios simultâneos são o funcionamento normal do protocolo." },
    ],
  },
  {
    id: "q-ripv2",
    section: "1.5",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/rip",
    prompt: "Por que o RIPv1 não funciona bem com VLSM?",
    source: "complementar",
    options: [
      { id: "a", label: "Porque não carrega a máscara de sub-rede nos anúncios.", correct: true, why: "Sem a máscara, sub-redes de tamanhos diferentes dentro do mesmo bloco não podem ser divulgadas corretamente. Daí a necessidade de version 2 e no auto-summary." },
      { id: "b", label: "Porque tem limite de 15 saltos.", correct: false, why: "O limite de saltos existe nas duas versões e não tem relação com máscara variável." },
      { id: "c", label: "Porque é um protocolo de estado de enlace.", correct: false, why: "O RIP é vetor de distância nas duas versões." },
    ],
  },
  {
    id: "q-hosts",
    section: "1.4",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/classful-classless",
    prompt: "Quantos hosts utilizáveis tem uma sub-rede /26?",
    source: "complementar",
    options: [
      { id: "a", label: "64", correct: false, why: "64 é o total de endereços do bloco, incluindo rede e broadcast." },
      { id: "b", label: "62", correct: true, why: "São 6 bits de host: 2^6 = 64 endereços, menos o de rede e o de broadcast." },
      { id: "c", label: "30", correct: false, why: "30 hosts utilizáveis corresponde a um /27." },
    ],
  },
  {
    id: "q-rede",
    section: "1.4",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/classful-classless",
    prompt: "Qual é o endereço de rede de 192.168.10.77/26?",
    source: "complementar",
    options: [
      { id: "a", label: "192.168.10.64", correct: true, why: "Blocos /26 começam de 64 em 64: .0, .64, .128 e .192. O endereço .77 está no bloco que começa em .64." },
      { id: "b", label: "192.168.10.0", correct: false, why: "Seria o endereço de rede se a máscara fosse /24." },
      { id: "c", label: "192.168.10.76", correct: false, why: "Endereços de rede de um /26 são múltiplos de 64; .76 não é um deles." },
    ],
  },
  {
    id: "q-wildcard",
    section: "1.4",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/classful-classless",
    prompt: "Qual é a máscara curinga correspondente a 255.255.255.192?",
    source: "complementar",
    options: [
      { id: "a", label: "0.0.0.63", correct: true, why: "O curinga é o complemento bit a bit da máscara: onde a máscara tem 1, o curinga tem 0." },
      { id: "b", label: "0.0.0.255", correct: false, why: "0.0.0.255 é o curinga de uma máscara /24." },
      { id: "c", label: "255.255.255.63", correct: false, why: "O curinga não repete os octetos da máscara; ele os inverte." },
    ],
  },
  {
    id: "q-vlsm-ordem",
    section: "1.4",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/classful-classless",
    prompt: "Ao aplicar VLSM, por qual sub-rede se deve começar a alocação?",
    source: "complementar",
    options: [
      { id: "a", label: "Pela que precisa de mais hosts.", correct: true, why: "Alocar da maior para a menor mantém os blocos alinhados e evita fragmentar o espaço." },
      { id: "b", label: "Pela que precisa de menos hosts.", correct: false, why: "Começar pelas menores empurra as maiores para o fim, onde já não há espaço contíguo." },
      { id: "c", label: "Pela ordem do enunciado.", correct: false, why: "A ordem do enunciado é arbitrária e não tem relação com o aproveitamento do bloco." },
    ],
  },
  {
    id: "q-privado",
    section: "1.4",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/classful-classless",
    prompt: "Qual destes blocos NÃO é de endereçamento privado?",
    source: "complementar",
    options: [
      { id: "a", label: "10.0.0.0/8", correct: false, why: "É um dos três blocos privados definidos pelo RFC 1918." },
      { id: "b", label: "172.16.0.0/12", correct: false, why: "Também é privado pelo RFC 1918, cobrindo de 172.16 a 172.31." },
      { id: "c", label: "203.0.113.0/24", correct: true, why: "É um bloco de documentação do RFC 5737, reservado para exemplos e não para uso privado em redes reais." },
    ],
  },
  {
    id: "q-cli-modo",
    section: "2",
    moduleId: "interfaces",
    lesson: "/curso/interfaces/gui-cli",
    prompt: "O prompt mostra SW1(config-if)#. Onde você está?",
    source: "complementar",
    options: [
      { id: "a", label: "No modo de configuração de uma interface.", correct: true, why: "O sufixo config-if indica que os comandos daqui em diante afetam a interface selecionada." },
      { id: "b", label: "No modo usuário.", correct: false, why: "O modo usuário termina em > e não permite configuração." },
      { id: "c", label: "No modo privilegiado.", correct: false, why: "O modo privilegiado é apenas SW1#, sem parênteses." },
    ],
  },
  {
    id: "q-salvar",
    section: "2",
    moduleId: "interfaces",
    lesson: "/curso/interfaces/gui-cli",
    prompt: "Você configurou tudo, testou e funcionou. O switch reinicia e a configuração sumiu. O que faltou?",
    source: "complementar",
    options: [
      { id: "a", label: "copy running-config startup-config", correct: true, why: "A configuração ativa vive em memória volátil. Sem copiá-la para a de inicialização, ela se perde no reinício." },
      { id: "b", label: "reload", correct: false, why: "reload reinicia o equipamento, que é exatamente o que causou a perda." },
      { id: "c", label: "show running-config", correct: false, why: "É um comando de exibição; não altera nem salva nada." },
    ],
  },
  {
    id: "q-captura",
    section: "3",
    moduleId: "analisadores",
    lesson: "/curso/analisadores/captura",
    prompt:
      "Numa captura feita na LAN do cliente, os pacotes vindos do servidor remoto trazem qual MAC de origem?",
    source: "complementar",
    options: [
      { id: "a", label: "O do servidor remoto.", correct: false, why: "O MAC do servidor só vale dentro do segmento dele; foi substituído no caminho." },
      { id: "b", label: "O do roteador local, que fez o último salto.", correct: true, why: "Cada roteador reescreve o quadro. Na LAN do cliente, o quadro foi montado pelo gateway local." },
      { id: "c", label: "O de broadcast.", correct: false, why: "Broadcast só aparece em quadros destinados a todos, como uma requisição ARP." },
    ],
  },
  {
    id: "q-ativo",
    section: "4",
    moduleId: "ativos",
    lesson: "/curso/ativos/equipamentos",
    prompt: "Qual equipamento separa domínios de broadcast por padrão?",
    source: "complementar",
    options: [
      { id: "a", label: "Hub", correct: false, why: "O hub não separa nada: replica o sinal em todas as portas." },
      { id: "b", label: "Switch", correct: false, why: "O switch separa domínios de colisão. Sem VLAN, todas as portas ficam no mesmo domínio de broadcast." },
      { id: "c", label: "Roteador", correct: true, why: "O roteador não encaminha broadcast de camada 2 entre suas interfaces, o que delimita o domínio." },
    ],
  },
  {
    id: "q-mac-origem",
    section: "5.3",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/cam",
    prompt: "Com qual campo do quadro o switch popula a tabela CAM?",
    source: "complementar",
    options: [
      { id: "a", label: "O MAC de origem.", correct: true, why: "O quadro chegou por aquela porta trazendo aquele MAC de origem: é a única informação confiável de localização que o switch tem." },
      { id: "b", label: "O MAC de destino.", correct: false, why: "Aprender pelo destino registraria a posição de um host do qual nada foi recebido ainda." },
      { id: "c", label: "O endereço IP de origem.", correct: false, why: "Um switch de camada 2 não examina o cabeçalho IP." },
    ],
  },
  {
    id: "q-inundacao",
    section: "5.3",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/cam",
    prompt: "O que o switch faz com um quadro cujo MAC de destino não está na tabela CAM?",
    source: "complementar",
    options: [
      { id: "a", label: "Descarta.", correct: false, why: "Descartar impediria qualquer primeira comunicação." },
      { id: "b", label: "Inunda por todas as portas da VLAN, exceto a de entrada.", correct: true, why: "É assim que o quadro chega ao destino antes de o switch saber onde ele está. A resposta ensina a porta correta." },
      { id: "c", label: "Devolve pela porta de entrada.", correct: false, why: "Devolver ao segmento de origem não teria utilidade, e é justamente o que a filtragem evita." },
    ],
  },
  {
    id: "q-colisao",
    section: "5.2",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/colisoes",
    prompt: "Quantos domínios de colisão tem um switch de 8 portas com todas ocupadas?",
    source: "complementar",
    options: [
      { id: "a", label: "1", correct: false, why: "Um único domínio de colisão é o comportamento de um hub." },
      { id: "b", label: "8", correct: true, why: "Cada porta de switch é um domínio de colisão independente, porque o quadro é armazenado antes de ser encaminhado." },
      { id: "c", label: "Depende da VLAN.", correct: false, why: "VLAN afeta domínios de broadcast, não de colisão." },
    ],
  },
  {
    id: "q-metodos",
    section: "5.4",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/metodos",
    prompt: "Qual método de encaminhamento verifica o FCS antes de encaminhar?",
    source: "complementar",
    options: [
      { id: "a", label: "Cut-through", correct: false, why: "O cut-through encaminha logo após ler o MAC de destino; o FCS, que está no fim, nem chegou ainda." },
      { id: "b", label: "Fragment-free", correct: false, why: "Ele espera 64 bytes e descarta fragmentos, mas não confere o FCS." },
      { id: "c", label: "Store-and-forward", correct: true, why: "É o único que recebe o quadro inteiro, o que é condição necessária para conferir o campo de verificação final." },
    ],
  },
  {
    id: "q-ethernet",
    section: "5.6",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/ethernet",
    prompt: "O que o campo EtherType de um quadro Ethernet II indica?",
    source: "complementar",
    options: [
      { id: "a", label: "O protocolo encapsulado, como 0x0800 para IPv4.", correct: true, why: "É o que permite ao receptor saber a quem entregar o conteúdo do quadro: IPv4, ARP e assim por diante." },
      { id: "b", label: "O comprimento do quadro.", correct: false, why: "Comprimento é o significado desse campo no formato original do 802.3; valores acima de 1536 indicam EtherType." },
      { id: "c", label: "A VLAN a que o quadro pertence.", correct: false, why: "A VLAN é indicada pela marcação 802.1Q, inserida antes do EtherType." },
    ],
  },
  {
    id: "q-vlan-comunicacao",
    section: "5.8",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/vlan",
    prompt:
      "PC1 está na VLAN 10 e PC2 na VLAN 20, no mesmo switch, sem roteador. Eles se comunicam?",
    source: "complementar",
    options: [
      { id: "a", label: "Sim, estão no mesmo switch.", correct: false, why: "Estar no mesmo equipamento físico é irrelevante: VLANs são domínios de broadcast separados." },
      { id: "b", label: "Não, sem um equipamento de camada 3 entre as VLANs.", correct: true, why: "Separar é justamente o objetivo da VLAN. A comunicação exige roteamento entre elas." },
      { id: "c", label: "Só se estiverem na mesma porta.", correct: false, why: "Uma porta de acesso pertence a uma única VLAN." },
    ],
  },
  {
    id: "q-8021q",
    section: "5.8",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/vlan",
    prompt: "Qual é a faixa de identificadores de VLAN utilizáveis em 802.1Q?",
    source: "complementar",
    options: [
      { id: "a", label: "1 a 4094", correct: true, why: "O campo tem 12 bits, o que daria 0 a 4095; os extremos 0 e 4095 são reservados." },
      { id: "b", label: "1 a 1024", correct: false, why: "Esse valor não corresponde a nenhum limite do padrão." },
      { id: "c", label: "0 a 4095", correct: false, why: "É a faixa bruta de 12 bits, mas 0 e 4095 não podem ser atribuídos a VLANs." },
    ],
  },
  {
    id: "q-nativa",
    section: "5.8",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/vlan",
    prompt: "O que acontece com o tráfego da VLAN nativa ao atravessar um trunk?",
    source: "complementar",
    options: [
      { id: "a", label: "Atravessa sem marcação 802.1Q.", correct: true, why: "É a definição de VLAN nativa, e por isso ela precisa ser a mesma nas duas pontas do trunk." },
      { id: "b", label: "É bloqueado.", correct: false, why: "Ela trafega normalmente; apenas não recebe marcação." },
      { id: "c", label: "Recebe marcação dupla.", correct: false, why: "Marcação dupla é característica de outros cenários, não do comportamento normal da VLAN nativa." },
    ],
  },
  {
    id: "q-wep",
    section: "6.2",
    moduleId: "redes-sem-fio",
    lesson: "/curso/redes-sem-fio/seguranca",
    prompt: "Por que o WEP é considerado obsoleto?",
    source: "complementar",
    options: [
      { id: "a", label: "Porque usa senhas curtas demais.", correct: false, why: "O problema é estrutural e não se resolve com uma senha melhor." },
      { id: "b", label: "Porque o vetor de inicialização se repete e permite recuperar a chave.", correct: true, why: "O vetor é curto e transmitido em claro; a repetição com chave fixa abre caminho para análise estatística do tráfego capturado." },
      { id: "c", label: "Porque é lento.", correct: false, why: "Desempenho não é o motivo do abandono." },
    ],
  },
  {
    id: "q-11i",
    section: "6.2",
    moduleId: "redes-sem-fio",
    lesson: "/curso/redes-sem-fio/seguranca",
    prompt: "Qual padrão do IEEE é a base do WPA2?",
    source: "complementar",
    options: [
      { id: "a", label: "IEEE 802.11i", correct: true, why: "É a emenda de segurança do 802.11; o WPA2 é a certificação da Wi-Fi Alliance construída sobre ela." },
      { id: "b", label: "IEEE 802.1Q", correct: false, why: "802.1Q é marcação de VLAN em redes cabeadas." },
      { id: "c", label: "IEEE 802.3", correct: false, why: "802.3 é o padrão Ethernet." },
    ],
  },
  {
    id: "q-ssid",
    section: "6.1",
    moduleId: "redes-sem-fio",
    lesson: "/curso/redes-sem-fio/configuracao",
    prompt: "Ocultar o SSID torna a rede sem fio segura?",
    source: "complementar",
    options: [
      { id: "a", label: "Sim, a rede fica invisível.", correct: false, why: "O nome continua aparecendo nos quadros trocados durante a associação de clientes legítimos." },
      { id: "b", label: "Não; é obscuridade, e a proteção vem da cifragem.", correct: true, why: "Ocultar atrapalha usuários legítimos sem impedir quem está capturando tráfego." },
      { id: "c", label: "Sim, desde que combinado com filtro de MAC.", correct: false, why: "Endereços MAC trafegam em claro e podem ser copiados; o filtro também não é barreira de segurança." },
    ],
  },
  {
    id: "q-canais",
    section: "6.1",
    moduleId: "redes-sem-fio",
    lesson: "/curso/redes-sem-fio/configuracao",
    prompt: "Por que se usam os canais 1, 6 e 11 na faixa de 2,4 GHz?",
    source: "complementar",
    options: [
      { id: "a", label: "São os únicos que não se sobrepõem entre si.", correct: true, why: "Cada canal ocupa uma largura maior que o espaçamento entre canais vizinhos; esses três estão suficientemente afastados." },
      { id: "b", label: "São os mais rápidos.", correct: false, why: "A velocidade não depende do número do canal." },
      { id: "c", label: "São os únicos permitidos.", correct: false, why: "A faixa tem mais canais disponíveis; a escolha é técnica, não regulatória." },
    ],
  },
  {
    id: "q-mac-estrutura",
    section: "5.1",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/mac",
    prompt: "O que identificam os três primeiros octetos de um endereço MAC?",
    source: "complementar",
    options: [
      { id: "a", label: "O fabricante da interface de rede.", correct: true, why: "São o identificador único da organização, atribuído pelo IEEE. Os três últimos octetos são atribuídos pelo próprio fabricante a cada interface." },
      { id: "b", label: "A rede a que o host pertence.", correct: false, why: "O endereço MAC é plano: não carrega informação de rede. Quem faz isso é o endereço IP." },
      { id: "c", label: "A VLAN da porta.", correct: false, why: "A VLAN é indicada pela marcação 802.1Q no trunk, não pelo endereço MAC." },
    ],
  },
  {
    id: "q-sw-ip",
    section: "5.5",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/configuracao",
    prompt: "Onde se configura o endereço IP de gerência de um switch de camada 2?",
    source: "complementar",
    options: [
      { id: "a", label: "Na porta física usada para administração.", correct: false, why: "Num switch de camada 2 as portas físicas não recebem endereço IP: elas encaminham quadros." },
      { id: "b", label: "Numa interface virtual de VLAN.", correct: true, why: "O endereço fica em uma interface de VLAN, normalmente a VLAN 1 ou uma VLAN de gerência dedicada, e serve só para administrar o equipamento." },
      { id: "c", label: "No comando ip default-gateway.", correct: false, why: "Esse comando define o gateway para o tráfego de gerência sair da própria sub-rede, não o endereço do switch." },
    ],
  },
  {
    id: "q-duplex",
    section: "5.7",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/elementos",
    prompt:
      "Um enlace gigabit entre switch e servidor está lentíssimo e mostra colisões tardias. Qual é a causa mais provável?",
    source: "complementar",
    options: [
      { id: "a", label: "Duplex incompatível entre as pontas.", correct: true, why: "Se um lado está fixo e o outro em automático, o automático não detecta o duplex do vizinho e assume half-duplex. O enlace funciona, mas com desempenho péssimo, e colisão tardia em rede comutada é o sintoma característico." },
      { id: "b", label: "Cabo curto demais.", correct: false, why: "Comprimento insuficiente não é um problema em par trançado; o limite é máximo, não mínimo." },
      { id: "c", label: "Excesso de VLANs no switch.", correct: false, why: "A quantidade de VLANs não afeta o duplex de um enlace." },
    ],
  },
  {
    id: "q-loop-l2",
    section: "5.7",
    moduleId: "comutacao",
    lesson: "/curso/comutacao/elementos",
    prompt:
      "Por que um laço de camada 2 é mais grave que um laço de camada 3?",
    source: "complementar",
    options: [
      { id: "a", label: "Porque o quadro Ethernet não tem TTL para interromper o ciclo.", correct: true, why: "Sem TTL, o quadro se multiplica a cada volta até saturar os enlaces e a memória dos switches. Em camada 3, o TTL zera e o pacote é descartado." },
      { id: "b", label: "Porque switches são mais lentos que roteadores.", correct: false, why: "Velocidade não é o fator; a ausência de um mecanismo de expiração é." },
      { id: "c", label: "Porque afeta apenas broadcast.", correct: false, why: "O broadcast é o que satura mais rápido, mas o problema é estrutural, não limitado a um tipo de quadro." },
    ],
  },
  {
    id: "q-rip-versoes",
    section: "1.5",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/rip",
    prompt: "Qual é a diferença essencial entre RIPv1 e RIPv2?",
    source: "complementar",
    options: [
      { id: "a", label: "O RIPv2 envia a máscara junto com a rede no anúncio.", correct: true, why: "É o que o torna classless e compatível com VLSM e CIDR. O RIPv1 é classful e obriga o vizinho a deduzir a máscara pela classe do endereço. O RIPv2 também usa multicast 224.0.0.9 e suporta autenticação." },
      { id: "b", label: "O RIPv2 aumenta o limite de saltos para 30.", correct: false, why: "As duas versões mantêm o máximo de 15 saltos, com 16 significando inalcançável." },
      { id: "c", label: "O RIPv2 é um protocolo de estado de enlace.", correct: false, why: "As duas versões são vetor de distância." },
    ],
  },
  {
    id: "q-rip-timers",
    section: "1.5",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/rip",
    prompt:
      "Quanto tempo uma rota RIP fica sem receber atualização até ser marcada como inalcançável?",
    source: "complementar",
    options: [
      { id: "a", label: "30 segundos", correct: false, why: "30 segundos é o temporizador de update, o intervalo entre os anúncios periódicos." },
      { id: "b", label: "180 segundos", correct: true, why: "É o temporizador de invalid, ou timeout. Passado esse tempo sem notícia, a rota recebe métrica 16. A remoção efetiva só acontece depois, pelo temporizador de flush." },
      { id: "c", label: "240 segundos", correct: false, why: "240 segundos é o padrão Cisco do temporizador de flush, que remove a rota da tabela." },
    ],
  },
  {
    id: "q-poison-reverse",
    section: "1.5",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/rip",
    prompt: "O que o poison reverse faz que o split horizon simples não faz?",
    source: "complementar",
    options: [
      { id: "a", label: "Anuncia a rota de volta com métrica 16, em vez de apenas omiti-la.", correct: true, why: "O split horizon resolve por silêncio, que é ambíguo; o poison reverse afirma explicitamente que aquele caminho não serve. O custo é mais tráfego de atualização." },
      { id: "b", label: "Desliga o temporizador de holddown.", correct: false, why: "São mecanismos independentes; o holddown continua atuando depois da queda." },
      { id: "c", label: "Reduz o limite de saltos.", correct: false, why: "O limite de 15 saltos não é alterado por nenhum dos dois." },
    ],
  },
  {
    id: "q-ripng",
    section: "1.5",
    moduleId: "roteamento-ip",
    lesson: "/curso/roteamento-ip/rip",
    prompt: "Para que serve o RIPng?",
    source: "complementar",
    options: [
      { id: "a", label: "É a versão do RIP para IPv6.", correct: true, why: "Definido pelo RFC 2080, usa multicast FF02::9 e porta UDP 521, mantendo a contagem de saltos com máximo de 15." },
      { id: "b", label: "É uma versão do RIP com métrica baseada em largura de banda.", correct: false, why: "A métrica continua sendo contagem de saltos; métrica por largura de banda é característica do OSPF e do EIGRP." },
      { id: "c", label: "É o nome comercial do RIPv2.", correct: false, why: "São protocolos distintos, para famílias de endereçamento diferentes." },
    ],
  },
];
