import { test, expect } from "@playwright/test";
import { ROTAS } from "./rotas";

test.describe("todas as rotas respondem e têm um h1 único", () => {
  for (const rota of ROTAS) {
    test(`carrega ${rota}`, async ({ page }) => {
      const resposta = await page.goto(rota);
      expect(resposta?.status(), `status de ${rota}`).toBe(200);

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).not.toBeEmpty();

      await expect(page).not.toHaveTitle(/Create Next App/);

      const descricao = page.locator('meta[name="description"]');
      await expect(descricao).toHaveCount(1);
    });
  }
});

test("o header navega para as seções principais", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, "nav horizontal só existe em lg+");
  await page.goto("/");
  await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Curso" }).click();
  await expect(page).toHaveURL(/\/curso$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Curso");
});

test("a sidebar destaca a página atual", async ({ page }) => {
  test.skip(page.viewportSize()!.width < 1024, "sidebar fixa só existe em lg+");
  await page.goto("/curso/roteamento-ip/fundamentos");
  const atual = page
    .getByRole("navigation", { name: "Navegação do curso" })
    .locator('a[aria-current="page"]');
  await expect(atual).toHaveCount(1);
  await expect(atual).toHaveText("Fundamentos");
});

test("a navegação anterior e próxima liga as aulas em sequência", async ({ page }) => {
  await page.goto("/curso/roteamento-ip/fundamentos");
  const nav = page.getByRole("navigation", { name: "Navegação entre aulas" });
  await nav.getByRole("link").filter({ hasText: "Próxima" }).click();
  await expect(page).toHaveURL(/\/curso\/roteamento-ip\/estatico$/);

  await page
    .getByRole("navigation", { name: "Navegação entre aulas" })
    .getByRole("link")
    .filter({ hasText: "Anterior" })
    .click();
  await expect(page).toHaveURL(/\/curso\/roteamento-ip\/fundamentos$/);
});

test("o skip-link é o primeiro foco e leva ao conteúdo", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focado = page.locator(":focus");
  await expect(focado).toHaveText(/Ir para o conteúdo/);
  await focado.press("Enter");
  await expect(page).toHaveURL(/#conteudo$/);
});

test("o menu mobile abre e navega", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto("/curso");
  await page.getByRole("button", { name: "Abrir navegação do curso" }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Comutação", exact: true }).click();
  await expect(page).toHaveURL(/\/curso\/comutacao$/);
});

test("o tema alterna e permanece aplicado", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const antes = await html.getAttribute("class");
  await page.getByRole("button", { name: /Alternar entre tema/ }).click();
  await expect(html).not.toHaveClass(antes ?? "");
});
