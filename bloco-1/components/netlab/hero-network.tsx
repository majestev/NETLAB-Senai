"use client";

import { DEVICE_SYMBOL, DeviceSymbols } from "./device-symbols";
import { NetworkPulse, linePath } from "./motion/network-pulse";
import { useMotionOk } from "./motion/use-motion-ok";

interface NoHero {
  id: string;
  kind: keyof typeof DEVICE_SYMBOL;
  rotulo: string;

  papel: string;

  essencial: boolean;
}

const NOS: NoHero[] = [
  { id: "pc", kind: "host", rotulo: "PC", papel: "origem", essencial: true },
  { id: "sw", kind: "switch", rotulo: "SWITCH", papel: "MAC", essencial: false },
  { id: "r1", kind: "router", rotulo: "R1", papel: "TTL 63", essencial: true },
  { id: "r2", kind: "router", rotulo: "R2", papel: "TTL 62", essencial: false },
  { id: "srv", kind: "server", rotulo: "SERVER", papel: "destino", essencial: true },
];

const ALTURA = 132;
const Y = 52;
const CAIXA = 46;
const MARGEM = 62;
const PASSO = 232;

export function HeroNetwork() {
  return (
    <div aria-hidden className="pointer-events-none select-none">
      <DeviceSymbols />

      <div className="sm:hidden">
        <Faixa nos={NOS.filter((n) => n.essencial)} passo={142} margem={48} />
      </div>
      <div className="hidden sm:block">
        <Faixa nos={NOS} passo={PASSO} margem={MARGEM} />
      </div>
    </div>
  );
}

function Faixa({
  nos,
  passo,
  margem,
}: {
  nos: NoHero[];
  passo: number;
  margem: number;
}) {
  const animar = useMotionOk();
  const largura = margem * 2 + (nos.length - 1) * passo;
  const x = (i: number) => margem + i * passo;

  return (
    <svg
      viewBox={`0 0 ${largura} ${ALTURA}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full"
      role="presentation"
    >

      {nos.slice(0, -1).map((no, i) => {
        const d = linePath(x(i) + CAIXA / 2, Y, x(i + 1) - CAIXA / 2, Y);
        return (
          <g key={no.id} data-enlace={no.id}>
            <path d={d} stroke="var(--rail-strong)" strokeWidth="1.25" fill="none" />

            <NetworkPulse
              path={d}
              duration={1.5}
              delay={i * 1.5}
              color="var(--copper)"
              size={3.2}
            />
          </g>
        );
      })}

      {nos.map((no, i) => (
        <g key={no.id} data-no={no.id}>
          <rect
            x={x(i) - CAIXA / 2}
            y={Y - CAIXA / 2}
            width={CAIXA}
            height={CAIXA}
            rx="5"
            fill="var(--panel)"
            stroke="var(--rail-strong)"
            strokeWidth="1.25"
          />
          <use
            href={DEVICE_SYMBOL[no.kind]}
            x={x(i) - 13}
            y={Y - 13}
            width="26"
            height="26"
            stroke="var(--muted-foreground)"
            fill="none"
          />

          <circle
            cx={x(i) - CAIXA / 2 + 6}
            cy={Y - CAIXA / 2 + 6}
            r="1.7"
            fill="var(--signal)"
          >
            {animar && (
              <animate
                attributeName="opacity"
                values="0.35;1;0.35"
                dur="3.4s"
                begin={`${i * 0.6}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
          <text
            x={x(i)}
            y={Y + CAIXA / 2 + 18}
            textAnchor="middle"
            className="font-mono"
            fontSize="10"
            letterSpacing="0.16em"
            fill="var(--muted-foreground)"
          >
            {no.rotulo}
          </text>
          <text
            x={x(i)}
            y={Y + CAIXA / 2 + 32}
            textAnchor="middle"
            className="font-mono"
            fontSize="9"
            fill="var(--fiber)"
          >
            {no.papel}
          </text>
        </g>
      ))}
    </svg>
  );
}
