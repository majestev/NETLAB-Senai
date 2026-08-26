"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lock, LockOpen, ShieldAlert, Signal, Wifi } from "lucide-react";
import {
  CHANNELS_24,
  CHANNEL_WIDTH_MHZ,
  NON_OVERLAPPING_24,
  SECURITY_PROFILES,
  buildAssociation,
  channelOverlap,
  channelSpan,
  securityProfile,
  signalQuality,
  type WirelessPhase,
  type WirelessSecurity,
} from "@/lib/net/wireless";
import { useMotionOk } from "./motion/use-motion-ok";
import {
  SimulationControls,
  type Velocidade,
} from "./journey/simulation-controls";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PASSO_MS = 1500;

const FASE_ROTULO: Record<WirelessPhase, string> = {
  desconectado: "Desconectado",
  descoberta: "Descoberta",
  autenticacao: "Autenticação",
  associacao: "Associação",
  cifragem: "Troca de chaves",
  conectado: "Conectado",
  recusado: "Recusado",
};

const FASES_ORDEM: WirelessPhase[] = [
  "descoberta",
  "autenticacao",
  "associacao",
  "cifragem",
  "conectado",
];

const LARGURA = 560;
const ALTURA = 190;
const CLIENTE = { x: 16, y: 62, w: 118, h: 62 };
const AP = { x: LARGURA - 134, y: 62, w: 118, h: 62 };
const TRILHA = { de: CLIENTE.x + CLIENTE.w + 10, ate: AP.x - 10, y: 93 };

export function WirelessAssociation({ className }: { className?: string }) {
  const animar = useMotionOk();

  const [security, setSecurity] = useState<WirelessSecurity>("wpa2");
  const [senhaOk, setSenhaOk] = useState(true);
  const [ssidVisivel, setSsidVisivel] = useState(true);
  const [i, setI] = useState(0);
  const [tocarPedido, setTocarPedido] = useState<boolean | null>(null);
  const [velocidade, setVelocidade] = useState<Velocidade>(1);

  const passos = buildAssociation({
    security,
    correctPassword: senhaOk,
    broadcastSsid: ssidVisivel,
    ssid: "NETLAB-LAB",
  });

  const indice = Math.min(i, passos.length - 1);
  const atual = passos[indice]!;
  const ultimo = indice >= passos.length - 1;
  const tocando = (tocarPedido ?? false) && !ultimo;
  const perfil = securityProfile(security);

  useEffect(() => {
    if (!tocando) return;
    const t = window.setTimeout(
      () => setI((v) => Math.min(passos.length - 1, v + 1)),
      PASSO_MS / velocidade,
    );
    return () => window.clearTimeout(t);
  }, [tocando, indice, velocidade, passos.length]);

  function ir(n: number) {
    setTocarPedido(false);
    setI(Math.max(0, Math.min(passos.length - 1, n)));
  }

  function reconfigurar(fn: () => void) {
    fn();
    setTocarPedido(false);
    setI(0);
  }

  const faseAtual = atual.phase;
  const falhou = faseAtual === "recusado";
  const conectado = faseAtual === "conectado";

  return (
    <div className={cn("space-y-3", className)}>

      <div className="panel space-y-3 p-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="silkscreen">Segurança</span>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Mecanismo de segurança">
            {SECURITY_PROFILES.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={p.id === security ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                aria-pressed={p.id === security}
                onClick={() => reconfigurar(() => setSecurity(p.id))}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <input
              id="senha-ok"
              type="checkbox"
              checked={senhaOk}
              disabled={perfil.handshake === null}
              onChange={(e) => reconfigurar(() => setSenhaOk(e.target.checked))}
              className="size-4 accent-copper"
            />
            <Label htmlFor="senha-ok" className="text-sm">
              A senha do cliente confere
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="ssid-visivel"
              type="checkbox"
              checked={ssidVisivel}
              onChange={(e) => reconfigurar(() => setSsidVisivel(e.target.checked))}
              className="size-4 accent-copper"
            />
            <Label htmlFor="ssid-visivel" className="text-sm">
              O SSID é anunciado no beacon
            </Label>
          </div>
        </div>
      </div>

      <ol className="flex gap-px overflow-hidden rounded-md border border-rail bg-rail">
        {FASES_ORDEM.map((fase) => {
          const alcancada = passos
            .slice(0, indice + 1)
            .some((p) => p.phase === fase);
          const ativa = fase === faseAtual;
          const interrompida = falhou && fase === "cifragem";
          return (
            <li
              key={fase}
              aria-current={ativa ? "step" : undefined}
              className={cn(
                "min-w-0 flex-1 bg-panel px-2 py-2 text-center transition-colors",
                ativa && !falhou && "bg-copper-soft",
                interrompida && "bg-fault-soft",
                !ativa && alcancada && "bg-panel-raised",
              )}
            >
              <span
                className={cn(
                  "block truncate text-[0.625rem] font-medium sm:text-xs",
                  ativa && !falhou && "text-copper",
                  interrompida && "text-fault",
                  !ativa && !alcancada && "text-muted-foreground",
                )}
              >
                {FASE_ROTULO[fase]}
              </span>
              <span
                aria-hidden
                className={cn(
                  "mx-auto mt-1 block h-0.5 w-6 rounded-full transition-colors",
                  interrompida
                    ? "bg-fault"
                    : alcancada
                      ? "bg-copper"
                      : "bg-rail-strong",
                )}
              />
            </li>
          );
        })}
      </ol>

      <figure className="panel overflow-hidden bg-panel-sunken">
        <svg
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Cliente sem fio e ponto de acesso. ${atual.title}: ${atual.narrative}`}
        >

          <line
            x1={TRILHA.de}
            y1={TRILHA.y}
            x2={TRILHA.ate}
            y2={TRILHA.y}
            className={cn(
              conectado ? "stroke-signal" : falhou ? "stroke-fault" : "stroke-rail-strong",
            )}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />

          <rect
            x={CLIENTE.x}
            y={CLIENTE.y}
            width={CLIENTE.w}
            height={CLIENTE.h}
            rx={4}
            className="fill-panel stroke-rail-strong"
            strokeWidth={1.5}
          />
          <text x={CLIENTE.x + CLIENTE.w / 2} y={CLIENTE.y + 24} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
            Cliente
          </text>
          <text x={CLIENTE.x + CLIENTE.w / 2} y={CLIENTE.y + 42} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">
            {conectado ? "associado" : falhou ? "desassociado" : "procurando"}
          </text>

          <rect
            x={AP.x}
            y={AP.y}
            width={AP.w}
            height={AP.h}
            rx={4}
            className="fill-panel stroke-rail-strong"
            strokeWidth={1.5}
          />
          <text x={AP.x + AP.w / 2} y={AP.y + 24} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
            AP
          </text>
          <text x={AP.x + AP.w / 2} y={AP.y + 42} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">
            {ssidVisivel ? "NETLAB-LAB" : "SSID oculto"}
          </text>

          {atual.direction === "ap-difusao" &&
            [0, 1, 2].map((n) => (
              <motion.circle
                key={n}
                cx={AP.x}
                cy={TRILHA.y}
                r={12 + n * 13}
                className="fill-none stroke-fiber"
                strokeWidth={1.25}
                initial={animar ? { opacity: 0.75, scale: 0.6 } : false}
                animate={{ opacity: 0, scale: 1.35 }}
                transition={{
                  duration: animar ? 1.2 : 0,
                  delay: animar ? n * 0.2 : 0,
                  repeat: animar ? Infinity : 0,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: `${AP.x}px ${TRILHA.y}px` }}
              />
            ))}

          {atual.direction !== "nenhuma" && atual.direction !== "ap-difusao" && (
            <motion.g
              key={atual.id}
              initial={
                animar
                  ? { x: atual.direction === "cliente-ap" ? TRILHA.de : TRILHA.ate }
                  : false
              }
              animate={{
                x: atual.direction === "cliente-ap" ? TRILHA.ate - 96 : TRILHA.de,
              }}
              transition={{ duration: animar ? 0.9 : 0, ease: [0.16, 1, 0.3, 1] }}
            >
              <rect
                y={TRILHA.y - 11}
                width={96}
                height={22}
                rx={3}
                className={cn(
                  "stroke-background",
                  atual.failed ? "fill-fault" : "fill-copper",
                )}
                strokeWidth={1}
              />
              <text
                x={48}
                y={TRILHA.y + 4}
                textAnchor="middle"
                className="fill-background font-mono text-[8.5px]"
              >
                {atual.frame}
              </text>
            </motion.g>
          )}

          <g transform={`translate(${LARGURA / 2 - 9}, ${ALTURA - 42})`}>
            {atual.encrypted ? (
              <>
                <rect width={18} height={18} rx={3} className="fill-signal-soft stroke-signal" strokeWidth={1.25} />
                <path d="M6 8 v-2 a3 3 0 0 1 6 0 v2 M5 8 h8 v6 h-8 z" className="fill-none stroke-signal" strokeWidth={1.25} />
              </>
            ) : (
              <text x={9} y={13} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">
                {conectado || falhou ? "sem cifra" : ""}
              </text>
            )}
          </g>
        </svg>

        <figcaption className="border-t border-rail bg-panel px-3 py-2.5">
          <SimulationControls
            tocando={tocando}
            onTocar={(t) => setTocarPedido(t)}
            onPassoAtras={() => ir(indice - 1)}
            onPassoFrente={() => ir(indice + 1)}
            onReiniciar={() => ir(0)}
            podeVoltar={indice > 0}
            podeAvancar={!ultimo}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
        </figcaption>
      </figure>

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "panel p-3.5",
          falhou && "border-fault/40 bg-fault-soft",
          conectado && atual.encrypted && "border-signal/40 bg-signal-soft",
        )}
      >
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-mono text-2xs tabular-nums text-muted-foreground">
            {indice + 1}/{passos.length}
          </span>
          <span className="text-sm font-semibold">{atual.title}</span>
          <span className="rounded-sm border border-rail px-1.5 py-0.5 font-mono text-2xs text-muted-foreground">
            {atual.frame}
          </span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{atual.narrative}</p>

        {ultimo && (
          <p className="mt-2.5 flex items-start gap-2 border-t border-rail pt-2.5 text-sm">
            {falhou ? (
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-fault" aria-hidden />
            ) : atual.encrypted ? (
              <Lock className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
            ) : (
              <LockOpen className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden />
            )}
            <span>
              {falhou
                ? "A senha errada não impediu autenticar nem associar. Ela só apareceu na troca de chaves, que é onde a senha é de fato verificada."
                : atual.encrypted
                  ? `${perfil.name}: ${perfil.note}`
                  : "Rede sem cifragem no enlace: qualquer receptor dentro do alcance lê o conteúdo dos quadros, sem precisar de senha nenhuma."}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export function SignalMeter({ className }: { className?: string }) {
  const [rssi, setRssi] = useState(-58);
  const q = signalQuality(rssi);

  return (
    <div className={cn("panel p-4", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className="flex items-end gap-0.5"
          aria-hidden
        >
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={cn(
                "w-1.5 rounded-[1px] transition-colors",
                n <= q.bars ? "bg-signal" : "bg-rail-strong",
              )}
              style={{ height: `${6 + n * 4}px` }}
            />
          ))}
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums">
          {rssi} dBm
        </span>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 text-xs font-medium",
            q.bars >= 3
              ? "border-signal/50 bg-signal-soft text-signal"
              : q.bars === 2
                ? "border-caution/50 bg-caution-soft text-caution"
                : "border-fault/50 bg-fault-soft text-fault",
          )}
        >
          {q.label}
        </span>
        <Signal className="ml-auto size-4 text-muted-foreground" aria-hidden />
      </div>

      <div className="mt-3">
        <Label htmlFor="rssi" className="text-sm">
          Intensidade recebida
        </Label>
        <input
          id="rssi"
          type="range"
          min={-95}
          max={-40}
          step={1}
          value={rssi}
          onChange={(e) => setRssi(Number(e.target.value))}
          className="mt-2 w-full accent-copper"
          aria-describedby="rssi-conselho"
        />
        <div className="mt-1 flex justify-between font-mono text-2xs text-muted-foreground" aria-hidden>
          <span>−95 (longe)</span>
          <span>−40 (perto)</span>
        </div>
      </div>

      <p id="rssi-conselho" role="status" aria-live="polite" className="mt-2 text-sm text-muted-foreground">
        {q.advice}
      </p>
    </div>
  );
}

const EIXO = { min: 2398, max: 2476 };

export function WirelessSpectrum({ className }: { className?: string }) {
  const [a, setA] = useState(1);
  const [b, setB] = useState(6);

  const sobreposicao = channelOverlap(a, b);
  const spanA = channelSpan(a);
  const spanB = channelSpan(b);

  const pos = (mhz: number) =>
    ((mhz - EIXO.min) / (EIXO.max - EIXO.min)) * 100;

  return (
    <div className={cn("panel overflow-hidden", className)}>
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-rail bg-panel-sunken px-3 py-2">
        <Wifi className="size-3.5 shrink-0 text-fiber" aria-hidden />
        <span className="silkscreen">Espectro de 2,4 GHz</span>
        <span className="ml-auto font-mono text-2xs text-muted-foreground">
          canal = {CHANNEL_WIDTH_MHZ} MHz
        </span>
      </p>

      <div className="p-3">
        <div
          className="relative h-24"
          role="img"
          aria-label={`Canais ${a} e ${b} no espectro de 2,4 GHz. ${
            sobreposicao === 0
              ? "Não há sobreposição entre eles."
              : `Compartilham ${sobreposicao} megahertz.`
          }`}
        >

          {CHANNELS_24.map((c) => {
            const s = channelSpan(c);
            const escolhido = c === a || c === b;
            const trio = (NON_OVERLAPPING_24 as readonly number[]).includes(c);
            return (
              <span
                key={c}
                className={cn(
                  "absolute top-2 h-9 rounded-t-[3px] border-x border-t transition-colors",
                  escolhido
                    ? c === a
                      ? "z-10 border-copper bg-copper/25"
                      : "z-10 border-fiber bg-fiber/25"
                    : trio
                      ? "border-rail-strong bg-panel-sunken"
                      : "border-rail bg-transparent",
                )}
                style={{
                  left: `${pos(s.start)}%`,
                  width: `${pos(s.end) - pos(s.start)}%`,
                }}
              />
            );
          })}

          {sobreposicao > 0 && (
            <span
              className="absolute top-2 z-20 h-9 bg-fault/35"
              style={{
                left: `${pos(Math.max(spanA.start, spanB.start))}%`,
                width: `${pos(Math.min(spanA.end, spanB.end)) - pos(Math.max(spanA.start, spanB.start))}%`,
              }}
            />
          )}

          <span className="absolute top-11 h-px w-full bg-rail-strong" />
          {CHANNELS_24.map((c) => (
            <span
              key={`t-${c}`}
              className={cn(
                "absolute top-12 -translate-x-1/2 font-mono text-[0.5625rem]",
                c === a
                  ? "font-semibold text-copper"
                  : c === b
                    ? "font-semibold text-fiber"
                    : "text-muted-foreground",
              )}
              style={{ left: `${pos(channelSpan(c).center)}%` }}
            >
              {c}
            </span>
          ))}
          <span
            className="absolute top-[4.5rem] -translate-x-1/2 font-mono text-[0.5625rem] text-muted-foreground"
            style={{ left: `${pos(spanA.center)}%` }}
          >
            {spanA.center} MHz
          </span>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <SeletorCanal
            id="canal-a"
            rotulo="Primeiro canal"
            valor={a}
            onChange={setA}
            cor="copper"
          />
          <SeletorCanal
            id="canal-b"
            rotulo="Segundo canal"
            valor={b}
            onChange={setB}
            cor="fiber"
          />
        </div>

        <p
          role="status"
          aria-live="polite"
          className={cn(
            "mt-3 rounded-sm border p-2.5 text-sm",
            sobreposicao === 0
              ? "border-signal/40 bg-signal-soft"
              : "border-fault/40 bg-fault-soft",
          )}
        >
          {a === b ? (
            <>
              Mesmo canal: os dois pontos de acesso disputam integralmente os{" "}
              {CHANNEL_WIDTH_MHZ} MHz. É o pior caso, pior inclusive que
              sobreposição parcial, porque o meio passa a ser compartilhado por
              todos os clientes dos dois.
            </>
          ) : sobreposicao === 0 ? (
            <>
              Canais {a} e {b} não se sobrepõem: os centros estão a{" "}
              {Math.abs(spanA.center - spanB.center)} MHz e cada canal ocupa{" "}
              {CHANNEL_WIDTH_MHZ} MHz, então sobra folga entre eles. É por isso
              que o trio 1, 6 e 11 é o recomendado.
            </>
          ) : (
            <>
              Canais {a} e {b} compartilham {sobreposicao} MHz. Sobreposição
              parcial é o caso ruim: os rádios não conseguem coordenar o acesso
              ao meio entre si e passam a interferir como ruído.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function SeletorCanal({
  id,
  rotulo,
  valor,
  onChange,
  cor,
}: {
  id: string;
  rotulo: string;
  valor: number;
  onChange: (n: number) => void;
  cor: "copper" | "fiber";
}) {
  return (
    <div>
      <Label htmlFor={id} className="flex items-center gap-1.5 text-sm">
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            cor === "copper" ? "bg-copper" : "bg-fiber",
          )}
        />
        {rotulo}
      </Label>
      <input
        id={id}
        type="range"
        min={1}
        max={11}
        step={1}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "mt-1.5 w-full",
          cor === "copper" ? "accent-copper" : "accent-fiber",
        )}
      />
    </div>
  );
}
