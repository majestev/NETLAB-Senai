"use client";

import { motion } from "motion/react";
import {
  PACKET_FIELD_LABEL,
  PACKET_FIELD_LAYER,
  SEM_L2,
  type PacketField,
} from "@/lib/net/journey-events";
import type { PacketState } from "@/lib/net/journey";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useMotionOk } from "@/components/netlab/motion/use-motion-ok";
import { cn } from "@/lib/utils";

const ORDEM: PacketField[] = [
  "sourceMac",
  "destinationMac",
  "sourceIp",
  "destinationIp",
  "ttl",
  "nextHop",
  "outgoingInterface",
];

export function PacketFields({
  packet,
  changed,
  anterior,
  compact = false,
  className,
}: {
  packet: PacketState;
  changed: PacketField[];

  anterior?: PacketState;
  compact?: boolean;
  className?: string;
}) {
  const animar = useMotionOk();

  const hidratado = useHydrated();
  const mudou = new Set(changed);

  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-sm bg-rail", className)}>
      {ORDEM.map((campo) => {
        const alterado = mudou.has(campo);
        const valor = String(packet[campo]);
        const antes = anterior ? String(anterior[campo]) : undefined;
        const ausente = valor === SEM_L2;
        const camada = PACKET_FIELD_LAYER[campo];

        return (
          <motion.div
            key={campo}
            layout={animar ? "position" : false}
            className={cn(
              "flex flex-wrap items-baseline gap-x-3 gap-y-0.5 bg-panel px-3 transition-colors duration-300",
              compact ? "py-1.5" : "py-2",
              alterado && "bg-copper-soft",
            )}
          >
            <dt
              className={cn(
                "flex min-w-[9.5rem] items-center gap-1.5 text-xs",
                alterado ? "text-copper" : "text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-3 w-0.5 rounded-full transition-colors",
                  alterado
                    ? "bg-copper"
                    : camada === 2
                      ? "bg-layer2/40"
                      : "bg-layer3/40",
                )}
              />
              {PACKET_FIELD_LABEL[campo]}
            </dt>

            <dd className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
              {alterado && antes !== undefined && antes !== valor && !ausente && (
                <span className="font-mono text-xs text-muted-foreground line-through">
                  {antes}
                </span>
              )}
              <motion.span

                key={valor}

                data-valor-atual={campo}
                initial={animar && hidratado && alterado ? { opacity: 0, y: -4 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "font-mono text-sm",
                  ausente && "text-muted-foreground",
                  !ausente && alterado && "font-semibold text-copper",
                  !ausente && !alterado && "text-foreground",
                )}
              >
                {ausente ? "sem cabeçalho L2" : valor}
              </motion.span>
              {alterado && (
                <span className="text-2xs font-semibold uppercase tracking-wider text-copper">
                  alterado
                </span>
              )}
            </dd>
          </motion.div>
        );
      })}
    </dl>
  );
}
