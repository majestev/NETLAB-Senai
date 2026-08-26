import { test, expect } from "@playwright/test";
import {
  broadcastAddress,
  classifyAddress,
  firstUsableHost,
  formatIpv4,
  hasNetworkAndBroadcast,
  lastUsableHost,
  legacyClass,
  maskFromPrefix,
  networkAddress,
  networksOverlap,
  parseCidr,
  parseIpv4,
  parsePrefixLength,
  prefixForHosts,
  prefixFromMask,
  toBinary,
  totalAddresses,
  usableHosts,
  wildcardFromPrefix,
} from "@/lib/net/ipv4";

const ip = (value: string) => {
  const parsed = parseIpv4(value);
  if (!parsed.ok) throw new Error(`endereço de teste inválido: ${value}`);
  return parsed.value;
};

test.describe("parseIpv4", () => {
  test("aceita endereços válidos incluindo as bordas", () => {
    expect(formatIpv4(ip("0.0.0.0"))).toBe("0.0.0.0");
    expect(formatIpv4(ip("255.255.255.255"))).toBe("255.255.255.255");
    expect(formatIpv4(ip("192.168.10.1"))).toBe("192.168.10.1");

    expect(ip("255.255.255.0")).toBeGreaterThan(0);
  });

  test("rejeita entrada inválida com mensagem acionável", () => {
    for (const bad of ["256.1.1.1", "1.1.1", "1.1.1.1.1", "a.b.c.d", "", "192.168..1", "1.1.1.-1"]) {
      const result = parseIpv4(bad);
      expect(result.ok, `deveria rejeitar "${bad}"`).toBe(false);
      if (!result.ok) expect(result.error.length).toBeGreaterThan(10);
    }
  });

  test("nunca devolve NaN silencioso", () => {
    const result = parseIpv4("abc");
    expect(result.ok).toBe(false);
  });
});

test.describe("prefixo e máscara", () => {
  test("converte prefixo em máscara nos dois sentidos", () => {
    const casos: Array<[number, string]> = [
      [0, "0.0.0.0"],
      [8, "255.0.0.0"],
      [16, "255.255.0.0"],
      [24, "255.255.255.0"],
      [26, "255.255.255.192"],
      [30, "255.255.255.252"],
      [31, "255.255.255.254"],
      [32, "255.255.255.255"],
    ];
    for (const [prefix, mask] of casos) {
      expect(formatIpv4(maskFromPrefix(prefix)), `/${prefix}`).toBe(mask);
      const back = prefixFromMask(ip(mask));
      expect(back.ok).toBe(true);
      if (back.ok) expect(back.value).toBe(prefix);
    }
  });

  test("curinga é o complemento da máscara", () => {
    expect(formatIpv4(wildcardFromPrefix(24))).toBe("0.0.0.255");
    expect(formatIpv4(wildcardFromPrefix(26))).toBe("0.0.0.63");
    expect(formatIpv4(wildcardFromPrefix(30))).toBe("0.0.0.3");
    expect(formatIpv4(wildcardFromPrefix(0))).toBe("255.255.255.255");
  });

  test("rejeita máscara com bits não contíguos", () => {
    const result = prefixFromMask(ip("255.255.0.255"));
    expect(result.ok).toBe(false);
  });

  test("rejeita prefixo fora da faixa", () => {
    expect(parsePrefixLength("33").ok).toBe(false);
    expect(parsePrefixLength("-1").ok).toBe(false);
    expect(parsePrefixLength("").ok).toBe(false);
    expect(parsePrefixLength("24").ok).toBe(true);
  });
});

test.describe("cálculo de sub-rede", () => {
  test("192.168.10.77/26 — caso trabalhado da aula", () => {
    const address = ip("192.168.10.77");
    expect(formatIpv4(networkAddress(address, 26))).toBe("192.168.10.64");
    expect(formatIpv4(broadcastAddress(address, 26))).toBe("192.168.10.127");
    expect(formatIpv4(firstUsableHost(address, 26))).toBe("192.168.10.65");
    expect(formatIpv4(lastUsableHost(address, 26))).toBe("192.168.10.126");
    expect(usableHosts(26)).toBe(62);
    expect(totalAddresses(26)).toBe(64);
  });

  test("/24 clássico", () => {
    const address = ip("10.1.1.200");
    expect(formatIpv4(networkAddress(address, 24))).toBe("10.1.1.0");
    expect(formatIpv4(broadcastAddress(address, 24))).toBe("10.1.1.255");
    expect(usableHosts(24)).toBe(254);
  });

  test("/30 — enlace ponto a ponto com 2 hosts", () => {
    const address = ip("203.0.113.5");
    expect(formatIpv4(networkAddress(address, 30))).toBe("203.0.113.4");
    expect(formatIpv4(firstUsableHost(address, 30))).toBe("203.0.113.5");
    expect(formatIpv4(lastUsableHost(address, 30))).toBe("203.0.113.6");
    expect(formatIpv4(broadcastAddress(address, 30))).toBe("203.0.113.7");
    expect(usableHosts(30)).toBe(2);
    expect(hasNetworkAndBroadcast(30)).toBe(true);
  });

  test("/31 e /32 — as exceções", () => {
    expect(usableHosts(31)).toBe(2);
    expect(hasNetworkAndBroadcast(31)).toBe(false);
    const p2p = ip("10.0.0.4");
    expect(formatIpv4(firstUsableHost(p2p, 31))).toBe("10.0.0.4");
    expect(formatIpv4(lastUsableHost(p2p, 31))).toBe("10.0.0.5");

    expect(usableHosts(32)).toBe(1);
    expect(hasNetworkAndBroadcast(32)).toBe(false);
    expect(formatIpv4(networkAddress(ip("8.8.8.8"), 32))).toBe("8.8.8.8");
  });

  test("/0 abrange todo o espaço", () => {
    expect(formatIpv4(networkAddress(ip("192.168.1.1"), 0))).toBe("0.0.0.0");
    expect(formatIpv4(broadcastAddress(ip("192.168.1.1"), 0))).toBe("255.255.255.255");
    expect(totalAddresses(0)).toBe(4294967296);
  });

  test("binário mostra 32 bits agrupados por octeto", () => {
    expect(toBinary(ip("192.168.10.0"))).toBe("11000000.10101000.00001010.00000000");
    expect(toBinary(maskFromPrefix(26))).toBe("11111111.11111111.11111111.11000000");
  });
});

test.describe("parseCidr", () => {
  test("aceita barra e máscara decimal pontuada", () => {
    const a = parseCidr("192.168.10.0/24");
    expect(a.ok).toBe(true);
    if (a.ok) expect(a.value.prefix).toBe(24);

    const b = parseCidr("192.168.10.0 255.255.255.0");
    expect(b.ok).toBe(true);
    if (b.ok) expect(b.value.prefix).toBe(24);
  });

  test("rejeita formato desconhecido", () => {
    expect(parseCidr("192.168.10.0/").ok).toBe(false);
    expect(parseCidr("banana").ok).toBe(false);
    expect(parseCidr("192.168.10.0/33").ok).toBe(false);
  });
});

test.describe("classificação", () => {
  test("reconhece as faixas normatizadas", () => {
    expect(classifyAddress(ip("10.5.5.5")).scope).toBe("privado");
    expect(classifyAddress(ip("172.16.0.1")).scope).toBe("privado");
    expect(classifyAddress(ip("172.31.255.254")).scope).toBe("privado");
    expect(classifyAddress(ip("192.168.1.1")).scope).toBe("privado");
    expect(classifyAddress(ip("127.0.0.1")).scope).toBe("loopback");
    expect(classifyAddress(ip("169.254.1.1")).scope).toBe("link-local");
    expect(classifyAddress(ip("224.0.0.9")).scope).toBe("multicast");
    expect(classifyAddress(ip("203.0.113.10")).scope).toBe("documentação");
    expect(classifyAddress(ip("8.8.8.8")).scope).toBe("público");
    expect(classifyAddress(ip("255.255.255.255")).scope).toBe("broadcast limitado");
  });

  test("172.32.0.1 é público — a borda do bloco /12", () => {
    expect(classifyAddress(ip("172.32.0.1")).scope).toBe("público");
    expect(classifyAddress(ip("172.15.255.255")).scope).toBe("público");
  });

  test("classe histórica", () => {
    expect(legacyClass(ip("10.0.0.1")).name).toBe("A");
    expect(legacyClass(ip("172.16.0.1")).name).toBe("B");
    expect(legacyClass(ip("192.168.0.1")).name).toBe("C");
    expect(legacyClass(ip("224.0.0.1")).name).toBe("D");
    expect(legacyClass(ip("250.0.0.1")).name).toBe("E");
  });
});

test.describe("dimensionamento", () => {
  test("prefixForHosts escolhe o menor bloco suficiente", () => {
    const casos: Array<[number, number]> = [
      [1, 30],
      [2, 30],
      [3, 29],
      [6, 29],
      [7, 28],
      [14, 28],
      [30, 27],
      [50, 26],
      [62, 26],
      [63, 25],
      [126, 25],
      [254, 24],
    ];
    for (const [hosts, prefix] of casos) {
      const result = prefixForHosts(hosts);
      expect(result.ok, `${hosts} hosts`).toBe(true);
      if (result.ok) expect(result.value, `${hosts} hosts`).toBe(prefix);
    }
  });

  test("rejeita quantidade impossível", () => {
    expect(prefixForHosts(0).ok).toBe(false);
    expect(prefixForHosts(-5).ok).toBe(false);
    expect(prefixForHosts(1.5).ok).toBe(false);
    expect(prefixForHosts(5_000_000_000).ok).toBe(false);
  });

  test("detecta sobreposição", () => {
    expect(
      networksOverlap(
        { address: ip("192.168.10.0"), prefix: 24 },
        { address: ip("192.168.10.64"), prefix: 26 },
      ),
    ).toBe(true);
    expect(
      networksOverlap(
        { address: ip("192.168.10.0"), prefix: 26 },
        { address: ip("192.168.10.64"), prefix: 26 },
      ),
    ).toBe(false);
  });
});

test.describe("prefixForHosts — regra clássica vs. ponto a ponto", () => {
  test("por padrão para em /30, como a regra 2^h − 2 do curso", () => {
    const dois = prefixForHosts(2);
    expect(dois.ok && dois.value).toBe(30);
    const um = prefixForHosts(1);
    expect(um.ok && um.value).toBe(30);
  });

  test("com allowPointToPoint desce até /31 e /32 (RFC 3021)", () => {
    const dois = prefixForHosts(2, { allowPointToPoint: true });
    expect(dois.ok && dois.value).toBe(31);
    const um = prefixForHosts(1, { allowPointToPoint: true });
    expect(um.ok && um.value).toBe(32);
  });
});
