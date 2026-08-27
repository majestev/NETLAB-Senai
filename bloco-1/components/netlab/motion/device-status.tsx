"use client";

import { Activity, CircleAlert, Loader, Minus, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMotionOk } from "./use-motion-ok";

export type DeviceState =
  | "online"
  | "idle"
  | "processing"
  | "warning"
  | "offline";

const ESTADOS: Record<
  DeviceState,
  { label: string; ponto: string; texto: string; halo: boolean; icone: typeof Activity }
> = {
  online: { label: "Online", ponto: "bg-signal", texto: "text-signal", halo: true, icone: Activity },
  idle: { label: "Ocioso", ponto: "bg-muted-foreground", texto: "text-muted-foreground", halo: false, icone: Minus },
  processing: { label: "Processando", ponto: "bg-fiber", texto: "text-fiber", halo: true, icone: Loader },
  warning: { label: "Atenção", ponto: "bg-caution", texto: "text-caution", halo: false, icone: CircleAlert },
  offline: { label: "Offline", ponto: "bg-fault", texto: "text-fault", halo: false, icone: Power },
};

export function DeviceStatus({
  state,
  label,
  showIcon = false,
  className,
}: {
  state: DeviceState;

  label?: string;
  showIcon?: boolean;
  className?: string;
}) {
  const animar = useMotionOk();
  const cfg = ESTADOS[state];
  const Icone = cfg.icone;
  const texto = label ?? cfg.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.12em]",
        cfg.texto,
        className,
      )}
    >
      <span aria-hidden className="relative flex size-2 items-center justify-center">
        {cfg.halo && animar && (
          <span
            className={cn("absolute inline-flex size-2 rounded-full opacity-60", cfg.ponto)}
            style={{ animation: "netlab-halo 2.4s cubic-bezier(0.4,0,0.6,1) infinite" }}
          />
        )}
        <span className={cn("relative size-1.5 rounded-full", cfg.ponto)} />
      </span>
      {showIcon && (
        <Icone
          aria-hidden
          className={cn("size-3", state === "processing" && animar && "animate-spin")}
        />
      )}
      {texto}
    </span>
  );
}
