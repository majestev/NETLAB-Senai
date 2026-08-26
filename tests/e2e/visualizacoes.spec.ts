import { test, expect, type Page } from "@playwright/test";

async function passos(page: Page, secao: string, vezes: number) {
  const botao = page.locator(secao).getByRole("button", { name: "Passo" });
  for (let i = 0; i < vezes; i += 1) {
    if (await botao.isDisabled()) return;
    await botao.click();
  }
}

test.describe("prefixo mais longo", () => {
  const SECAO = "#o-prefixo-mais-longo-bit-a-bit";

  test("as rotas caem no bit em que divergem e a mais específica sobra", async ({
    page,
  }) => {
    await page.goto("/curso/roteamento-ip/fundamentos");
    const secao = page.locator(SECAO);
    const estado = secao.getByRole("status");

    await expect(estado).toContainText("8 rotas na tabela");

    await passos(page, SECAO, 32);

    await expect(estado).toContainText("Prefixo mais longo: /24");

    await secao.getByText("Ver a comparação em texto").click();
    await expect(secao.getByText(/10\.1\.1\.0\/24/).first()).toBeVisible();
  });

  test("no simulador, os bits concordam com a decisão de encaminhamento", async ({
    page,
  }) => {
    await page.goto("/simuladores/roteamento");

    await page.getByRole("button", { name: "10.1.9.9" }).click();
    const resultado = page.getByText("Resultado").locator("..");
    await expect(resultado).toContainText("10.1.0.0/16");

    const bits = page.locator("section", {
      hasText: "Por que o prefixo mais longo vence",
    });
    await bits.getByRole("button", { name: "Passo" }).first().click();
    await expect(bits.getByRole("status").first()).toContainText("Bit 1 de 32");
  });
});

test.describe("história da tabela CAM", () => {
  const SECAO = "#da-tabela-vazia-ao-encaminhamento-por-uma-porta";

  test("começa vazia, inunda por ignorância e termina em unicast", async ({
    page,
  }) => {
    await page.goto("/curso/comutacao/cam");
    const secao = page.locator(SECAO);

    await expect(secao).toContainText("Vazia. O switch ainda não sabe");

    await passos(page, SECAO, 1);
    await expect(secao.getByRole("status")).toContainText("Inundar · 3 portas");

    await passos(page, SECAO, 1);
    await expect(secao.getByRole("status")).toContainText("Encaminhar");

    await passos(page, SECAO, 10);
    await expect(secao.getByRole("status")).toContainText("Inundar · 3 portas");
    await expect(secao.getByRole("status")).toContainText(
      "Tabela cheia não elimina broadcast",
    );
  });

  test("a tabela aprende pela origem: PC-D nunca transmite e nunca é aprendido", async ({
    page,
  }) => {
    await page.goto("/curso/comutacao/cam");
    const secao = page.locator("#da-tabela-vazia-ao-encaminhamento-por-uma-porta");
    await passos(page, "#da-tabela-vazia-ao-encaminhamento-por-uma-porta", 10);

    const tabela = secao.getByRole("table");
    await expect(tabela).toContainText("PC-A");
    await expect(tabela).toContainText("PC-B");
    await expect(tabela).toContainText("PC-C");
    await expect(tabela).not.toContainText("PC-D");
  });
});

test.describe("marcação 802.1Q", () => {
  const SECAO = "#os-quatro-bytes-entrando-e-saindo-do-quadro";

  test("a etiqueta só existe no trunk, e o quadro volta ao tamanho original", async ({
    page,
  }) => {
    await page.goto("/curso/comutacao/vlan");
    const secao = page.locator(SECAO);

    await expect(secao).toContainText("máx. 1518 bytes");
    await expect(secao).not.toContainText("TPID");

    await passos(page, SECAO, 2);
    await expect(secao).toContainText("máx. 1522 bytes");
    await expect(secao).toContainText("TPID");
    await expect(secao).toContainText("etiqueta inserida");

    await passos(page, SECAO, 1);
    await expect(secao).toContainText("máx. 1518 bytes");
    await expect(secao).toContainText("etiqueta removida");
    await expect(secao).not.toContainText("TPID");

    await passos(page, SECAO, 1);
    await expect(secao).toContainText("PC-B recebe um quadro comum");
    await expect(secao).not.toContainText("TPID");
  });

  test("trocar a VLAN troca o VID que o trunk escreve", async ({ page }) => {
    await page.goto("/curso/comutacao/vlan");
    const secao = page.locator("#os-quatro-bytes-entrando-e-saindo-do-quadro");
    await secao.getByRole("button", { name: "30", exact: true }).click();
    await passos(page, "#os-quatro-bytes-entrando-e-saindo-do-quadro", 2);
    const vid = secao.locator("dt", { hasText: "VID" });
    await expect(vid).toContainText("30");
  });
});

test("o encapsulamento devolve à aplicação exatamente os bytes que saíram", async ({
  page,
}) => {
  const SECAO = "#o-dado-descendo-e-subindo-a-pilha";
  await page.goto("/curso/analisadores/captura");
  const secao = page.locator(SECAO);

  const total = secao.locator("p", { hasText: /^\s*Host de/ });
  await expect(total).toContainText("120 bytes");

  await passos(page, SECAO, 4);
  await expect(total).toContainText("186 bytes");

  await passos(page, SECAO, 5);
  await expect(total).toContainText("120 bytes");
  await expect(secao.getByRole("status")).toContainText(
    "Nenhum dos cabeçalhos sobrou",
  );
});

test.describe("associação sem fio", () => {
  const SECAO = "#a-associacao-quadro-a-quadro";

  test("a senha errada falha na troca de chaves, depois de autenticar e associar", async ({
    page,
  }) => {
    await page.goto("/curso/redes-sem-fio/seguranca");
    const secao = page.locator(SECAO);

    await secao.getByLabel("A senha do cliente confere").uncheck();
    await passos(page, SECAO, 12);

    const estado = secao.getByRole("status");
    await expect(estado).toContainText("A troca de chaves falha");
    await expect(estado).toContainText("depois de autenticar e associar");
  });

  test("a rede aberta conecta sem cifrar nada", async ({ page }) => {
    await page.goto("/curso/redes-sem-fio/seguranca");
    const secao = page.locator(SECAO);

    await secao.getByRole("button", { name: "Aberta" }).click();
    await passos(page, SECAO, 12);

    await expect(secao.getByRole("status")).toContainText("Conectado, sem cifragem");
  });

  test("WPA2 termina cifrado, e a cifra só aparece no fim", async ({ page }) => {
    await page.goto("/curso/redes-sem-fio/seguranca");
    const secao = page.locator(SECAO);

    await passos(page, SECAO, 3);
    await expect(secao.getByRole("status")).not.toContainText("Conectado e cifrado");

    await passos(page, SECAO, 12);
    await expect(secao.getByRole("status")).toContainText("Conectado e cifrado");
  });
});

test("o espectro mostra que 1 e 6 não se sobrepõem, e 1 e 3 sim", async ({
  page,
}) => {
  await page.goto("/curso/redes-sem-fio/configuracao");
  const secao = page.locator("#por-que-1-6-e-11");

  const espectro = secao.getByRole("status").first();
  await expect(espectro).toContainText("não se sobrepõem");

  const canalB = secao.getByLabel("Segundo canal");
  await canalB.focus();
  for (let i = 0; i < 3; i += 1) await canalB.press("ArrowLeft");
  await expect(espectro).toContainText("compartilham");
});

test("o prompt muda ao subir os modos da linha de comando", async ({ page }) => {
  await page.goto("/curso/interfaces/gui-cli");
  const secao = page.locator("#o-prompt-diz-em-que-modo-voce-esta");

  await expect(secao.getByRole("status")).toContainText("Switch>");

  await secao.getByRole("button", { name: "enable" }).click();
  await expect(secao.getByRole("status")).toContainText("Switch#");

  await secao.getByRole("button", { name: "configure terminal" }).click();
  await expect(secao.getByRole("status")).toContainText("Switch(config)#");

  await secao.getByRole("button", { name: /^interface FastEthernet/ }).click();
  await expect(secao.getByRole("status")).toContainText("Switch(config-if)#");
});

test("a comparação GUI e CLI conta os passos dos dois lados", async ({ page }) => {
  await page.goto("/curso/interfaces/gui-cli");
  const secao = page.locator("#a-mesma-tarefa-nas-duas-interfaces");

  const contador = secao.getByRole("status");
  await expect(contador).toContainText("0 de 8 telas");
  await expect(contador).toContainText("0 de 6 comandos");

  await secao.getByRole("button", { name: "Começar" }).click();
  await expect(contador).toContainText("1 de 8 telas");
});

test("o bloco VLSM é cortado da maior demanda para a menor", async ({ page }) => {
  const SECAO = "#o-bloco-sendo-partido-passo-a-passo";
  await page.goto("/curso/roteamento-ip/classful-classless");
  const secao = page.locator(SECAO);

  await expect(secao.getByRole("status")).toContainText("Bloco íntegro");

  await passos(page, SECAO, 1);
  await expect(secao.getByRole("status")).toContainText("LAN A — /26");

  await passos(page, SECAO, 1);
  await expect(secao.getByRole("status")).toContainText("LAN B — /27");

  await passos(page, SECAO, 6);
  await expect(secao.getByRole("status")).toContainText(
    "da maior para a menor",
  );
});

test("o aprofundamento chega fechado, com o texto já no HTML", async ({ page }) => {
  await page.goto("/curso/roteamento-ip/rip");
  const detalhe = page.locator("details", {
    hasText: "Por que a métrica infinita é 16",
  });

  await expect(detalhe).not.toHaveAttribute("open", /.*/);

  await expect(detalhe).toContainText("teto transforma um laço infinito");

  await detalhe.getByText(/Por que a métrica infinita é 16/).click();
  await expect(detalhe).toHaveAttribute("open", /.*/);
});

test("guardar um vídeo para depois o faz aparecer em /progresso", async ({
  page,
}) => {
  await page.goto("/curso/comutacao/cam");
  const guardar = page.getByRole("button", { name: "Ver depois" });
  await expect(guardar).toHaveAttribute("aria-pressed", "false");
  await guardar.click();
  await expect(
    page.getByRole("button", { name: "Guardado para depois" }),
  ).toBeVisible();

  await page.goto("/progresso");
  const secao = page.locator("section", { hasText: "Vídeos complementares" });
  await expect(secao).toContainText("Guardados para depois");
  await expect(secao.getByRole("link", { name: /Tabela CAM/ })).toBeVisible();
});

test("abrir o player marca a aula como aberta, sem dizer assistida", async ({
  page,
}) => {
  await page.goto("/curso/comutacao/mac");
  await page.getByRole("button", { name: /^Assistir ao vídeo/ }).click();
  await expect(page.locator("#video-complementar")).toContainText("aberto");

  await page.goto("/progresso");
  const secao = page.locator("section", { hasText: "Vídeos complementares" });
  await expect(secao).toContainText("1/18 abertos");

  await expect(secao).toContainText("Não há como saber daqui");
});

test("cada cartão de simulador e laboratório traz sua prévia", async ({ page }) => {
  for (const rota of ["/simuladores", "/laboratorios"]) {
    await page.goto(rota);
    const cartoes = page.locator("main ul > li");
    const total = await cartoes.count();
    expect(total).toBeGreaterThan(0);

    const previas = page.locator("main ul > li svg[data-preview]");
    expect(await previas.count(), `prévias em ${rota}`).toBe(total);
  }
});
