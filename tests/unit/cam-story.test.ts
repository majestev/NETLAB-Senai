import { test, expect } from "@playwright/test";
import {
  CAM_STORY,
  STORY_HOSTS,
  STORY_PORTS,
  buildCamStory,
} from "@/lib/net/cam-story";
import { BROADCAST_MAC, processFrame } from "@/lib/net/switching";

test("a história começa com a tabela vazia", () => {
  const primeiro = CAM_STORY[0]!;
  expect(primeiro.beat).toBe("vazia");
  expect(primeiro.camBefore).toEqual([]);
  expect(primeiro.camAfter).toEqual([]);
  expect(primeiro.frame).toBeNull();
});

test("o switch só aprende pelo MAC de origem, nunca pelo de destino", () => {
  for (const passo of CAM_STORY) {
    if (!passo.learned || !passo.frame) continue;
    expect(passo.learned.mac, passo.id).toBe(passo.frame.sourceMac);
    expect(passo.learned.port, passo.id).toBe(passo.frame.ingressPort);
  }
});

test("a tabela só cresce: nenhuma entrada some no meio da história", () => {
  let anterior = 0;
  for (const passo of CAM_STORY) {
    expect(passo.camAfter.length, passo.id).toBeGreaterThanOrEqual(anterior);
    anterior = passo.camAfter.length;
  }

  expect(anterior).toBe(3);
  const macs = CAM_STORY.at(-1)!.camAfter.map((e) => e.mac);
  expect(macs).not.toContain(STORY_HOSTS.find((h) => h.name === "PC-D")!.mac);
});

test("o primeiro envio inunda porque o destino é desconhecido", () => {
  const primeiro = CAM_STORY.find((p) => p.frame !== null)!;
  expect(primeiro.action).toBe("inundar");
  expect(primeiro.camBefore.length).toBe(0);

  expect(primeiro.egressPorts.length).toBe(STORY_PORTS.length - 1);
  expect(primeiro.egressPorts).not.toContain(primeiro.frame!.ingressPort);
});

test("a resposta encerra a inundação: sai por uma porta só", () => {
  const resposta = CAM_STORY[2]!;
  expect(resposta.action).toBe("encaminhar");
  expect(resposta.egressPorts).toHaveLength(1);
});

test("o broadcast continua saindo por todas as portas com a tabela cheia", () => {
  const ultimo = CAM_STORY.at(-1)!;
  expect(ultimo.frame?.destinationMac).toBe(BROADCAST_MAC);
  expect(ultimo.action).toBe("inundar");
  expect(ultimo.egressPorts.length).toBe(STORY_PORTS.length - 1);

  expect(ultimo.camBefore.length).toBeGreaterThan(0);
});

test("cada passo continua de onde o anterior parou", () => {
  for (let i = 1; i < CAM_STORY.length; i += 1) {
    expect(CAM_STORY[i]!.camBefore, CAM_STORY[i]!.id).toEqual(
      CAM_STORY[i - 1]!.camAfter,
    );
  }
});

test("a história não tem implementação própria: bate com processFrame", () => {
  let cam: typeof CAM_STORY[number]["camAfter"] = [];
  let tick = 0;
  for (const passo of CAM_STORY) {
    if (!passo.frame) continue;
    tick += 1;
    const r = processFrame(cam, STORY_PORTS, passo.frame, tick);
    expect(r.action, passo.id).toBe(passo.action);
    expect(r.egressPorts.slice().sort(), passo.id).toEqual(
      passo.egressPorts.slice().sort(),
    );
    cam = r.cam;
  }
  expect(cam).toEqual(CAM_STORY.at(-1)!.camAfter);
});

test("reconstruir a história produz exatamente a mesma coisa", () => {
  expect(buildCamStory()).toEqual(CAM_STORY);
});

test("os índices são a posição real na sequência", () => {
  CAM_STORY.forEach((p, i) => expect(p.index).toBe(i));
});
