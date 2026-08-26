import { test, expect } from "@playwright/test";
import { ROTAS } from "./rotas";

const ROTAS_VALIDAS = new Set(ROTAS);

for (const rota of ROTAS) {
  test(`links de ${rota} apontam para destinos reais`, async ({ page }) => {
    await page.goto(rota);

    const hrefs = await page.locator("a[href]").evaluateAll((links) =>
      links.map((l) => l.getAttribute("href") ?? ""),
    );

    const falsos: string[] = [];
    const foraDoMapa: string[] = [];

    for (const href of hrefs) {
      if (href.trim() === "" || href === "#") {
        falsos.push(`"${href}"`);
        continue;
      }
      if (href.startsWith("http") || href.startsWith("mailto:")) continue;

      const semAncora = href.split("#")[0];
      if (semAncora === "") continue; // âncora interna à própria página

      if (!ROTAS_VALIDAS.has(semAncora)) foraDoMapa.push(semAncora);
    }

    expect(falsos, `links falsos em ${rota}: ${falsos.join(", ")}`).toEqual([]);
    expect(
      foraDoMapa,
      `links para rota inexistente em ${rota}: ${foraDoMapa.join(", ")}`,
    ).toEqual([]);
  });
}

test("toda rota do mapa responde 200", async ({ request }) => {
  test.slow();
  const quebrados: string[] = [];
  await Promise.all(
    ROTAS.map(async (rota) => {
      const r = await request.get(rota);
      if (r.status() !== 200) quebrados.push(`${rota} → ${r.status()}`);
    }),
  );
  expect(quebrados, `rotas quebradas:\n${quebrados.join("\n")}`).toEqual([]);
  expect(ROTAS.length).toBeGreaterThan(30);
});

test("botões não têm rótulo vazio", async ({ page }) => {
  const semRotulo: string[] = [];
  for (const rota of ["/", "/curso", "/simuladores/subnetting", "/laboratorios/vlsm", "/quiz"]) {
    await page.goto(rota);
    const problemas = await page.locator("button").evaluateAll((botoes) =>
      botoes
        .filter((b) => {
          const texto = (b.textContent ?? "").trim();
          const rotulo = b.getAttribute("aria-label") ?? "";
          const titulo = b.getAttribute("title") ?? "";
          return texto === "" && rotulo === "" && titulo === "";
        })
        .map((b) => b.outerHTML.slice(0, 120)),
    );
    semRotulo.push(...problemas.map((p) => `${rota}: ${p}`));
  }
  expect(semRotulo, semRotulo.join("\n")).toEqual([]);
});

const MARCADOR_PROIBIDO = /Lorem ipsum|Coming soon|Em breve|TODO:|FIXME/i;

for (const rota of ROTAS) {
  test(`${rota} não tem marcador de trabalho inacabado`, async ({ page }) => {
    await page.goto(rota);
    const texto = await page.locator("body").innerText();
    expect(
      MARCADOR_PROIBIDO.test(texto),
      `marcador de trabalho inacabado em ${rota}`,
    ).toBe(false);
  });
}
