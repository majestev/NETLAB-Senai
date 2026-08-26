import {
  broadcastAddress,
  firstUsableHost,
  formatIpv4,
  lastUsableHost,
  maskFromPrefix,
  networkAddress,
  prefixForHosts,
  totalAddresses,
  usableHosts,
  type Ipv4Network,
  type PrefixLength,
} from "./ipv4";

export interface VlsmRequirement {
  id: string;
  label: string;

  hosts: number;
}

export interface VlsmAllocation {
  requirement: VlsmRequirement;
  network: number;
  prefix: PrefixLength;
  mask: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  usable: number;

  waste: number;
}

export interface VlsmResult {
  ok: boolean;
  allocations: VlsmAllocation[];

  unallocated: VlsmRequirement[];

  remainingAddresses: number;

  nextFreeAddress: number | null;
  error?: string;
}

export function allocateVlsm(
  block: Ipv4Network,
  requirements: VlsmRequirement[],
): VlsmResult {
  const blockNetwork = networkAddress(block.address, block.prefix);
  const blockEnd = broadcastAddress(block.address, block.prefix);
  const blockSize = totalAddresses(block.prefix);

  if (requirements.length === 0) {
    return {
      ok: true,
      allocations: [],
      unallocated: [],
      remainingAddresses: blockSize,
      nextFreeAddress: blockNetwork,
    };
  }

  const invalid = requirements.find(
    (r) => !Number.isInteger(r.hosts) || r.hosts < 1,
  );
  if (invalid) {
    return {
      ok: false,
      allocations: [],
      unallocated: requirements,
      remainingAddresses: blockSize,
      nextFreeAddress: blockNetwork,
      error: `“${invalid.label}” precisa de pelo menos 1 host.`,
    };
  }

  const ordered = [...requirements].sort(
    (a, b) => b.hosts - a.hosts || a.label.localeCompare(b.label, "pt-BR"),
  );

  const allocations: VlsmAllocation[] = [];
  const unallocated: VlsmRequirement[] = [];
  let cursor = blockNetwork;

  for (const requirement of ordered) {
    const prefixResult = prefixForHosts(requirement.hosts);
    if (!prefixResult.ok) {
      unallocated.push(requirement);
      continue;
    }
    const prefix = prefixResult.value;
    const size = totalAddresses(prefix);

    const aligned = (Math.ceil(cursor / size) * size) >>> 0;

    if (aligned + size - 1 > blockEnd) {
      unallocated.push(requirement);
      continue;
    }

    allocations.push({
      requirement,
      network: aligned,
      prefix,
      mask: maskFromPrefix(prefix),
      broadcast: broadcastAddress(aligned, prefix),
      firstHost: firstUsableHost(aligned, prefix),
      lastHost: lastUsableHost(aligned, prefix),
      usable: usableHosts(prefix),
      waste: usableHosts(prefix) - requirement.hosts,
    });

    cursor = (aligned + size) >>> 0;
  }

  const used = allocations.reduce(
    (sum, a) => sum + totalAddresses(a.prefix),
    0,
  );

  return {
    ok: unallocated.length === 0,
    allocations,
    unallocated,
    remainingAddresses: blockSize - used,
    nextFreeAddress: cursor > blockEnd ? null : cursor,
    error:
      unallocated.length > 0
        ? `O bloco ${formatIpv4(blockNetwork)}/${block.prefix} não comporta ${unallocated
            .map((r) => r.label)
            .join(", ")}.`
        : undefined,
  };
}

export interface ManualSubnet {
  id: string;
  label: string;
  requiredHosts: number;
  network: number;
  prefix: PrefixLength;
}

export type VlsmIssueKind =
  | "fora-do-bloco"
  | "sobreposicao"
  | "endereco-nao-e-de-rede"
  | "hosts-insuficientes";

export interface VlsmIssue {
  kind: VlsmIssueKind;
  subnetId: string;
  otherSubnetId?: string;
  message: string;
}

export function validateManualAllocation(
  block: Ipv4Network,
  subnets: ManualSubnet[],
): VlsmIssue[] {
  const issues: VlsmIssue[] = [];
  const blockStart = networkAddress(block.address, block.prefix);
  const blockEnd = broadcastAddress(block.address, block.prefix);

  for (const subnet of subnets) {
    const start = subnet.network >>> 0;
    const end = broadcastAddress(start, subnet.prefix);

    if (networkAddress(start, subnet.prefix) !== start) {
      issues.push({
        kind: "endereco-nao-e-de-rede",
        subnetId: subnet.id,
        message: `${formatIpv4(start)}/${subnet.prefix} não é um endereço de rede — o endereço de rede desse bloco é ${formatIpv4(
          networkAddress(start, subnet.prefix),
        )}.`,
      });
    }

    if (start < blockStart || end > blockEnd) {
      issues.push({
        kind: "fora-do-bloco",
        subnetId: subnet.id,
        message: `${subnet.label} sai do bloco ${formatIpv4(blockStart)}/${block.prefix}.`,
      });
    }

    if (usableHosts(subnet.prefix) < subnet.requiredHosts) {
      issues.push({
        kind: "hosts-insuficientes",
        subnetId: subnet.id,
        message: `${subnet.label} precisa de ${subnet.requiredHosts} hosts, mas /${subnet.prefix} oferece ${usableHosts(
          subnet.prefix,
        )}.`,
      });
    }
  }

  for (let i = 0; i < subnets.length; i += 1) {
    for (let j = i + 1; j < subnets.length; j += 1) {
      const a = subnets[i];
      const b = subnets[j];
      const aStart = a.network >>> 0;
      const aEnd = broadcastAddress(aStart, a.prefix);
      const bStart = b.network >>> 0;
      const bEnd = broadcastAddress(bStart, b.prefix);
      if (aStart <= bEnd && bStart <= aEnd) {
        issues.push({
          kind: "sobreposicao",
          subnetId: a.id,
          otherSubnetId: b.id,
          message: `${a.label} e ${b.label} se sobrepõem.`,
        });
      }
    }
  }

  return issues;
}

export interface VlsmStep {
  index: number;

  allocation: VlsmAllocation | null;

  allocated: VlsmAllocation[];

  remainingAddresses: number;

  nextFreeAddress: number | null;
  title: string;
  narrative: string;
}

export function vlsmSteps(
  block: Ipv4Network,
  requirements: VlsmRequirement[],
): { steps: VlsmStep[]; result: VlsmResult } {
  const result = allocateVlsm(block, requirements);
  const blockNetwork = networkAddress(block.address, block.prefix);
  const blockSize = totalAddresses(block.prefix);

  const steps: VlsmStep[] = [
    {
      index: 0,
      allocation: null,
      allocated: [],
      remainingAddresses: blockSize,
      nextFreeAddress: blockNetwork,
      title: `Bloco íntegro — ${formatIpv4(blockNetwork)}/${block.prefix}`,
      narrative: `${blockSize.toLocaleString("pt-BR")} endereços contíguos, nenhum atribuído. As demandas foram ordenadas da maior para a menor antes de qualquer corte.`,
    },
  ];

  let usados = 0;
  result.allocations.forEach((alocacao, i) => {
    const tamanho = totalAddresses(alocacao.prefix);
    usados += tamanho;
    const fim = (alocacao.network + tamanho) >>> 0;

    steps.push({
      index: i + 1,
      allocation: alocacao,
      allocated: result.allocations.slice(0, i + 1),
      remainingAddresses: blockSize - usados,
      nextFreeAddress: fim,
      title: `${alocacao.requirement.label} — /${alocacao.prefix}`,
      narrative: `${alocacao.requirement.hosts} host${alocacao.requirement.hosts === 1 ? "" : "s"} ${alocacao.requirement.hosts === 1 ? "pedido" : "pedidos"} exige${alocacao.requirement.hosts === 1 ? "" : "m"} um /${alocacao.prefix}, que são ${tamanho.toLocaleString("pt-BR")} endereços e ${alocacao.usable.toLocaleString("pt-BR")} utilizáveis. O corte começa em ${formatIpv4(alocacao.network)}, que é múltiplo de ${tamanho.toLocaleString("pt-BR")}${alocacao.waste > 0 ? `. Sobram ${alocacao.waste.toLocaleString("pt-BR")} endereços utilizáveis sem uso dentro desta sub-rede` : ". Não há folga dentro desta sub-rede"}.`,
    });
  });

  return { steps, result };
}
