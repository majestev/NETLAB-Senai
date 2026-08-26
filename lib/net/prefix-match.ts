import {
  formatIpv4,
  maskFromPrefix,
  networkAddress,
  type PrefixLength,
} from "./ipv4";
import type { RouteEntry } from "./routing";

export type Bit = 0 | 1;

export interface BitCell {
  bit: Bit;

  destinationBit: Bit;

  inPrefix: boolean;

  matches: boolean;
}

export interface PrefixMatchRow {
  routeId: string;
  label: string;
  network: number;
  prefix: PrefixLength;
  bits: BitCell[];

  matches: boolean;

  firstMismatch: number | null;
}

export interface PrefixMatchAnalysis {
  destination: number;
  destinationBits: Bit[];

  rows: PrefixMatchRow[];

  matching: PrefixMatchRow[];

  longestPrefix: PrefixLength | null;

  winners: PrefixMatchRow[];

  decidedByBits: boolean;
}

export function addressBits(value: number): Bit[] {
  const bits: Bit[] = [];
  for (let i = 31; i >= 0; i -= 1) {
    bits.push(((value >>> i) & 1) as Bit);
  }
  return bits;
}

export function analyzePrefixMatch(
  destination: number,
  routes: RouteEntry[],
): PrefixMatchAnalysis {
  const destinationBits = addressBits(destination);

  const rows: PrefixMatchRow[] = routes
    .map((route) => {
      const rede = networkAddress(route.network, route.prefix);
      const bitsRede = addressBits(rede);

      let firstMismatch: number | null = null;
      const bits: BitCell[] = bitsRede.map((bit, i) => {
        const inPrefix = i < route.prefix;
        const igual = bit === destinationBits[i];
        if (inPrefix && !igual && firstMismatch === null) firstMismatch = i;
        return {
          bit,
          destinationBit: destinationBits[i]!,
          inPrefix,
          matches: inPrefix ? igual : false,
        };
      });

      return {
        routeId: route.id,
        label: `${formatIpv4(rede)}/${route.prefix}`,
        network: rede,
        prefix: route.prefix,
        bits,
        matches: firstMismatch === null,
        firstMismatch,
      };
    })
    .sort((a, b) => b.prefix - a.prefix);

  const matching = rows.filter((r) => r.matches);
  const longestPrefix = matching.length > 0 ? matching[0]!.prefix : null;
  const winners =
    longestPrefix === null
      ? []
      : matching.filter((r) => r.prefix === longestPrefix);

  return {
    destination,
    destinationBits,
    rows,
    matching,
    longestPrefix,
    winners,
    decidedByBits: winners.length === 1,
  };
}

export function prefixReach(prefix: PrefixLength): number {
  return 2 ** (32 - prefix);
}

export function maskLabel(prefix: PrefixLength): string {
  return formatIpv4(maskFromPrefix(prefix));
}
