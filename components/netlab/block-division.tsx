import { formatIpv4, totalAddresses, type PrefixLength } from "@/lib/net/ipv4";
import { cn } from "@/lib/utils";

const CORES = ["bg-vlan-10", "bg-vlan-20", "bg-vlan-30", "bg-vlan-40"] as const;
const HACHURAS = ["hatch-0", "hatch-1", "hatch-2", "hatch-3"] as const;

export interface BlockSegment {
  id: string;
  label: string;
  network: number;
  prefix: PrefixLength;

  requestedHosts?: number;
}

export function segmentStyle(index: number) {
  return {
    cor: CORES[index % CORES.length]!,
    hachura: HACHURAS[Math.floor(index / CORES.length) % HACHURAS.length]!,
  };
}

export function BlockDivision({
  segments,
  blockSize,
  remaining,
  nextFree,
  caption = "Divisão do bloco",
  className,
}: {
  segments: BlockSegment[];

  blockSize: number;
  remaining: number;
  nextFree?: number | null;
  caption?: string;
  className?: string;
}) {
  const descricao = segments
    .map(
      (s) =>
        `${s.label}: ${formatIpv4(s.network)}/${s.prefix}, ${totalAddresses(s.prefix).toLocaleString("pt-BR")} endereços`,
    )
    .join("; ");

  return (
    <div className={className}>
      <p className="silkscreen mb-2">{caption}</p>

      <div
        role="img"
        aria-label={`${caption}. ${descricao}. ${remaining.toLocaleString("pt-BR")} endereços livres.`}
        className="flex h-7 w-full overflow-hidden rounded-sm border border-rail"
      >
        {segments.map((s, i) => {
          const { cor, hachura } = segmentStyle(i);
          return (
            <span
              key={s.id}
              className={cn("min-w-0 border-r border-rail last:border-r-0", cor, hachura)}
              style={{ width: `${(totalAddresses(s.prefix) / blockSize) * 100}%` }}
            />
          );
        })}
        {remaining > 0 && (
          <span
            className="min-w-0 bg-panel-sunken"
            style={{ width: `${(remaining / blockSize) * 100}%` }}
          />
        )}
      </div>

      <ul className="mt-3 grid gap-x-5 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {segments.map((s, i) => {
          const { cor, hachura } = segmentStyle(i);
          const total = totalAddresses(s.prefix);
          return (
            <li key={s.id} className="flex items-baseline gap-2 text-xs">
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 size-3 shrink-0 rounded-xs border border-rail",
                  cor,
                  hachura,
                )}
              />
              <span className="min-w-0">
                <span className="font-medium">{s.label}</span>{" "}
                <span className="font-mono text-muted-foreground">
                  {formatIpv4(s.network)}/{s.prefix}
                </span>
                <span className="block text-muted-foreground">
                  {s.requestedHosts !== undefined
                    ? `${s.requestedHosts} de ${total - 2} hosts utilizáveis`
                    : `${total.toLocaleString("pt-BR")} endereços`}
                </span>
              </span>
            </li>
          );
        })}
        {remaining > 0 && (
          <li className="flex items-baseline gap-2 text-xs">
            <span
              aria-hidden
              className="mt-0.5 size-3 shrink-0 rounded-xs border border-rail bg-panel-sunken"
            />
            <span className="min-w-0">
              <span className="font-medium">Livre</span>
              <span className="block text-muted-foreground">
                {remaining.toLocaleString("pt-BR")} endereços
                {nextFree != null && (
                  <>
                    , a partir de{" "}
                    <span className="font-mono">{formatIpv4(nextFree)}</span>
                  </>
                )}
              </span>
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
