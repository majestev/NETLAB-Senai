import { test, expect } from "@playwright/test";
import { ROTAS } from "./rotas";

const LARGURAS = [320, 360, 375, 390, 414, 480, 768, 820, 1024, 1280, 1440, 1920, 2560];

const CRITICAS = [
  "/",
  "/curso/roteamento-ip/fundamentos",
  "/curso/comutacao/vlan",
  "/simuladores/subnetting",
  "/simuladores/roteamento",
  "/simuladores/rip",
  "/simuladores/switch",
  "/simuladores/analisador",
  "/laboratorios/vlsm",
  "/quiz",
  "/progresso",
];

for (const largura of LARGURAS) {
  test(`sem rolagem horizontal em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    const estourando: string[] = [];

    for (const rota of CRITICAS) {
      await page.goto(rota);
      const excesso = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      if (excesso > 0) estourando.push(`${rota} (+${excesso}px)`);
    }

    expect(estourando, `estouro horizontal: ${estourando.join(", ")}`).toEqual([]);
  });
}

test("todas as rotas cabem em 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  const estourando: string[] = [];
  for (const rota of ROTAS) {
    await page.goto(rota);
    const excesso = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (excesso > 0) estourando.push(`${rota} (+${excesso}px)`);
  }
  expect(estourando, estourando.join("\n")).toEqual([]);
});

test("tabelas largas rolam dentro do próprio contêiner", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto("/simuladores/roteamento");
  const regiao = page.getByRole("region", { name: /Tabela de roteamento/ });
  await expect(regiao).toBeVisible();

  const rola = await regiao.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(rola).toBe(true);

  const corpoEstoura = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(corpoEstoura).toBe(false);
});

async function alvosAbaixoDe(
  page: import("@playwright/test").Page,
  minimo: number,
  seletor: string,
) {
  return page.evaluate(
    ([min, sel]: [number, string]) => {
      const efetivo = (el: Element) => {
        const r = el.getBoundingClientRect();
        let w = r.width, h = r.height;
        const a = getComputedStyle(el, "::after");
        if (a.content && a.content !== "none" && a.position === "absolute") {
          const aw = parseFloat(a.width);
          const ah = parseFloat(a.height);
          if (Number.isFinite(aw)) w = Math.max(w, aw);
          if (Number.isFinite(ah)) h = Math.max(h, ah);
        }
        return { w: Math.round(w), h: Math.round(h) };
      };
      const falhas: Array<{ texto: string; w: number; h: number }> = [];
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;

        if (cs.clipPath === "inset(50%)" || cs.clip === "rect(0px, 0px, 0px, 0px)")
          continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        if (el.tagName === "A" && el.closest("p, li, dd, .reading")) continue;

        const rotulo = el.closest("label");
        const alvo =
          rotulo &&
          (el.tagName === "INPUT" || el.tagName === "SELECT") &&
          rotulo.contains(el)
            ? rotulo
            : el;

        const e = efetivo(alvo);
        if (e.w < min || e.h < min) {
          falhas.push({
            texto: (el.getAttribute("aria-label") || el.textContent || "")
              .trim()
              .slice(0, 40),
            w: e.w,
            h: e.h,
          });
        }
      }
      return falhas;
    },
    [minimo, seletor] as [number, string],
  );
}

const ROTAS_INTERATIVAS = [
  "/simuladores/switch",
  "/simuladores/rip",
  "/simuladores/subnetting",
  "/simuladores/vlsm",
  "/laboratorios/roteamento",
];

for (const rota of ROTAS_INTERATIVAS) {
  test(`controles de ${rota} têm área de toque de 44px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await page.goto(rota);
    const falhas = await alvosAbaixoDe(
      page,
      44,
      "main button, main input:not([type=hidden]), main select",
    );
    expect(falhas, JSON.stringify(falhas, null, 1)).toEqual([]);
  });
}

test("nenhum alvo da interface fica abaixo do mínimo da WCAG 2.2 AA", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto("/");
  const falhas = await alvosAbaixoDe(
    page,
    24,
    "button, a[href], input:not([type=hidden]), select",
  );
  expect(falhas, JSON.stringify(falhas, null, 1)).toEqual([]);
});

test("o skip-link é um alvo utilizável quando aparece", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto("/");
  await page.keyboard.press("Tab");

  const link = page.getByRole("link", { name: /Ir para o conteúdo/ });
  await expect(link).toBeFocused();

  const caixa = await link.boundingBox();
  expect(caixa, "skip-link sem caixa ao receber foco").not.toBeNull();
  expect(caixa!.height).toBeGreaterThanOrEqual(24);
  expect(caixa!.width).toBeGreaterThanOrEqual(24);
});
