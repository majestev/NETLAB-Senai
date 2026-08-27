import { cn } from "@/lib/utils";

const L = 96;
const A = 48;

export function CardPreview({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const desenho = DESENHOS[href];
  if (!desenho) return null;

  return (
    <svg
      viewBox={`0 0 ${L} ${A}`}
      aria-hidden
      focusable="false"

      data-preview={href}
      className={cn("h-12 w-24 shrink-0 overflow-visible", className)}
    >
      {desenho}
    </svg>
  );
}

function Caixa({
  x,
  y,
  w,
  h,
  className,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  className?: string;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={2}
      className={cn("fill-panel-sunken stroke-rail-strong", className)}
      strokeWidth={1}
    />
  );
}

function Enlace({
  x1,
  y1,
  x2,
  y2,
  className,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className?: string;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className={cn("stroke-rail-strong", className)}
      strokeWidth={1.25}
    />
  );
}

function Linhas({
  destaque,
  cor = "fill-copper",
}: {
  destaque: number;
  cor?: string;
}) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={8}
          y={8 + i * 9}
          width={i === destaque ? 80 : 62 - i * 6}
          height={6}
          rx={1}
          className={cn(
            i === destaque
              ? cn(cor, "transition-[width] duration-300 group-hover:w-[84px]")
              : "fill-rail-strong",
          )}
        />
      ))}
    </>
  );
}

const DESENHOS: Record<string, React.ReactNode> = {
  "/simuladores/subnetting": (
    <>
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={6 + i * 5.5}
          y={14}
          width={4}
          height={20}
          rx={1}
          className={i < 12 ? "fill-fiber" : "fill-rail-strong"}
        />
      ))}
      <line
        x1={72}
        y1={9}
        x2={72}
        y2={39}
        className="stroke-copper transition-transform duration-300 group-hover:translate-x-[-11px]"
        strokeWidth={1.5}
      />
    </>
  ),

  "/simuladores/vlsm": (
    <>
      <rect x={6} y={16} width={42} height={16} rx={2} className="fill-vlan-10" />
      <rect x={49} y={16} width={21} height={16} rx={2} className="fill-vlan-20" />
      <rect x={71} y={16} width={11} height={16} rx={2} className="fill-vlan-30" />
      <rect
        x={83}
        y={16}
        width={7}
        height={16}
        rx={2}
        className="fill-panel-sunken stroke-rail-strong transition-opacity duration-300 group-hover:opacity-40"
        strokeWidth={1}
      />
    </>
  ),

  "/simuladores/roteamento": <Linhas destaque={1} />,

  "/simuladores/rip": (
    <>
      <Enlace x1={20} y1={24} x2={48} y2={24} />
      <Enlace x1={48} y1={24} x2={76} y2={24} />
      {[20, 48, 76].map((x) => (
        <circle
          key={x}
          cx={x}
          cy={24}
          r={7}
          className="fill-panel stroke-copper"
          strokeWidth={1.5}
        />
      ))}
      <circle
        cx={20}
        cy={24}
        r={3}
        className="fill-copper transition-transform duration-500 group-hover:translate-x-[56px]"
      />
    </>
  ),

  "/simuladores/switch": (
    <>
      <Caixa x={16} y={10} w={64} h={14} />
      {[26, 42, 58, 72].map((x, i) => (
        <g key={x}>
          <Enlace x1={x} y1={24} x2={x} y2={36} className={i === 2 ? "stroke-signal" : undefined} />
          <rect
            x={x - 5}
            y={36}
            width={10}
            height={7}
            rx={1}
            className={i === 2 ? "fill-signal" : "fill-rail-strong"}
          />
        </g>
      ))}
      <rect
        x={23}
        y={27}
        width={6}
        height={5}
        rx={1}
        className="fill-copper transition-transform duration-500 group-hover:translate-x-[32px]"
      />
    </>
  ),

  "/simuladores/vlan": (
    <>
      <Caixa x={10} y={20} w={76} h={10} />
      {[18, 32].map((x) => (
        <rect key={x} x={x} y={36} width={11} height={8} rx={1} className="fill-vlan-10" />
      ))}
      {[54, 68].map((x) => (
        <rect key={x} x={x} y={36} width={11} height={8} rx={1} className="fill-vlan-30" />
      ))}
      <rect
        x={44}
        y={4}
        width={8}
        height={12}
        rx={1}
        className="fill-copper transition-opacity duration-300 group-hover:opacity-60"
      />
      <Enlace x1={48} y1={16} x2={48} y2={20} className="stroke-copper" />
    </>
  ),

  "/simuladores/analisador": (
    <>
      {[
        { y: 6, c: "fill-layer7", w: 84 },
        { y: 17, c: "fill-layer4", w: 68 },
        { y: 28, c: "fill-layer3", w: 52 },
        { y: 39, c: "fill-layer2", w: 36 },
      ].map((b, i) => (
        <rect
          key={b.y}
          x={6}
          y={b.y}
          width={b.w}
          height={7}
          rx={1}
          className={cn(b.c, "transition-opacity duration-300")}
          style={{ opacity: 0.55 + i * 0.15 }}
        />
      ))}
    </>
  ),

  "/laboratorios/roteamento": (
    <>
      <Enlace x1={32} y1={24} x2={64} y2={24} className="stroke-copper" />
      {[32, 64].map((x) => (
        <circle key={x} cx={x} cy={24} r={7} className="fill-panel stroke-copper" strokeWidth={1.5} />
      ))}
      <Caixa x={4} y={17} w={16} h={14} />
      <Caixa x={76} y={17} w={16} h={14} />
      <Enlace x1={20} y1={24} x2={25} y2={24} />
      <Enlace x1={71} y1={24} x2={76} y2={24} />
    </>
  ),

  "/laboratorios/vlsm": (
    <>
      <rect x={6} y={18} width={84} height={14} rx={2} className="fill-panel-sunken stroke-rail-strong" strokeWidth={1} />
      {[48, 69, 79].map((x) => (
        <line key={x} x1={x} y1={14} x2={x} y2={36} className="stroke-copper" strokeWidth={1.25} />
      ))}
      <rect
        x={6}
        y={18}
        width={42}
        height={14}
        className="fill-copper/25 transition-[width] duration-300 group-hover:w-[63px]"
      />
    </>
  ),

  "/laboratorios/rip": (
    <>
      <Enlace x1={20} y1={36} x2={48} y2={12} />
      <Enlace x1={48} y1={12} x2={76} y2={36} />
      <Enlace x1={20} y1={36} x2={76} y2={36} className="stroke-fault transition-opacity duration-300 group-hover:opacity-30" />
      {[
        [20, 36],
        [48, 12],
        [76, 36],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={6.5} className="fill-panel stroke-copper" strokeWidth={1.5} />
      ))}
    </>
  ),

  "/laboratorios/dominios": (
    <>
      <circle cx={28} cy={24} r={11} className="fill-fault/20 stroke-fault" strokeWidth={1} strokeDasharray="3 2" />
      <circle cx={68} cy={24} r={11} className="fill-signal/20 stroke-signal" strokeWidth={1} strokeDasharray="3 2" />
      <Caixa x={22} y={19} w={12} h={10} />
      <Caixa x={62} y={19} w={12} h={10} />
      <Enlace x1={39} y1={24} x2={57} y2={24} className="stroke-copper" />
    </>
  ),

  "/laboratorios/switching": (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={8} y={10 + i * 11} width={46} height={7} rx={1} className="fill-rail-strong" />
          <rect
            x={58}
            y={10 + i * 11}
            width={30}
            height={7}
            rx={1}
            className={cn(i < 2 ? "fill-copper" : "fill-rail-strong")}
          />
        </g>
      ))}
    </>
  ),

  "/laboratorios/vlan": (
    <>
      <Caixa x={4} y={18} w={22} h={13} />
      <Caixa x={70} y={18} w={22} h={13} />
      <Enlace x1={26} y1={24} x2={70} y2={24} className="stroke-copper" />
      <rect
        x={42}
        y={19}
        width={12}
        height={11}
        rx={1.5}
        className="fill-copper transition-transform duration-300 group-hover:scale-110"
        style={{ transformOrigin: "48px 24px" }}
      />
      <rect x={10} y={36} width={10} height={7} rx={1} className="fill-vlan-10" />
      <rect x={76} y={36} width={10} height={7} rx={1} className="fill-vlan-10" />
    </>
  ),

  "/laboratorios/wireless": (
    <>
      <Caixa x={40} y={30} w={16} h={11} />
      {[9, 16, 23].map((r, i) => (
        <path
          key={r}
          d={`M ${48 - r} 30 A ${r} ${r} 0 0 1 ${48 + r} 30`}
          className={cn("fill-none stroke-fiber transition-opacity duration-300")}
          strokeWidth={1.25}
          style={{ opacity: 0.8 - i * 0.22 }}
        />
      ))}
      <rect x={8} y={33} width={11} height={8} rx={1} className="fill-rail-strong" />
      <rect x={77} y={33} width={11} height={8} rx={1} className="fill-rail-strong" />
    </>
  ),
};
