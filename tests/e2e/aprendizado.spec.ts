import { test, expect } from "@playwright/test";

test.describe("busca", () => {
  test("o command palette abre com Ctrl+K e navega", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toBeVisible();

    await page.getByPlaceholder(/Buscar aulas/).fill("VLAN");
    await page.getByText("VLAN e IEEE 802.1Q").first().click();
    await expect(page).toHaveURL(/\/curso\/comutacao\/vlan$/);
  });

  test("a busca global ignora acentos", async ({ page }) => {
    await page.goto("/busca");
    await page.getByLabel("O que você procura?").fill("comutacao");

    await expect(page.getByText(/\d+ resultados?\b/)).toBeVisible();
    await expect(page.getByRole("link", { name: /Comutação/ }).first()).toBeVisible();
  });

  test("o filtro por tipo restringe os resultados", async ({ page }) => {
    await page.goto("/busca");
    await page.getByLabel("O que você procura?").fill("vlan");
    const grupo = page.getByRole("group", { name: /Filtrar resultados/ });
    for (const nome of ["Aula", "Módulo", "Simulador", "Laboratório"]) {
      await grupo.getByRole("button", { name: nome, exact: true }).click();
    }

    const resultados = page.getByRole("listitem").filter({ hasText: "Glossário" });
    await expect(resultados.first()).toBeVisible();
  });
});

test.describe("glossário", () => {
  test("a busca instantânea filtra os verbetes", async ({ page }) => {
    await page.goto("/glossario");
    await page.getByLabel("Buscar termo").fill("TTL");
    await expect(page.getByText(/1 de \d+ verbetes/)).toBeVisible();
    await expect(page.getByText(/limita quantos roteadores/)).toBeVisible();
  });

  test("cada verbete leva à aula relacionada", async ({ page }) => {
    await page.goto("/glossario");
    await page.getByLabel("Buscar termo").fill("tabela CAM");
    await page.getByRole("link", { name: "Tabela CAM" }).first().click();
    await expect(page).toHaveURL(/\/curso\/comutacao\/cam$/);
  });
});

test.describe("quiz", () => {
  test("responder revela a explicação e conta a pontuação", async ({ page }) => {
    await page.goto("/quiz");
    const primeira = page.getByRole("listitem").filter({ hasText: "Questão 1 de" });
    await primeira.getByRole("radio").first().check();

    await expect(page.getByText(/A métrica só é comparada/).first()).toBeVisible();
    await expect(page.getByText("1 respondidas")).toBeVisible();
  });

  test("o filtro por módulo reduz o conjunto", async ({ page }) => {
    await page.goto("/quiz");
    await page.getByRole("button", { name: "Redes sem fio", exact: true }).click();
    await expect(page.getByText(/Questão 1 de 4/)).toBeVisible();
  });
});

test.describe("exercícios", () => {
  test("verifica uma resposta e explica", async ({ page }) => {
    await page.goto("/exercicios");
    const lista = page.getByRole("list", { name: "Exercícios" });
    const primeiro = lista.getByRole("listitem").first();
    await primeiro.getByRole("button", { name: "Ver resposta" }).click();
    await expect(primeiro.getByText(/Resposta:/)).toBeVisible();
  });

  test("gera um novo conjunto de enunciados", async ({ page }) => {
    await page.goto("/exercicios");
    const lista = page.getByRole("list", { name: "Exercícios" });
    const antes = await lista.getByRole("listitem").first().innerText();
    await page.getByRole("button", { name: "Novos exercícios" }).click();
    await expect
      .poll(async () => lista.getByRole("listitem").first().innerText())
      .not.toBe(antes);
  });
});

test.describe("progresso", () => {
  test("marcar uma aula persiste após recarregar", async ({ page }) => {
    await page.goto("/curso/comutacao/mac");
    await page.getByRole("button", { name: "Marcar como concluída" }).click();
    await expect(page.getByRole("button", { name: "Aula concluída" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Aula concluída" })).toBeVisible();

    await page.goto("/progresso");
    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByText(/1 de \d+ aulas concluídas/)).toBeVisible();
  });

  test("uma aula marcada sobrevive a recarregar imediatamente", async ({ page }) => {
    await page.goto("/curso/comutacao/cam");
    await page.getByRole("button", { name: "Marcar como concluída" }).click();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Aula concluída" }),
    ).toBeVisible();
  });

  test("visitar outra aula não apaga o progresso já salvo", async ({ page }) => {
    await page.goto("/curso/comutacao/mac");
    await page.getByRole("button", { name: "Marcar como concluída" }).click();
    await expect(page.getByRole("button", { name: "Aula concluída" })).toBeVisible();

    for (const rota of [
      "/curso/comutacao/cam",
      "/curso/comutacao/vlan",
      "/curso/roteamento-ip/rip",
    ]) {
      await page.goto(rota);
    }

    await page.goto("/progresso");
    await expect(page.getByText(/1 de \d+ aulas concluídas/)).toBeVisible();
  });

  test("a última aula aberta aparece no painel", async ({ page }) => {
    await page.goto("/curso/roteamento-ip/rip");

    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("netlab.progress.v1") ?? ""),
      )
      .toContain("roteamento-ip/rip");
    await page.goto("/progresso");
    await expect(page.getByText("Última aula aberta").locator("..")).toContainText(
      "RIP",
    );
  });
});

test.describe("blocos de código", () => {
  test("copiar coloca o comando na área de transferência", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/curso/roteamento-ip/estatico");
    await page.getByRole("button", { name: "Copiar" }).first().click();
    await expect(page.getByRole("button", { name: "Copiado" })).toBeVisible();

    const conteudo = await page.evaluate(() => navigator.clipboard.readText());
    expect(conteudo).toContain("ip route");
  });

  test("explicar abre a explicação linha a linha", async ({ page }) => {
    await page.goto("/curso/roteamento-ip/estatico");
    await page.getByRole("button", { name: "Explicar" }).first().click();
    await expect(page.getByText("Linha a linha").first()).toBeVisible();
  });
});

test.describe("a viagem de um pacote", () => {
  const eventoAtual = (page: import("@playwright/test").Page) =>
    page.getByRole("status").filter({ hasText: /\d+\/\d+/ }).first();

  async function pausar(page: import("@playwright/test").Page) {
    await page.goto("/");
    const pausa = page.getByRole("button", { name: "Pausar a simulação" });
    if (await pausa.isVisible().catch(() => false)) await pausa.click();
    const reiniciar = page.getByRole("button", { name: "Reiniciar a simulação" });
    if (await reiniciar.isEnabled().catch(() => false)) await reiniciar.click();
  }

  test("a jornada avança evento a evento, do início ao fim", async ({ page }) => {
    await pausar(page);
    await expect(eventoAtual(page)).toContainText("Pacote criado");

    const passo = page.getByRole("button", { name: "Passo" });
    let n = 0;
    while (await passo.isEnabled()) {
      await passo.click();
      n += 1;

      expect(n, "a jornada não terminou").toBeLessThan(60);
    }

    expect(n, "poucos eventos para ensinar a jornada").toBeGreaterThan(12);
    await expect(eventoAtual(page)).toContainText("Pacote entregue");
  });

  test("o TTL cai num roteador e o IP não muda em lugar nenhum", async ({ page }) => {
    await pausar(page);
    const passo = page.getByRole("button", { name: "Passo" });

    const ttls: number[] = [];
    const ips = new Set<string>();

    for (let i = 0; i < 40 && (await passo.isEnabled()); i += 1) {
      const estado = await page.evaluate(() => {
        const campo = (nome: string) =>
          document
            .querySelector(`[data-valor-atual="${nome}"]`)
            ?.textContent?.trim() ?? "";
        return { ttl: campo("ttl"), ipOrigem: campo("sourceIp") };
      });
      const ttl = Number(estado.ttl.replace(/\D/g, ""));
      if (Number.isFinite(ttl) && ttl > 0) ttls.push(ttl);
      if (estado.ipOrigem) ips.add(estado.ipOrigem);
      await passo.click();
    }

    expect([...ips], `IP de origem variou: ${[...ips].join(", ")}`).toHaveLength(1);

    expect(Math.min(...ttls)).toBeLessThan(Math.max(...ttls));
    for (let i = 1; i < ttls.length; i += 1) {
      expect(ttls[i]!, "TTL subiu").toBeLessThanOrEqual(ttls[i - 1]!);
    }
  });

  test("o registro de eventos navega a simulação", async ({ page }) => {
    await pausar(page);
    const passo = page.getByRole("button", { name: "Passo" });
    for (let i = 0; i < 6; i += 1) await passo.click();

    const registro = page.getByRole("region", { name: /Registro de eventos/ });
    await expect(registro).toBeVisible();

    await registro.getByRole("button").first().click();
    await expect(eventoAtual(page)).toContainText("Pacote criado");
  });

  test("o Packet Inspector mostra o que muda e o que permanece", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Inspecionar" }).click();

    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toBeVisible();
    await expect(dialogo).toContainText("Camada 2 — Enlace");
    await expect(dialogo).toContainText("Camada 3 — Rede");
    await expect(dialogo).toContainText("Encaminhamento");
    await expect(dialogo).toContainText("TTL");
  });

  test("clicar num equipamento mostra suas interfaces", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^R1, Roteador de borda/ }).click();
    await expect(page.getByText("10.0.12.1/30")).toBeVisible();
  });

  test("a jornada tem equivalente textual em tabela", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Ver a jornada inteira em tabela").click();
    await expect(page.getByRole("table", { name: /Estado do pacote/ })).toBeVisible();
  });
});
