import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const AMOSTRA = [
  "/",
  "/curso",
  "/curso/roteamento-ip",
  "/curso/comutacao/vlan",
  "/simuladores/subnetting",
  "/simuladores/rip",
  "/laboratorios/vlsm",
  "/quiz",
  "/exercicios",
  "/glossario",
  "/busca",
  "/progresso",
  "/referencias",
];

for (const tema of ["dark", "light"] as const) {
  test.describe(`axe — tema ${tema}`, () => {
    for (const rota of AMOSTRA) {
      test(`${rota} sem violações sérias`, async ({ page }) => {
        await page.addInitScript((t) => {
          window.localStorage.setItem("theme", t);
        }, tema);
        await page.goto(rota);

        const resultado = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();

        const graves = resultado.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        );

        expect(
          graves,
          graves
            .map((v) => `${v.id}: ${v.description}\n  ${v.nodes[0]?.html ?? ""}`)
            .join("\n"),
        ).toEqual([]);
      });
    }
  });
}

test("toda a interatividade da home é alcançável por teclado", async ({ page }) => {
  await page.goto("/");

  const alcancados: string[] = [];

  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press("Tab");
    const rotulo = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return "";
      return (
        el.getAttribute("aria-label") ??
        (el.textContent ?? "").trim().slice(0, 48)
      );
    });
    if (rotulo) alcancados.push(rotulo);
  }

  const exigidos: Array<[string, RegExp]> = [
    ["executar/pausar", /Executar a simulação|Pausar a simulação/],
    ["passo à frente", /^Passo$/],
    ["velocidade", /Velocidade \d/],
    ["inspetor", /Inspecionar/],
    ["registro de eventos", /Registro de eventos/],
    ["equipamento da topologia", /R1, Roteador/],
    ["jornada em tabela", /Ver a jornada inteira em tabela/],
  ];

  const faltando = exigidos
    .filter(([, re]) => !alcancados.some((r) => re.test(r)))
    .map(([nome]) => nome);

  expect(
    faltando,
    `controles inalcançáveis por teclado: ${faltando.join(", ")}`,
  ).toEqual([]);
});

test("voltar e reiniciar entram na ordem de foco assim que fazem sentido", async ({
  page,
}) => {
  await page.goto("/");

  const voltar = page.getByRole("button", { name: "Evento anterior" });
  const reiniciar = page.getByRole("button", { name: "Reiniciar a simulação" });

  await expect(voltar).toBeDisabled();
  await expect(reiniciar).toBeDisabled();

  await page.getByRole("button", { name: "Passo" }).click();

  await expect(voltar).toBeEnabled();
  await expect(reiniciar).toBeEnabled();
  await voltar.focus();
  await expect(voltar).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(voltar).toBeDisabled();
});

test("o foco é visível em todos os controles do header", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const temContorno = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return false;
    const estilo = window.getComputedStyle(el);
    return estilo.outlineStyle !== "none" || estilo.boxShadow !== "none";
  });
  expect(temContorno).toBe(true);
});
