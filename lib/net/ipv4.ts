export const MAX_UINT32 = 0xffffffff;

export type PrefixLength = number;

export interface Ipv4Network {
  address: number;
  prefix: PrefixLength;
}

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseIpv4(input: string): ParseResult<number> {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { ok: false, error: "Informe um endereço IPv4." };
  }

  const parts = trimmed.split(".");
  if (parts.length !== 4) {
    return {
      ok: false,
      error: "Um endereço IPv4 tem quatro octetos separados por ponto.",
    };
  }

  let value = 0;
  for (const [index, part] of parts.entries()) {
    if (!/^\d{1,3}$/.test(part)) {
      return {
        ok: false,
        error: `O ${index + 1}º octeto (“${part}”) precisa ser um número de 0 a 255.`,
      };
    }
    const octet = Number(part);
    if (octet > 255) {
      return {
        ok: false,
        error: `O ${index + 1}º octeto (${octet}) passa de 255.`,
      };
    }
    value = (value << 8) | octet;
  }
  return { ok: true, value: value >>> 0 };
}

export function parsePrefixLength(input: string): ParseResult<PrefixLength> {
  const trimmed = input.trim().replace(/^\//, "");
  if (!/^\d{1,2}$/.test(trimmed)) {
    return { ok: false, error: "O prefixo é um número de 0 a 32 (ex.: /24)." };
  }
  const prefix = Number(trimmed);
  if (prefix > 32) {
    return { ok: false, error: `O prefixo /${prefix} passa de /32.` };
  }
  return { ok: true, value: prefix };
}

export function parseCidr(input: string): ParseResult<Ipv4Network> {
  const trimmed = input.trim();
  const bySlash = trimmed.split("/");

  if (bySlash.length === 2) {
    const address = parseIpv4(bySlash[0]);
    if (!address.ok) return address;
    const prefix = parsePrefixLength(bySlash[1]);
    if (!prefix.ok) return prefix;
    return { ok: true, value: { address: address.value, prefix: prefix.value } };
  }

  const bySpace = trimmed.split(/\s+/);
  if (bySpace.length === 2) {
    const address = parseIpv4(bySpace[0]);
    if (!address.ok) return address;
    const mask = parseIpv4(bySpace[1]);
    if (!mask.ok) return mask;
    const prefix = prefixFromMask(mask.value);
    if (!prefix.ok) return prefix;
    return { ok: true, value: { address: address.value, prefix: prefix.value } };
  }

  return {
    ok: false,
    error: "Use o formato 192.168.10.0/24 ou 192.168.10.0 255.255.255.0.",
  };
}

export function formatIpv4(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join(".");
}

export function toBinary(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]
    .map((octet) => octet.toString(2).padStart(8, "0"))
    .join(".");
}

export function maskFromPrefix(prefix: PrefixLength): number {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return MAX_UINT32;
  return (MAX_UINT32 << (32 - prefix)) >>> 0;
}

export function wildcardFromPrefix(prefix: PrefixLength): number {
  return (~maskFromPrefix(prefix) >>> 0) >>> 0;
}

export function prefixFromMask(mask: number): ParseResult<PrefixLength> {
  const m = mask >>> 0;

  const inverted = (~m >>> 0) >>> 0;
  if (((inverted + 1) & inverted) !== 0) {
    return {
      ok: false,
      error: `${formatIpv4(m)} não é uma máscara válida: os bits 1 precisam ser contíguos.`,
    };
  }
  let prefix = 0;
  let value = m;
  while (value & 0x80000000) {
    prefix += 1;
    value = (value << 1) >>> 0;
  }
  return { ok: true, value: prefix };
}

export function networkAddress(address: number, prefix: PrefixLength): number {
  return ((address >>> 0) & maskFromPrefix(prefix)) >>> 0;
}

export function broadcastAddress(address: number, prefix: PrefixLength): number {
  return (networkAddress(address, prefix) | wildcardFromPrefix(prefix)) >>> 0;
}

export function totalAddresses(prefix: PrefixLength): number {
  return 2 ** (32 - prefix);
}

export function usableHosts(prefix: PrefixLength): number {
  if (prefix >= 32) return 1;
  if (prefix === 31) return 2;
  return 2 ** (32 - prefix) - 2;
}

export function firstUsableHost(address: number, prefix: PrefixLength): number {
  const network = networkAddress(address, prefix);
  if (prefix >= 32) return network;
  if (prefix === 31) return network;
  return (network + 1) >>> 0;
}

export function lastUsableHost(address: number, prefix: PrefixLength): number {
  const broadcast = broadcastAddress(address, prefix);
  if (prefix >= 32) return broadcast;
  if (prefix === 31) return broadcast;
  return (broadcast - 1) >>> 0;
}

export function hasNetworkAndBroadcast(prefix: PrefixLength): boolean {
  return prefix <= 30;
}

export type AddressScope =
  | "privado"
  | "público"
  | "loopback"
  | "link-local"
  | "multicast"
  | "documentação"
  | "reservado"
  | "broadcast limitado"
  | "rede indeterminada";

interface ScopeRule {
  network: string;
  prefix: PrefixLength;
  scope: AddressScope;
  reference: string;
}

export const SCOPE_RULES: ScopeRule[] = [
  { network: "0.0.0.0", prefix: 8, scope: "rede indeterminada", reference: "RFC 1122" },
  { network: "10.0.0.0", prefix: 8, scope: "privado", reference: "RFC 1918" },
  { network: "127.0.0.0", prefix: 8, scope: "loopback", reference: "RFC 1122" },
  { network: "169.254.0.0", prefix: 16, scope: "link-local", reference: "RFC 3927" },
  { network: "172.16.0.0", prefix: 12, scope: "privado", reference: "RFC 1918" },
  { network: "192.0.2.0", prefix: 24, scope: "documentação", reference: "RFC 5737" },
  { network: "192.168.0.0", prefix: 16, scope: "privado", reference: "RFC 1918" },
  { network: "198.51.100.0", prefix: 24, scope: "documentação", reference: "RFC 5737" },
  { network: "203.0.113.0", prefix: 24, scope: "documentação", reference: "RFC 5737" },
  { network: "224.0.0.0", prefix: 4, scope: "multicast", reference: "RFC 5771" },
  { network: "240.0.0.0", prefix: 4, scope: "reservado", reference: "RFC 1112" },
];

export function classifyAddress(address: number): {
  scope: AddressScope;
  reference: string;
} {
  if ((address >>> 0) === MAX_UINT32) {
    return { scope: "broadcast limitado", reference: "RFC 919" };
  }
  for (const rule of SCOPE_RULES) {
    const parsed = parseIpv4(rule.network);
    if (!parsed.ok) continue;
    if (networkAddress(address, rule.prefix) === parsed.value) {
      return { scope: rule.scope, reference: rule.reference };
    }
  }
  return { scope: "público", reference: "IANA" };
}

export function legacyClass(address: number): {
  name: "A" | "B" | "C" | "D" | "E";
  defaultPrefix: PrefixLength | null;
  note: string;
} {
  const firstOctet = (address >>> 24) & 255;
  if (firstOctet < 128)
    return { name: "A", defaultPrefix: 8, note: "1–126 (0 e 127 reservados)" };
  if (firstOctet < 192) return { name: "B", defaultPrefix: 16, note: "128–191" };
  if (firstOctet < 224) return { name: "C", defaultPrefix: 24, note: "192–223" };
  if (firstOctet < 240)
    return { name: "D", defaultPrefix: null, note: "224–239, multicast" };
  return { name: "E", defaultPrefix: null, note: "240–255, reservado" };
}

export function isInNetwork(
  address: number,
  network: number,
  prefix: PrefixLength,
): boolean {
  return networkAddress(address, prefix) === networkAddress(network, prefix);
}

export function networksOverlap(a: Ipv4Network, b: Ipv4Network): boolean {
  const shorter = Math.min(a.prefix, b.prefix);
  return networkAddress(a.address, shorter) === networkAddress(b.address, shorter);
}

export interface PrefixForHostsOptions {
  allowPointToPoint?: boolean;
}

export function prefixForHosts(
  hosts: number,
  options: PrefixForHostsOptions = {},
): ParseResult<PrefixLength> {
  if (!Number.isInteger(hosts) || hosts < 1) {
    return { ok: false, error: "A quantidade de hosts precisa ser um inteiro ≥ 1." };
  }
  const smallest = options.allowPointToPoint ? 32 : 30;
  for (let prefix = smallest; prefix >= 0; prefix -= 1) {
    if (usableHosts(prefix) >= hosts) return { ok: true, value: prefix };
  }
  return {
    ok: false,
    error: `Nem um /0 comporta ${hosts} hosts em IPv4.`,
  };
}
