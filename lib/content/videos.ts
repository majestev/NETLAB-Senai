import type { ContentSource } from "./source";

export interface VideoLesson {
  lesson: string;

  youtubeId: string;

  url: string;

  title: string;

  format?: "short";

  startAt?: number;

  source: ContentSource;
}

export const VIDEO_LESSONS: VideoLesson[] = [
  {
    lesson: "/curso/roteamento-ip/fundamentos",
    youtubeId: "y9Vx5l-th9Y",
    url: "https://www.youtube.com/watch?v=y9Vx5l-th9Y",
    title: "Roteamento IP: Fundamentos",
    source: "complementar",
  },
  {
    lesson: "/curso/roteamento-ip/estatico",
    youtubeId: "FEKhFQ52EC0",
    url: "https://www.youtube.com/watch?v=FEKhFQ52EC0",
    title: "Roteamento IP: Roteamento Estático",
    source: "complementar",
  },
  {
    lesson: "/curso/roteamento-ip/dinamico",
    youtubeId: "NMQCcXG8TAU",
    url: "https://www.youtube.com/watch?v=NMQCcXG8TAU",
    title: "Roteamento IP: Roteamento Dinâmico",
    source: "complementar",
  },
  {
    lesson: "/curso/roteamento-ip/classful-classless",
    youtubeId: "eRd3m4WUZgw",
    url: "https://www.youtube.com/watch?v=eRd3m4WUZgw",
    title: "Roteamento IP: Classful / Classless",
    source: "complementar",
  },
  {
    lesson: "/curso/roteamento-ip/rip",
    youtubeId: "8jKNrWgFtUA",
    url: "https://www.youtube.com/watch?v=8jKNrWgFtUA",
    title: "Roteamento IP: RIP",
    source: "complementar",
  },

  {
    lesson: "/curso/interfaces/gui-cli",
    youtubeId: "5ZYE0-asJPs",
    url: "https://youtube.com/shorts/5ZYE0-asJPs?si=2CFqTnx931XIUBC6",
    title: "Interfaces: GUI e CLI",
    format: "short",
    source: "complementar",
  },

  {
    lesson: "/curso/analisadores/captura",
    youtubeId: "6yxtKx6Bhl8",
    url: "https://www.youtube.com/watch?v=6yxtKx6Bhl8&t=15s",
    title: "Analisadores: Captura de pacotes",
    startAt: 15,
    source: "complementar",
  },

  {
    lesson: "/curso/ativos/equipamentos",
    youtubeId: "XyXdYFh_mvw",
    url: "https://www.youtube.com/watch?v=XyXdYFh_mvw",
    title: "Ativos: Equipamentos",
    source: "complementar",
  },

  {
    lesson: "/curso/comutacao/mac",
    youtubeId: "16qSoSbrHn0",
    url: "https://www.youtube.com/watch?v=16qSoSbrHn0",
    title: "Comutação: Endereço MAC",
    source: "complementar",
  },
  {
    lesson: "/curso/comutacao/colisoes",
    youtubeId: "Z9gCrL1f43A",
    url: "https://www.youtube.com/watch?v=Z9gCrL1f43A",
    title: "Comutação: Colisão e broadcast",
    source: "complementar",
  },
  {
    lesson: "/curso/comutacao/cam",
    youtubeId: "6OjdzM5UGN4",
    url: "https://www.youtube.com/watch?v=6OjdzM5UGN4",
    title: "Comutação: Tabela CAM",
    source: "complementar",
  },
  {
    lesson: "/curso/comutacao/metodos",
    youtubeId: "_9KaK7mh7k8",
    url: "https://www.youtube.com/watch?v=_9KaK7mh7k8",
    title: "Comutação: Encaminhamento",
    source: "complementar",
  },
  {
    lesson: "/curso/comutacao/configuracao",
    youtubeId: "Sm-PIVGcrvc",
    url: "https://www.youtube.com/watch?v=Sm-PIVGcrvc",
    title: "Comutação: Configuração",
    source: "complementar",
  },
  {
    lesson: "/curso/comutacao/ethernet",
    youtubeId: "ESRaj4FOEKk",
    url: "https://www.youtube.com/watch?v=ESRaj4FOEKk",
    title: "Comutação: Ethernet / 802.3",
    source: "complementar",
  },
  {
    lesson: "/curso/comutacao/elementos",
    youtubeId: "DrrEh4T1-JY",
    url: "https://www.youtube.com/watch?v=DrrEh4T1-JY",
    title: "Comutação: Elementos",
    source: "complementar",
  },
  {
    lesson: "/curso/comutacao/vlan",
    youtubeId: "9C9TEmf1TkQ",
    url: "https://www.youtube.com/watch?v=9C9TEmf1TkQ",
    title: "Comutação: VLAN / 802.1Q",
    source: "complementar",
  },

  {
    lesson: "/curso/redes-sem-fio/configuracao",
    youtubeId: "aShTC0OtWr8",
    url: "https://www.youtube.com/watch?v=aShTC0OtWr8",
    title: "Redes sem fio: Configuração",
    source: "complementar",
  },
  {
    lesson: "/curso/redes-sem-fio/seguranca",
    youtubeId: "2jHuTZ1y0b8",
    url: "https://www.youtube.com/watch?v=2jHuTZ1y0b8",
    title: "Redes sem fio: Segurança",
    source: "complementar",
  },
];

export function getVideoForLesson(href: string): VideoLesson | undefined {
  return VIDEO_LESSONS.find((v) => v.lesson === href);
}

export function thumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function embedUrl(video: VideoLesson): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",

    hl: "pt-BR",
    cc_lang_pref: "pt",
  });
  if (video.startAt) params.set("start", String(video.startAt));
  return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?${params}`;
}
