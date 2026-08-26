import {
  formatIpv4,
  maskFromPrefix,
  networkAddress,
  parseIpv4,
  prefixFromMask,
  type ParseResult,
  type PrefixLength,
} from "./ipv4";

export interface StaticRoute {
  network: number;
  prefix: PrefixLength;

  nextHop: number | null;

  exitInterface: string | null;

  distance: number | null;
}

const INTERFACE_RE = /^[a-z]{2,}[0-9]+(?:[/.][0-9]+)*$/i;

function erro(message: string): ParseResult<never> {
  return { ok: false, error: message };
}

export function parseStaticRoute(input: string): ParseResult<StaticRoute> {
  const bruto = input.trim().replace(/\s+/g, " ");
  if (!bruto) {
    return erro("Escreva o comando completo, começando por ip route.");
  }

  const partes = bruto.split(" ");
  const cabeca = partes.slice(0, 2).join(" ").toLowerCase();
  if (cabeca !== "ip route") {
    return erro(
      "O comando de rota estática começa com ip route. Exemplo: ip route 192.168.3.0 255.255.255.0 10.0.12.2",
    );
  }

  const argumentos = partes.slice(2);

  if (argumentos[0]?.includes("/")) {
    return erro(
      `Aqui a máscara vai separada, em decimal pontuada: ip route ${argumentos[0].split("/")[0]} 255.255.255.0 10.0.12.2`,
    );
  }

  if (argumentos.length < 3) {
    return erro(
      "Faltam argumentos. A forma é: ip route <rede> <máscara> <próximo salto ou interface>.",
    );
  }

  const [redeBruta, mascaraBruta, ...resto] = argumentos;

  const rede = parseIpv4(redeBruta!);
  if (!rede.ok) return erro(`Rede de destino: ${rede.error}`);

  const mascara = parseIpv4(mascaraBruta!);
  if (!mascara.ok) {
    return erro(
      `Máscara: ${mascara.error} Ela vai em decimal pontuada, como 255.255.255.0.`,
    );
  }

  const prefixo = prefixFromMask(mascara.value);
  if (!prefixo.ok) return erro(`Máscara: ${prefixo.error}`);

  let nextHop: number | null = null;
  let exitInterface: string | null = null;
  let distance: number | null = null;

  for (const token of resto) {
    if (/^[0-9]{1,3}$/.test(token)) {
      const v = Number(token);
      if (v < 1 || v > 255) {
        return erro("A distância administrativa vai de 1 a 255.");
      }
      distance = v;
      continue;
    }

    const endereco = parseIpv4(token);
    if (endereco.ok) {
      if (nextHop !== null) {
        return erro("Há dois endereços de próximo salto no comando. Deixe apenas um.");
      }
      nextHop = endereco.value;
      continue;
    }

    if (INTERFACE_RE.test(token)) {
      if (exitInterface !== null) {
        return erro("Há duas interfaces de saída no comando. Deixe apenas uma.");
      }
      exitInterface = token;
      continue;
    }

    return erro(
      `Não reconheço "${token}" como próximo salto nem como interface de saída.`,
    );
  }

  if (nextHop === null && exitInterface === null) {
    return erro(
      "Falta dizer por onde a rota sai: um endereço de próximo salto ou uma interface.",
    );
  }

  return {
    ok: true,
    value: {
      network: networkAddress(rede.value, prefixo.value),
      prefix: prefixo.value,
      nextHop,
      exitInterface,
      distance,
    },
  };
}

export interface ExpectedRoute {
  destination: string;

  nextHop: string;

  exitInterfaces?: string[];
}

export interface RouteVerdict {
  correct: boolean;

  message: string;

  nuance?: string;
}

export function checkStaticRoute(
  input: string,
  expected: ExpectedRoute,
): RouteVerdict {
  const cmd = parseStaticRoute(input);
  if (!cmd.ok) return { correct: false, message: cmd.error };

  const [redeEsperada, prefixoEsperado] = expected.destination.split("/");
  const alvo = parseIpv4(redeEsperada!);
  const prefixo = Number(prefixoEsperado);
  if (!alvo.ok) throw new Error(`destino inválido no laboratório: ${expected.destination}`);

  const proximoEsperado = parseIpv4(expected.nextHop);
  if (!proximoEsperado.ok) {
    throw new Error(`próximo salto inválido no laboratório: ${expected.nextHop}`);
  }

  if (cmd.value.prefix !== prefixo || cmd.value.network !== alvo.value) {
    return {
      correct: false,
      message: `Essa rota aponta para ${formatIpv4(cmd.value.network)}/${cmd.value.prefix}. O destino desta tarefa é ${expected.destination}, ou seja, máscara ${formatIpv4(maskFromPrefix(prefixo))}.`,
    };
  }

  const interfacesAceitas = (expected.exitInterfaces ?? []).map((i) =>
    i.toLowerCase(),
  );
  const interfaceOk =
    cmd.value.exitInterface !== null &&
    interfacesAceitas.includes(cmd.value.exitInterface.toLowerCase());
  const proximoOk = cmd.value.nextHop === proximoEsperado.value;

  if (cmd.value.nextHop !== null && !proximoOk) {
    return {
      correct: false,
      message: `O próximo salto precisa ser um endereço do outro lado do enlace. ${formatIpv4(cmd.value.nextHop)} não é: o correto é ${expected.nextHop}.`,
    };
  }

  if (cmd.value.exitInterface !== null && !interfaceOk) {
    return {
      correct: false,
      message: `A interface ${cmd.value.exitInterface} não é a que dá para o enlace. Use ${expected.exitInterfaces?.join(" ou ") ?? "a interface do enlace"}, ou aponte direto para o próximo salto ${expected.nextHop}.`,
    };
  }

  if (proximoOk) {
    return {
      correct: true,
      message: "A rota aponta para o destino certo pelo próximo salto correto.",
      nuance: interfaceOk
        ? "Você informou interface e próximo salto. Essa forma é válida e é a mais explícita de todas: dispensa consulta recursiva e não depende de ARP por proxy."
        : undefined,
    };
  }

  if (interfaceOk) {
    return {
      correct: true,
      message: "A rota aponta para o destino certo pela interface de saída.",
      nuance: `Em enlace ponto a ponto isso funciona, porque só existe um vizinho possível. Em rede de acesso múltiplo, como Ethernet compartilhada, o roteador não saberia para qual vizinho enviar e dependeria de ARP por proxy. Por isso o próximo salto explícito, ${expected.nextHop}, é a forma preferida.`,
    };
  }

  return {
    correct: false,
    message: `Falta dizer por onde a rota sai. Informe o próximo salto ${expected.nextHop} ou a interface do enlace.`,
  };
}
