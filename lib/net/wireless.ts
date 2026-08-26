export type WirelessSecurity = "aberta" | "wep" | "wpa2" | "wpa3";

export interface SecurityProfile {
  id: WirelessSecurity;
  name: string;

  handshake: string | null;
  cipher: string | null;

  status: "obsoleto" | "aceitável" | "recomendado" | "sem proteção";
  note: string;
}

export const SECURITY_PROFILES: SecurityProfile[] = [
  {
    id: "aberta",
    name: "Aberta",
    handshake: null,
    cipher: null,
    status: "sem proteção",
    note: "Sem cifragem no enlace: qualquer um dentro do alcance lê os quadros.",
  },
  {
    id: "wep",
    name: "WEP",
    handshake: "Chave compartilhada",
    cipher: "RC4 com vetor de inicialização curto",
    status: "obsoleto",
    note: "O vetor se repete com pouco tráfego; a chave é recuperável por análise estatística.",
  },
  {
    id: "wpa2",
    name: "WPA2",
    handshake: "Aperto de mão de quatro vias",
    cipher: "CCMP com AES",
    status: "aceitável",
    note: "Baseado no IEEE 802.11i. É o piso aceitável hoje.",
  },
  {
    id: "wpa3",
    name: "WPA3",
    handshake: "SAE — autenticação simultânea de iguais",
    cipher: "CCMP/GCMP com AES",
    status: "recomendado",
    note: "Protege melhor a troca inicial de chaves contra ataque de dicionário sobre captura.",
  },
];

export function securityProfile(id: WirelessSecurity): SecurityProfile {
  return SECURITY_PROFILES.find((p) => p.id === id)!;
}

export type WirelessPhase =
  | "desconectado"
  | "descoberta"
  | "autenticacao"
  | "associacao"
  | "cifragem"
  | "conectado"
  | "recusado";

export interface WirelessStep {
  index: number;
  id: string;
  phase: WirelessPhase;

  frame: string;
  direction: "cliente-ap" | "ap-cliente" | "ap-difusao" | "nenhuma";
  title: string;
  narrative: string;

  encrypted: boolean;

  failed?: boolean;
}

export interface AssociationOptions {
  security: WirelessSecurity;

  correctPassword: boolean;

  broadcastSsid: boolean;
  ssid: string;
}

export function buildAssociation(opts: AssociationOptions): WirelessStep[] {
  const perfil = securityProfile(opts.security);
  const passos: Array<Omit<WirelessStep, "index">> = [];

  passos.push({
    id: "inicio",
    phase: "desconectado",
    frame: "—",
    direction: "nenhuma",
    title: "Cliente desconectado",
    narrative:
      "O cliente tem o rádio ligado e ainda não pertence a nenhuma rede. Ele escuta o meio.",
    encrypted: false,
  });

  if (opts.broadcastSsid) {
    passos.push({
      id: "beacon",
      phase: "descoberta",
      frame: "Beacon",
      direction: "ap-difusao",
      title: "O ponto de acesso se anuncia",
      narrative: `O AP transmite beacons periódicos com o SSID "${opts.ssid}", o canal e os mecanismos de segurança que aceita. É assim que a rede aparece na lista.`,
      encrypted: false,
    });
  } else {
    passos.push({
      id: "beacon-oculto",
      phase: "descoberta",
      frame: "Beacon sem SSID",
      direction: "ap-difusao",
      title: "O SSID está oculto",
      narrative:
        "O beacon continua sendo transmitido, só que sem o nome. A rede não aparece na lista, mas o nome vai aparecer em claro nos quadros de associação a seguir.",
      encrypted: false,
    });
  }

  passos.push({
    id: "probe-req",
    phase: "descoberta",
    frame: "Probe Request",
    direction: "cliente-ap",
    title: "O cliente procura a rede",
    narrative: opts.broadcastSsid
      ? "O cliente pergunta quais redes estão ao alcance, para escolher a de melhor sinal."
      : `O cliente pergunta explicitamente por "${opts.ssid}" — e este pedido trafega em claro, ao alcance de qualquer um.`,
    encrypted: false,
  });

  passos.push({
    id: "probe-resp",
    phase: "descoberta",
    frame: "Probe Response",
    direction: "ap-cliente",
    title: "O ponto de acesso responde",
    narrative: `O AP confirma que atende "${opts.ssid}" e informa suas capacidades. O cliente agora sabe com quem falar.`,
    encrypted: false,
  });

  passos.push({
    id: "auth-req",
    phase: "autenticacao",
    frame: "Authentication",
    direction: "cliente-ap",
    title: "Autenticação 802.11",
    narrative:
      "Etapa herdada do padrão original. Em redes modernas ela é apenas formal: quem valida a senha é a troca de chaves, mais adiante.",
    encrypted: false,
  });

  passos.push({
    id: "auth-resp",
    phase: "autenticacao",
    frame: "Authentication (sucesso)",
    direction: "ap-cliente",
    title: "Autenticação aceita",
    narrative:
      "O AP aceita. Nenhuma senha foi verificada até aqui — é o erro de leitura mais comum desta sequência.",
    encrypted: false,
  });

  passos.push({
    id: "assoc-req",
    phase: "associacao",
    frame: "Association Request",
    direction: "cliente-ap",
    title: "Pedido de associação",
    narrative:
      "O cliente pede para entrar na rede, informando taxas suportadas e o mecanismo de segurança escolhido.",
    encrypted: false,
  });

  passos.push({
    id: "assoc-resp",
    phase: "associacao",
    frame: "Association Response",
    direction: "ap-cliente",
    title: "Associação aceita",
    narrative:
      "O AP aloca um identificador para o cliente. Existe associação, mas ainda não existe tráfego de dados permitido se houver segurança configurada.",
    encrypted: false,
  });

  if (perfil.handshake === null) {
    passos.push({
      id: "conectado-aberta",
      phase: "conectado",
      frame: "Dados",
      direction: "nenhuma",
      title: "Conectado, sem cifragem",
      narrative:
        "Não há troca de chaves porque não há chave. Os dados trafegam em claro no rádio, ao alcance de qualquer receptor próximo.",
      encrypted: false,
    });
    return passos.map((p, index) => ({ ...p, index }));
  }

  if (!opts.correctPassword) {
    passos.push({
      id: "handshake-falha",
      phase: "recusado",
      frame: perfil.handshake,
      direction: "cliente-ap",
      title: "A troca de chaves falha",
      narrative: `É aqui que a senha errada aparece — depois de autenticar e associar, não antes. O ${perfil.name} interrompe a ${perfil.handshake.toLowerCase()} e o cliente é desassociado.`,
      encrypted: false,
      failed: true,
    });
    return passos.map((p, index) => ({ ...p, index }));
  }

  passos.push({
    id: "handshake",
    phase: "cifragem",
    frame: perfil.handshake,
    direction: "cliente-ap",
    title: `${perfil.name}: ${perfil.handshake}`,
    narrative: `Cliente e AP provam um ao outro que conhecem a senha e derivam a chave de sessão. ${perfil.note}`,
    encrypted: false,
  });

  passos.push({
    id: "conectado",
    phase: "conectado",
    frame: "Dados cifrados",
    direction: "nenhuma",
    title: "Conectado e cifrado",
    narrative: `A partir daqui todo quadro de dados é cifrado com ${perfil.cipher}. Quem capturar o rádio vê tráfego, não conteúdo.`,
    encrypted: true,
  });

  return passos.map((p, index) => ({ ...p, index }));
}

export interface SignalQuality {
  rssi: number;

  bars: number;
  label: string;
  advice: string;
}

export function signalQuality(rssi: number): SignalQuality {
  if (rssi >= -60) {
    return {
      rssi,
      bars: 4,
      label: "Excelente",
      advice: "Taxa máxima disponível para o padrão negociado.",
    };
  }
  if (rssi >= -70) {
    return {
      rssi,
      bars: 3,
      label: "Bom",
      advice: "Suficiente para qualquer uso comum, inclusive vídeo.",
    };
  }
  if (rssi >= -80) {
    return {
      rssi,
      bars: 2,
      label: "Fraco",
      advice: "A taxa cai porque o cliente recua para modulações mais robustas.",
    };
  }
  return {
    rssi,
    bars: 1,
    label: "Insuficiente",
    advice: "Conexão instável. Aqui o caminho é posicionamento ou outro ponto de acesso, não mais potência.",
  };
}

export const CHANNEL_WIDTH_MHZ = 22;

export function channelCenter(channel: number): number {
  return 2407 + 5 * channel;
}

export interface ChannelSpan {
  channel: number;
  center: number;
  start: number;
  end: number;
}

export function channelSpan(channel: number): ChannelSpan {
  const center = channelCenter(channel);
  return {
    channel,
    center,
    start: center - CHANNEL_WIDTH_MHZ / 2,
    end: center + CHANNEL_WIDTH_MHZ / 2,
  };
}

export function channelOverlap(a: number, b: number): number {
  const x = channelSpan(a);
  const y = channelSpan(b);
  return Math.max(0, Math.min(x.end, y.end) - Math.max(x.start, y.start));
}

export const CHANNELS_24 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export const NON_OVERLAPPING_24 = [1, 6, 11] as const;
