import { test, expect } from "@playwright/test";
import { VIDEO_LESSONS } from "@/lib/content/videos";

for (const video of VIDEO_LESSONS) {
  test(`${video.lesson} traz o vídeo certo, sem player carregado`, async ({
    page,
  }) => {
    await page.goto(video.lesson);

    const secao = page.locator("#video-complementar");
    await expect(secao).toBeVisible();
    await expect(secao).toContainText(video.title);

    await expect(page.locator("iframe")).toHaveCount(0);

    const capa = secao.locator("img");
    await expect(capa).toHaveAttribute("src", new RegExp(video.youtubeId));
    await expect(capa).toHaveAttribute("loading", "lazy");

    await expect(capa).toHaveAttribute("width", /\d+/);
    await expect(capa).toHaveAttribute("height", /\d+/);

    const link = secao.getByRole("link", { name: /Abrir no YouTube/ });
    await expect(link).toHaveAttribute("href", new RegExp(video.youtubeId));
    await expect(link).toHaveAttribute("rel", /noopener/);
  });
}

test("o player só entra no documento depois do clique, e sem autoplay", async ({
  page,
}) => {
  await page.goto("/curso/comutacao/cam");
  await expect(page.locator("iframe")).toHaveCount(0);

  await page.getByRole("button", { name: /^Assistir ao vídeo/ }).click();

  const player = page.locator("iframe");
  await expect(player).toHaveCount(1);
  const src = (await player.getAttribute("src")) ?? "";
  expect(src, "player fora do domínio sem cookie").toContain(
    "youtube-nocookie.com",
  );
  expect(src, "player reproduz sozinho").not.toContain("autoplay=1");
  expect(await player.getAttribute("allow"), "autoplay permitido").not.toContain(
    "autoplay",
  );
});

test("o vídeo abre pelo teclado", async ({ page }) => {
  await page.goto("/curso/comutacao/vlan");
  const botao = page.getByRole("button", { name: /^Assistir ao vídeo/ });
  await botao.focus();
  await expect(botao).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("iframe")).toHaveCount(1);
});

test("o Short mantém a proporção vertical e é identificado", async ({ page }) => {
  await page.goto("/curso/interfaces/gui-cli");
  const secao = page.locator("#video-complementar");
  await expect(secao).toContainText("Short");

  const caixa = secao.locator('div[style*="aspect-ratio"]').first();
  await expect(caixa).toHaveAttribute("style", /9 \/ 16/);
});

test("a captura de pacotes começa aos 15 segundos", async ({ page }) => {
  await page.goto("/curso/analisadores/captura");
  await page.getByRole("button", { name: /^Assistir ao vídeo/ }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /start=15/);
});

test("sem a capa, o vídeo continua acessível", async ({ page }) => {
  await page.route("**img.youtube.com/**", (rota) => rota.abort());
  await page.goto("/curso/comutacao/mac");

  const secao = page.locator("#video-complementar");
  await expect(secao.getByRole("button", { name: /^Assistir ao vídeo/ })).toBeVisible();
  await expect(secao.getByRole("link", { name: /Abrir no YouTube/ })).toBeVisible();
});

test("o vídeo entra depois do conteúdo da aula, não antes", async ({ page }) => {
  await page.goto("/curso/comutacao/cam");

  const posicoes = await page.evaluate(() => {
    const y = (sel: string) =>
      document.querySelector(sel)?.getBoundingClientRect().top ?? -1;
    return {
      oQueE: y("#o-que-e"),
      video: y("#video-complementar"),
      errosComuns: y("#erros-comuns"),
    };
  });

  expect(posicoes.oQueE).toBeGreaterThan(0);
  expect(posicoes.video).toBeGreaterThan(posicoes.oQueE);
  expect(posicoes.errosComuns).toBeGreaterThan(posicoes.video);
});

test("o sumário lateral lista o vídeo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/curso/comutacao/cam");
  const sumario = page.getByRole("navigation", { name: /Nesta página/i });
  await expect(sumario.getByRole("link", { name: "Vídeo complementar" })).toBeVisible();
});
