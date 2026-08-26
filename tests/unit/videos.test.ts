import { test, expect } from "@playwright/test";
import { ALL_LESSONS } from "@/lib/content/curriculum";
import {
  VIDEO_LESSONS,
  embedUrl,
  getVideoForLesson,
  thumbnailUrl,
} from "@/lib/content/videos";

test("são 18 vídeos, um por aula", () => {
  expect(VIDEO_LESSONS).toHaveLength(18);
  expect(ALL_LESSONS).toHaveLength(18);
});

test("todo vídeo aponta para uma aula que existe", () => {
  const rotas = new Set(ALL_LESSONS.map((l) => l.href));
  const orfaos = VIDEO_LESSONS.filter((v) => !rotas.has(v.lesson)).map(
    (v) => v.lesson,
  );
  expect(orfaos, `vídeos sem aula: ${orfaos.join(", ")}`).toEqual([]);
});

test("toda aula tem exatamente um vídeo", () => {
  const semVideo = ALL_LESSONS.filter((l) => !getVideoForLesson(l.href)).map(
    (l) => l.href,
  );
  expect(semVideo, `aulas sem vídeo: ${semVideo.join(", ")}`).toEqual([]);

  const porAula = new Map<string, number>();
  for (const v of VIDEO_LESSONS) {
    porAula.set(v.lesson, (porAula.get(v.lesson) ?? 0) + 1);
  }
  const duplicados = [...porAula].filter(([, n]) => n > 1).map(([r]) => r);
  expect(duplicados, `aulas com mais de um vídeo: ${duplicados.join(", ")}`).toEqual(
    [],
  );
});

test("nenhum identificador de vídeo se repete", () => {
  const ids = VIDEO_LESSONS.map((v) => v.youtubeId);
  expect(new Set(ids).size, `ids repetidos em: ${ids.join(", ")}`).toBe(ids.length);
});

test("cada aula recebe o identificador que lhe foi atribuído", () => {
  const esperado: Array<[string, string]> = [
    ["/curso/roteamento-ip/fundamentos", "y9Vx5l-th9Y"],
    ["/curso/roteamento-ip/estatico", "FEKhFQ52EC0"],
    ["/curso/roteamento-ip/dinamico", "NMQCcXG8TAU"],
    ["/curso/roteamento-ip/classful-classless", "eRd3m4WUZgw"],
    ["/curso/roteamento-ip/rip", "8jKNrWgFtUA"],
    ["/curso/interfaces/gui-cli", "5ZYE0-asJPs"],
    ["/curso/analisadores/captura", "6yxtKx6Bhl8"],
    ["/curso/ativos/equipamentos", "XyXdYFh_mvw"],
    ["/curso/comutacao/mac", "16qSoSbrHn0"],
    ["/curso/comutacao/colisoes", "Z9gCrL1f43A"],
    ["/curso/comutacao/cam", "6OjdzM5UGN4"],
    ["/curso/comutacao/metodos", "_9KaK7mh7k8"],
    ["/curso/comutacao/configuracao", "Sm-PIVGcrvc"],
    ["/curso/comutacao/ethernet", "ESRaj4FOEKk"],
    ["/curso/comutacao/elementos", "DrrEh4T1-JY"],
    ["/curso/comutacao/vlan", "9C9TEmf1TkQ"],
    ["/curso/redes-sem-fio/configuracao", "aShTC0OtWr8"],
    ["/curso/redes-sem-fio/seguranca", "2jHuTZ1y0b8"],
  ];
  expect(esperado).toHaveLength(VIDEO_LESSONS.length);

  for (const [aula, id] of esperado) {
    expect(getVideoForLesson(aula)?.youtubeId, `aula ${aula}`).toBe(id);
  }
});

test("o identificador que a URL carrega é o mesmo do registro", () => {
  for (const v of VIDEO_LESSONS) {
    expect(v.url, `${v.lesson} não contém o próprio id`).toContain(v.youtubeId);
  }
});

test("o vídeo de GUI e CLI é um Short e mantém a URL de Shorts", () => {
  const v = getVideoForLesson("/curso/interfaces/gui-cli")!;
  expect(v.format).toBe("short");
  expect(v.url).toContain("/shorts/");
});

test("a captura de pacotes começa aos 15 segundos", () => {
  const v = getVideoForLesson("/curso/analisadores/captura")!;
  expect(v.startAt).toBe(15);
  expect(embedUrl(v)).toContain("start=15");
});

test("só o vídeo de captura tem ponto de início", () => {
  const comInicio = VIDEO_LESSONS.filter((v) => v.startAt !== undefined);
  expect(comInicio.map((v) => v.lesson)).toEqual(["/curso/analisadores/captura"]);
});

test("o embed não reproduz sozinho e não pede cookie à toa", () => {
  for (const v of VIDEO_LESSONS) {
    const url = embedUrl(v);
    expect(url, `${v.lesson} usa domínio com cookie`).toContain(
      "youtube-nocookie.com",
    );
    expect(url, `${v.lesson} tem autoplay`).not.toContain("autoplay=1");
    expect(url, `${v.lesson} tem mute forçado`).not.toContain("mute=");
    expect(url).toContain(`/embed/${v.youtubeId}`);
  }
});

test("a capa usa a resolução que existe para todo vídeo", () => {
  for (const v of VIDEO_LESSONS) {
    const capa = thumbnailUrl(v.youtubeId);
    expect(capa).toBe(`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`);

    expect(capa).not.toContain("maxresdefault");
  }
});

test("todo vídeo é declarado como material complementar", () => {
  for (const v of VIDEO_LESSONS) {
    expect(v.source, v.lesson).toBe("complementar");
  }
});

test("o título é o fornecido, sem invenção de duração, autor ou nível", () => {
  for (const v of VIDEO_LESSONS) {
    expect(v.title.length).toBeGreaterThan(5);

    expect(Object.keys(v).sort()).toEqual(
      expect.arrayContaining(["lesson", "source", "title", "url", "youtubeId"]),
    );
    for (const proibido of ["duration", "author", "level", "description"]) {
      expect(v, `${v.lesson} declara ${proibido}`).not.toHaveProperty(proibido);
    }
  }
});
