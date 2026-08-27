"use client";

import { useMemo, useState } from "react";
import { useParamState } from "@/lib/hooks/use-param-state";
import { Binary, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  parseCidr,
  toBinary,
  totalAddresses,
  usableHosts,
  wildcardFromPrefix,
} from "@/lib/net/ipv4";
import { cn } from "@/lib/utils";

const EXEMPLOS = ["192.168.10.77/26", "10.0.0.1/8", "172.16.5.130/20", "203.0.113.5/30"];

function Row({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rail py-2.5 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right">
        <span
          className={cn(
            "font-mono text-sm",
            emphasis ? "font-semibold text-copper" : "text-foreground",
          )}
        >
          {value}
        </span>
        {hint && (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
    </div>
  );
}

function BinaryRuler({ address, prefix }: { address: number; prefix: number }) {
  const bits = toBinary(address).replace(/\./g, "");
  const octets = [0, 1, 2, 3];

  return (
    <div
      className="scroll-x"
      tabIndex={0}
      role="region"
      aria-label={`Representação binária de ${formatIpv4(address)} com máscara /${prefix}`}
    >
      <div className="min-w-max font-mono text-xs">
        <div className="flex gap-2">
          {octets.map((octet) => (
            <span key={octet} className="flex">
              {bits
                .slice(octet * 8, octet * 8 + 8)
                .split("")
                .map((bit, i) => {
                  const position = octet * 8 + i;
                  const isNetwork = position < prefix;
                  return (
                    <span
                      key={i}
                      className={cn(
                        "flex w-[1.1rem] justify-center border-y py-1 first:rounded-l-sm last:rounded-r-sm",
                        isNetwork
                          ? "border-copper/50 bg-copper-soft text-copper"
                          : "border-fiber/50 bg-fiber-soft text-fiber",
                        position === prefix - 1 && "border-r-2 border-r-copper",
                      )}
                    >
                      {bit}
                    </span>
                  );
                })}
            </span>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-xs bg-copper" />
            <span className="text-muted-foreground">
              {prefix} bits de rede
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-xs bg-fiber" />
            <span className="text-muted-foreground">
              {32 - prefix} bits de host
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}

export function SubnetCalculator() {
  const [raw, setRaw] = useParamState("cidr", "192.168.10.77/26");
  const [showBinary, setShowBinary] = useState(true);

  const parsed = useMemo(() => parseCidr(raw), [raw]);

  const result = useMemo(() => {
    if (!parsed.ok) return null;
    const { address, prefix } = parsed.value;
    const network = networkAddress(address, prefix);
    return {
      address,
      prefix,
      network,
      mask: maskFromPrefix(prefix),
      wildcard: wildcardFromPrefix(prefix),
      broadcast: broadcastAddress(address, prefix),
      first: firstUsableHost(address, prefix),
      last: lastUsableHost(address, prefix),
      usable: usableHosts(prefix),
      total: totalAddresses(prefix),
      scope: classifyAddress(network),
      legacy: legacyClass(network),
      hasEdges: hasNetworkAndBroadcast(prefix),
    };
  }, [parsed]);

  const errorId = "subnet-erro";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="panel p-4">
          <Label htmlFor="cidr" className="text-sm font-medium">
            Endereço com prefixo
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Aceita <span className="font-mono">192.168.10.77/26</span> ou{" "}
            <span className="font-mono">192.168.10.77 255.255.255.192</span>.
          </p>
          <Input
            id="cidr"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            className="mt-3 font-mono"
            spellCheck={false}
            autoComplete="off"
            inputMode="text"
            aria-invalid={!parsed.ok}
            aria-describedby={!parsed.ok ? errorId : undefined}
          />
          {!parsed.ok && (
            <p
              id={errorId}
              role="alert"
              className="mt-2 text-sm text-fault"
            >
              {parsed.error}
            </p>
          )}

          <div className="mt-4">
            <p className="silkscreen mb-2">Exemplos</p>
            <div className="flex flex-wrap gap-2">
              {EXEMPLOS.map((exemplo) => (
                <Button
                  key={exemplo}
                  size="sm"
                  variant="outline"
                  className="hit-44 h-7 font-mono text-xs"
                  onClick={() => setRaw(exemplo)}
                >
                  {exemplo}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="panel p-4">
            <p className="silkscreen mb-2">Classificação</p>
            <p className="text-sm">
              <span className="font-mono">{formatIpv4(result.network)}</span> é
              um endereço{" "}
              <span className="font-semibold text-copper">
                {result.scope.scope}
              </span>{" "}
              <span className="text-muted-foreground">
                ({result.scope.reference})
              </span>
              .
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              No endereçamento por classes seria classe{" "}
              <span className="font-mono">{result.legacy.name}</span> —{" "}
              {result.legacy.note}.{" "}
              {result.legacy.defaultPrefix !== null &&
                result.legacy.defaultPrefix !== result.prefix && (
                  <>
                    A classe sugeriria /{result.legacy.defaultPrefix}, mas o
                    prefixo informado é /{result.prefix}: é exatamente isso que
                    o CIDR permite.
                  </>
                )}
            </p>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-4">
        <div
          className="panel p-4"
          aria-live="polite"
          role="region"
          aria-label="Resultado do cálculo"
        >
          <div className="mb-1 flex items-center gap-2">
            <Calculator className="size-4 text-copper" aria-hidden />
            <h2 className="text-sm font-semibold">Resultado</h2>
          </div>

          {!result ? (
            <p className="py-6 text-sm text-muted-foreground">
              Corrija o endereço acima para ver o cálculo. Nada é exibido com
              base em entrada inválida.
            </p>
          ) : (
            <div className="mt-3">
              <Row
                label="Endereço de rede"
                value={`${formatIpv4(result.network)}/${result.prefix}`}
                emphasis
              />
              <Row label="Máscara" value={formatIpv4(result.mask)} />
              <Row
                label="Máscara curinga"
                value={formatIpv4(result.wildcard)}
                hint="complemento da máscara, usado em ACL"
              />
              <Row
                label="Endereço de broadcast"
                value={
                  result.hasEdges ? formatIpv4(result.broadcast) : "não se aplica"
                }
                hint={
                  result.hasEdges
                    ? undefined
                    : `/${result.prefix} não reserva endereço de broadcast`
                }
              />
              <Row label="Primeiro host" value={formatIpv4(result.first)} />
              <Row label="Último host" value={formatIpv4(result.last)} />
              <Row
                label="Hosts utilizáveis"
                value={result.usable.toLocaleString("pt-BR")}
                hint={
                  result.hasEdges
                    ? `2^${32 - result.prefix} − 2`
                    : result.prefix === 31
                      ? "os dois endereços são utilizáveis (RFC 3021)"
                      : "endereço único de host"
                }
                emphasis
              />
              <Row
                label="Total de endereços"
                value={result.total.toLocaleString("pt-BR")}
                hint={`2^${32 - result.prefix}`}
              />
            </div>
          )}
        </div>

        {result && (
          <div className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Binary className="size-4 text-fiber" aria-hidden />
                <h2 className="text-sm font-semibold">Modo binário</h2>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="hit-44 h-7 text-xs"
                aria-expanded={showBinary}
                onClick={() => setShowBinary((v) => !v)}
              >
                {showBinary ? "Ocultar" : "Mostrar"}
              </Button>
            </div>

            {showBinary && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="silkscreen mb-1.5">
                    Endereço {formatIpv4(result.address)}
                  </p>
                  <BinaryRuler address={result.address} prefix={result.prefix} />
                </div>
                <div>
                  <p className="silkscreen mb-1.5">
                    Máscara {formatIpv4(result.mask)}
                  </p>
                  <p className="scroll-x font-mono text-xs text-muted-foreground">
                    <span className="min-w-max">{toBinary(result.mask)}</span>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  A máscara corta o endereço depois do bit {result.prefix}. Tudo
                  à esquerda identifica a rede e é igual para todos os hosts
                  dela; tudo à direita identifica o host dentro da rede.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
