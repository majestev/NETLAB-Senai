import { test, expect } from "@playwright/test";
import { ROTAS } from "./rotas";

const AMOSTRA = [
  "/",
  "/curso/roteamento-ip/rip",

  "/curso/roteamento-ip/fundamentos",
  "/curso/comutacao/cam",
  "/curso/comutacao/vlan",
  "/curso/interfaces/gui-cli",
  "/curso/redes-sem-fio/seguranca",

  "/simuladores/subnetting",
  "/quiz",
  "/busca",
  "/laboratorios/vlsm",
  "/glossario",
];

for (const rota of AMOSTRA) {
  test(`${rota} entrega conteúdo visível sem JavaScript`, async ({ browser }) => {
    const contexto = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexto.newPage();
    await page.goto(rota);

    const main = page.locator("main");
    await expect(main).toBeVisible();
    const texto = (await main.innerText()).trim();
    expect(texto.length, `main vazio em ${rota}`).toBeGreaterThan(200);

    const controles = await page
      .locator("main button, main input, main select, main table")
      .count();
    const paragrafos = await page.locator("main p").count();
    expect(
      controles + paragrafos,
      `${rota} chegou só com o cabeçalho, sem conteúdo nem controles`,
    ).toBeGreaterThan(3);

    const transparentes = await main.evaluate((raiz) => {
      const achados: string[] = [];
      for (const no of raiz.querySelectorAll<HTMLElement>("*")) {
        if (no.closest("[aria-hidden='true']")) continue;

        const proprio = Array.from(no.childNodes)
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent ?? "")
          .join("")
          .trim();
        if (proprio.length === 0) continue;
        const o = Number(getComputedStyle(no).opacity);
        if (o < 0.1) {
          achados.push(`<${no.tagName.toLowerCase()}> "${proprio.slice(0, 40)}" opacity=${o}`);
        }
      }
      return achados;
    });
    expect(
      transparentes,
      `conteúdo invisível em ${rota}:\n${transparentes.join("\n")}`,
    ).toEqual([]);

    await expect(page.locator("h1")).toBeVisible();
    await contexto.close();
  });
}

test("o h1 é o elemento pintado, não um placeholder", async ({ page }) => {
  await page.goto("/curso/roteamento-ip/rip");
  const caixa = await page.locator("h1").boundingBox();
  expect(caixa, "h1 sem caixa de layout").not.toBeNull();
  expect(caixa!.width).toBeGreaterThan(100);
  expect(caixa!.height).toBeGreaterThan(20);
});

test("canonical, Open Graph e imagem apontam para o host de produção", async ({
  page,
}) => {
  await page.goto("/");

  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  const ogUrl = await page
    .locator('meta[property="og:url"]')
    .getAttribute("content");
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");

  for (const [nome, valor] of [
    ["canonical", canonical],
    ["og:url", ogUrl],
    ["og:image", ogImage],
  ] as const) {
    expect(valor, `${nome} ausente`).toBeTruthy();
    expect(valor!, `${nome} aponta para host inexistente: ${valor}`).not.toContain(
      ".local",
    );
    expect(valor!, `${nome} não é absoluto: ${valor}`).toMatch(/^https?:\/\//);
  }
});

test("o card social declarado tem imagem correspondente", async ({ page, request }) => {
  await page.goto("/");
  const card = await page
    .locator('meta[name="twitter:card"]')
    .getAttribute("content");

  if (card === "summary_large_image") {
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage, "summary_large_image declarado sem og:image").toBeTruthy();

    const caminho = new URL(ogImage!).pathname;
    const resposta = await request.get(caminho);
    expect(resposta.status(), `imagem OG não responde: ${caminho}`).toBe(200);
    expect(resposta.headers()["content-type"]).toContain("image");
  }
});

test("robots e sitemap não vazam o host de desenvolvimento", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const corpoRobots = await robots.text();
  expect(corpoRobots).not.toContain(".local");
  expect(corpoRobots).toMatch(/Sitemap:\s*https?:\/\//);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const corpoSitemap = await sitemap.text();
  expect(corpoSitemap).not.toContain(".local");

  const locs = [...corpoSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.length, "sitemap sem entradas").toBeGreaterThanOrEqual(ROTAS.length);
});

test("cada rota tem título único e descrição própria", async ({ page }) => {
  test.slow();
  const titulos = new Map<string, string>();
  const semDescricao: string[] = [];

  for (const rota of ROTAS) {
    await page.goto(rota);
    const titulo = await page.title();
    const anterior = titulos.get(titulo);
    expect(
      anterior,
      `título repetido entre ${anterior} e ${rota}: "${titulo}"`,
    ).toBeUndefined();
    titulos.set(titulo, rota);

    const descricao = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    if (!descricao || descricao.trim().length < 50) semDescricao.push(rota);
  }

  expect(semDescricao, `rotas sem descrição útil: ${semDescricao.join(", ")}`).toEqual(
    [],
  );
});
