import {
  BROADCAST_MAC,
  processFrame,
  type CamEntry,
  type ForwardAction,
  type Frame,
  type SwitchPort,
} from "./switching";

export interface StoryHost {
  id: string;
  name: string;
  mac: string;
  port: string;
}

export const STORY_HOSTS: StoryHost[] = [
  { id: "a", name: "PC-A", mac: "00:1a:2b:00:00:0a", port: "Fa0/1" },
  { id: "b", name: "PC-B", mac: "00:1a:2b:00:00:0b", port: "Fa0/2" },
  { id: "c", name: "PC-C", mac: "00:1a:2b:00:00:0c", port: "Fa0/3" },
  { id: "d", name: "PC-D", mac: "00:1a:2b:00:00:0d", port: "Fa0/4" },
];

export const STORY_PORTS: SwitchPort[] = STORY_HOSTS.map((h) => ({
  id: h.port,
  label: h.port,
  mode: "access",
  vlan: 1,
}));

export function hostByMac(mac: string): StoryHost | undefined {
  return STORY_HOSTS.find((h) => h.mac === mac);
}

export function hostByPort(port: string): StoryHost | undefined {
  return STORY_HOSTS.find((h) => h.port === port);
}

export type StoryBeat =
  | "vazia"
  | "aprende-origem"
  | "destino-desconhecido"
  | "destino-conhecido"
  | "broadcast";

export interface CamStoryStep {
  index: number;
  id: string;
  beat: StoryBeat;
  title: string;

  narrative: string;

  lesson?: string;
  frame: Frame | null;
  action: ForwardAction | null;
  egressPorts: string[];

  learned: CamEntry | null;
  camBefore: CamEntry[];
  camAfter: CamEntry[];
}

interface Envio {
  de: string;
  para: string;
  beat: StoryBeat;
  title: string;
  narrative: string;
  lesson?: string;
}

const ROTEIRO: Envio[] = [
  {
    de: "a",
    para: "b",
    beat: "destino-desconhecido",
    title: "PC-A envia para PC-B",
    narrative:
      "O switch anota o MAC de origem na porta em que o quadro entrou. O destino ainda não está na tabela.",
    lesson:
      "Aprender e encaminhar são decisões separadas: uma olha a origem, a outra olha o destino.",
  },
  {
    de: "b",
    para: "a",
    beat: "destino-conhecido",
    title: "PC-B responde para PC-A",
    narrative:
      "A resposta ensina a porta de PC-B e, como PC-A já está na tabela, sai por uma porta só.",
    lesson:
      "Foi a inundação anterior que tornou esta resposta possível — e a resposta é o que encerra a inundação.",
  },
  {
    de: "c",
    para: "a",
    beat: "aprende-origem",
    title: "PC-C envia para PC-A",
    narrative:
      "Terceiro host, terceira linha na tabela. O destino já era conhecido, então não há inundação.",
  },
  {
    de: "a",
    para: "c",
    beat: "destino-conhecido",
    title: "PC-A envia para PC-C",
    narrative:
      "Os dois lados já são conhecidos: o quadro atravessa o switch sem que PC-B e PC-D vejam nada.",
    lesson:
      "É esta a diferença entre um switch e um hub — o tráfego de A para C não consome as outras portas.",
  },
  {
    de: "a",
    para: "broadcast",
    beat: "broadcast",
    title: "PC-A envia um broadcast",
    narrative:
      "Com a tabela cheia, o broadcast ainda sai por todas as portas da VLAN. A CAM não o restringe.",
    lesson:
      "Tabela cheia não elimina broadcast. Só a VLAN, ou um roteador, delimita o domínio de broadcast.",
  },
];

export function buildCamStory(): CamStoryStep[] {
  const passos: CamStoryStep[] = [
    {
      index: 0,
      id: "vazia",
      beat: "vazia",
      title: "Tabela vazia",
      narrative:
        "O switch acabou de ligar. Ele não sabe onde nenhum host está — e ninguém o configurou para saber.",
      lesson:
        "A CAM não vem escrita: ela é construída pelo próprio tráfego, quadro a quadro.",
      frame: null,
      action: null,
      egressPorts: [],
      learned: null,
      camBefore: [],
      camAfter: [],
    },
  ];

  let cam: CamEntry[] = [];

  ROTEIRO.forEach((envio, i) => {
    const origem = STORY_HOSTS.find((h) => h.id === envio.de)!;
    const destinoMac =
      envio.para === "broadcast"
        ? BROADCAST_MAC
        : STORY_HOSTS.find((h) => h.id === envio.para)!.mac;

    const frame: Frame = {
      sourceMac: origem.mac,
      destinationMac: destinoMac,
      ingressPort: origem.port,
      vlan: 1,
      tagged: false,
    };

    const antes = cam;
    const resultado = processFrame(cam, STORY_PORTS, frame, i + 1);
    cam = resultado.cam;

    passos.push({
      index: passos.length,
      id: `${envio.de}-${envio.para}`,
      beat: envio.beat,
      title: envio.title,
      narrative: envio.narrative,
      lesson: envio.lesson,
      frame,
      action: resultado.action,
      egressPorts: resultado.egressPorts,
      learned: resultado.learned,
      camBefore: antes,
      camAfter: resultado.cam,
    });
  });

  return passos;
}

export const CAM_STORY: CamStoryStep[] = buildCamStory();

export const ACTION_LABEL: Record<ForwardAction, string> = {
  encaminhar: "Encaminhar",
  inundar: "Inundar",
  filtrar: "Filtrar",
  descartar: "Descartar",
};
