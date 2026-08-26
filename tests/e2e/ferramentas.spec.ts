import { test, expect } from "@playwright/test";

test.describe("calculadora de sub-redes", () => {
  test("calcula o caso trabalhado da aula", async ({ page }) => {
    await page.goto("/simuladores/subnetting");
    const campo = page.getByLabel("Endereço com prefixo");
    await campo.fill("192.168.10.77/26");

    const resultado = page.getByRole("region", { name: "Resultado do cálculo" });
    await expect(resultado).toContainText("192.168.10.64/26");
    await expect(resultado).toContainText("255.255.255.192");
    await expect(resultado).toContainText("0.0.0.63");
    await expect(resultado).toContainText("192.168.10.127");
    await expect(resultado).toContainText("192.168.10.65");
    await expect(resultado).toContainText("192.168.10.126");
    await expect(resultado).toContainText("62");
  });

  test("entrada inválida mostra erro ligado ao campo e não calcula", async ({ page }) => {
    await page.goto("/simuladores/subnetting");
    const campo = page.getByLabel("Endereço com prefixo");
    await campo.fill("256.1.1.1/24");

    await expect(campo).toHaveAttribute("aria-invalid", "true");
    const erro = page.locator("#subnet-erro");
    await expect(erro).toBeVisible();
    await expect(erro).toContainText(/255/);
    await expect(page.getByText(/Corrija o endereço acima/)).toBeVisible();
  });

  test("o modo binário marca os bits de rede", async ({ page }) => {
    await page.goto("/simuladores/subnetting");
    await expect(page.getByText("26 bits de rede")).toBeVisible();
    await expect(page.getByText("6 bits de host")).toBeVisible();
  });
});

test.describe("alocador VLSM", () => {
  test("aloca o cenário padrão sem sobreposição", async ({ page }) => {
    await page.goto("/simuladores/vlsm");
    const tabela = page.getByRole("region", { name: /Sub-redes alocadas/ });
    await expect(tabela).toContainText("192.168.10.0/26");
    await expect(tabela).toContainText("192.168.10.64/27");
    await expect(tabela).toContainText("LAN A");
    await expect(tabela).toContainText("WAN 1");
  });

  test("acusa quando o bloco não comporta a demanda", async ({ page }) => {
    await page.goto("/simuladores/vlsm");
    await page.getByLabel("Hosts", { exact: false }).first().fill("300");
    await expect(page.getByText(/Não coube/)).toBeVisible();
  });
});

test.describe("decisão de encaminhamento", () => {
  test("mostra os passos e escolhe o prefixo mais longo", async ({ page }) => {
    await page.goto("/simuladores/roteamento");
    await page.getByRole("button", { name: "Calcular melhor rota" }).click();

    const passos = page.getByRole("list", { name: "Passos da decisão" });
    await expect(
      passos.getByRole("button", { name: /Prefixo mais longo/ }),
    ).toBeVisible();
    await expect(
      passos.getByRole("button", { name: /Distância administrativa/ }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Próximo" })).toBeVisible();
  });

  test("destino sem rota é descartado", async ({ page }) => {
    await page.goto("/simuladores/roteamento");
    await page.getByLabel("IP de destino").fill("10.1.1.5");
    await page.getByRole("button", { name: "Calcular melhor rota" }).click();
    const passos = page.getByRole("list", { name: "Passos da decisão" });
    await expect(
      passos.getByRole("button", { name: /Rotas que casam com o destino/ }),
    ).toBeVisible();
  });
});

test.describe("simulador RIP", () => {
  test("converge e mostra a métrica correta", async ({ page }) => {
    await page.goto("/simuladores/rip");

    const proximo = page.getByRole("button", { name: "Rodada" });

    for (let i = 0; i < 5 && (await proximo.isEnabled()); i += 1) {
      await proximo.click();
    }
    await expect(page.getByText(/Convergida em/)).toBeVisible();

    const tabelaR1 = page.getByRole("region", { name: /Tabela de roteamento de R1/ });
    await expect(tabelaR1).toContainText("192.168.3.0/24");
  });

  test("derrubar um enlace remove a rede do outro lado", async ({ page }) => {
    await page.goto("/simuladores/rip");
    await page.getByRole("button", { name: /Derrubar R2–R3/ }).click();
    await expect(page.getByText(/enlace caído/)).toBeVisible();

    const proximo = page.getByRole("button", { name: "Rodada" });
    for (let i = 0; i < 5 && (await proximo.isEnabled()); i += 1) {
      await proximo.click();
    }
    const tabelaR1 = page.getByRole("region", { name: /Tabela de roteamento de R1/ });
    await expect(tabelaR1).not.toContainText("192.168.3.0/24");
  });
});

test.describe("simulador de comutação", () => {
  test("inunda o primeiro quadro e aprende a origem", async ({ page }) => {
    await page.goto("/simuladores/switch");
    await page.getByRole("button", { name: "Enviar quadro" }).click();

    await expect(page.getByText("inundar")).toBeVisible();
    await expect(page.getByText(/ainda não está na tabela CAM/)).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Endereços MAC aprendidos pelo switch" }),
    ).toContainText("00:11:11:11:11:11");
  });

  test("a resposta transforma o encaminhamento em unicast", async ({ page }) => {
    await page.goto("/simuladores/switch");
    await page.getByRole("button", { name: "Enviar quadro" }).click();

    await page.getByLabel("Origem").selectOption({ label: "PC2" });
    await page.getByLabel("Destino").selectOption({ label: "PC1" });
    await page.getByRole("button", { name: "Enviar quadro" }).click();

    await expect(page.getByText("encaminhar").first()).toBeVisible();
  });
});

test.describe("VLAN e 802.1Q", () => {
  test("o quadro sai marcado pelo trunk e não vai para a outra VLAN", async ({ page }) => {
    await page.goto("/simuladores/vlan");
    await page.getByRole("button", { name: "Enviar quadro" }).click();
    await expect(page.getByText("802.1Q").first()).toBeVisible();
    await expect(page.getByText(/Sai por:/)).toContainText("Gi0/1");
  });
});

test.describe("analisador de protocolos", () => {
  test("lista pacotes e abre os detalhes por camada", async ({ page }) => {
    await page.goto("/simuladores/analisador");
    await expect(page.getByRole("region", { name: "Lista de pacotes capturados" })).toContainText("ARP");

    await page.getByRole("button", { name: /Ver detalhes do pacote 3/ }).click();
    await expect(page.getByText("Ethernet II")).toBeVisible();
    await expect(page.getByText("Internet Protocol Version 4")).toBeVisible();
    await expect(page.getByText("Transmission Control Protocol")).toBeVisible();
  });

  test("o filtro por protocolo reduz a lista", async ({ page }) => {
    await page.goto("/simuladores/analisador");
    await page.getByRole("button", { name: "ARP", exact: true }).click();
    await expect(page.getByText(/2 de 10 pacotes/)).toBeVisible();
  });
});

test.describe("laboratórios", () => {
  test("valida uma alocação VLSM correta", async ({ page }) => {
    await page.goto("/laboratorios/vlsm");
    await page.getByLabel("LAN A").fill("192.168.10.0/26");
    await page.getByLabel("LAN B").fill("192.168.10.64/27");
    await page.getByLabel("LAN C").fill("192.168.10.96/28");
    await page.getByLabel("LAN D").fill("192.168.10.112/28");
    await page.getByLabel("WAN 1").fill("192.168.10.128/30");
    await page.getByLabel("WAN 2").fill("192.168.10.132/30");
    await page.getByRole("button", { name: "Validar alocação" }).click();
    await expect(page.getByText(/Alocação válida/)).toBeVisible();
  });

  test("acusa sobreposição numa alocação errada", async ({ page }) => {
    await page.goto("/laboratorios/vlsm");
    await page.getByLabel("LAN A").fill("192.168.10.0/26");
    await page.getByLabel("LAN B").fill("192.168.10.32/27");
    await page.getByRole("button", { name: "Validar alocação" }).click();
    await expect(page.getByText(/se sobrepõem/)).toBeVisible();
  });

  test("corrige uma escolha e explica o porquê", async ({ page }) => {
    await page.goto("/laboratorios/switching");
    await page
      .getByRole("radio", { name: /Inunda por todas as portas exceto a de entrada/ })
      .check();
    await page.getByRole("button", { name: "Verificar" }).first().click();
    await expect(page.getByText("Correto").first()).toBeVisible();
    await expect(page.getByText(/Destino desconhecido é inundado/)).toBeVisible();
  });
});

test.describe("construtor de topologia (React Flow)", () => {
  test("a contagem inicial reflete um switch com três hosts", async ({ page }) => {
    await page.goto("/laboratorios/dominios");
    await expect(page.getByTestId("contagem-colisao")).toContainText("3");
    await expect(page.getByTestId("contagem-broadcast")).toContainText("1");
  });

  test("acrescentar um roteador e ligá-lo cria um domínio de broadcast", async ({ page }) => {
    await page.goto("/laboratorios/dominios");
    await page.getByRole("button", { name: "Roteador", exact: true }).click();

    await page.getByLabel("Equipamento de origem").selectOption({ label: "R1" });
    await page.getByLabel("Equipamento de destino").selectOption({ label: "PC1" });
    await page.getByRole("button", { name: "Ligar" }).click();

    await expect(page.getByTestId("contagem-broadcast")).toContainText("2");
  });

  test("a topologia é montável sem arrastar, só por teclado e formulário", async ({ page }) => {
    await page.goto("/laboratorios/dominios");
    await page.getByRole("button", { name: "Hub", exact: true }).click();
    await expect(page.getByText(/Equipamentos \(5\)/)).toBeVisible();

    await page.getByLabel("Equipamento de origem").selectOption({ label: "HUB1" });
    await page.getByLabel("Equipamento de destino").selectOption({ label: "PC2" });
    await page.getByRole("button", { name: "Ligar" }).click();
    await expect(page.getByText(/Enlaces \(4\)/)).toBeVisible();
  });

  test("remover um enlace atualiza a contagem", async ({ page }) => {
    await page.goto("/laboratorios/dominios");
    await page
      .getByRole("button", { name: /Remover o enlace entre SW1 e PC1/ })
      .click();
    await expect(page.getByTestId("contagem-colisao")).toContainText("2");
  });
})
