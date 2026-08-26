"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, MousePointerClick, Terminal } from "lucide-react";
import {
  CLI_MODES,
  TASK_COMPARISONS,
  cliModeAt,
  promptSymbol,
} from "@/lib/net/cli-modes";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useMotionOk } from "./motion/use-motion-ok";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CliModes({ className }: { className?: string }) {
  const animar = useMotionOk();

  const hidratado = useHydrated();
  const [nivel, setNivel] = useState(0);
  const modo = cliModeAt(nivel);
  const noTopo = nivel >= CLI_MODES.length - 1;
  const naBase = nivel === 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="panel overflow-hidden">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-rail bg-panel-sunken px-3 py-2">
          <Terminal className="size-3.5 shrink-0 text-copper" aria-hidden />
          <span className="silkscreen">Modo atual</span>
          <span className="ml-auto font-mono text-2xs text-muted-foreground">
            símbolo {promptSymbol(modo)}
          </span>
        </p>

        <div className="bg-panel-sunken px-3 py-4 font-mono text-sm">
          <motion.span
            key={modo.prompt}
            initial={animar && hidratado ? { opacity: 0, x: -6 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="font-semibold text-copper"
          >
            {modo.prompt}
          </motion.span>
          <span
            aria-hidden
            className={cn(
              "ml-1.5 inline-block h-4 w-2 translate-y-0.5 bg-copper",
              animar && "animate-pulse",
            )}
          />
        </div>

        <ol className="grid gap-px bg-rail">
          {CLI_MODES.map((m, i) => {
            const ativo = i === nivel;
            const alcancado = i <= nivel;
            return (
              <li
                key={m.id}
                aria-current={ativo ? "step" : undefined}
                className={cn(
                  "bg-panel px-3 py-2 transition-colors",
                  ativo && "bg-copper-soft",
                  !ativo && alcancado && "bg-panel-raised",
                )}
                style={{ paddingLeft: `${0.75 + i * 0.9}rem` }}
              >
                <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 self-center rounded-full",
                      alcancado ? "bg-copper" : "bg-rail-strong",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      ativo ? "font-semibold" : "text-muted-foreground",
                    )}
                  >
                    {m.name}
                  </span>
                  <span className="font-mono text-2xs text-muted-foreground">
                    {m.prompt}
                  </span>
                  {m.enter && (
                    <span className="ml-auto font-mono text-2xs text-copper">
                      {m.enter}
                    </span>
                  )}
                </p>
                {ativo && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.allows}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-2 border-t border-rail px-3 py-2.5">
          <Button
            size="sm"
            className="hit-44 gap-1.5"
            disabled={noTopo}
            onClick={() => setNivel((n) => Math.min(CLI_MODES.length - 1, n + 1))}
          >
            <ChevronUp className="size-4" aria-hidden />
            {noTopo ? "No modo mais específico" : cliModeAt(nivel + 1).enter}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="hit-44 gap-1.5"
            disabled={naBase}
            onClick={() => setNivel((n) => Math.max(0, n - 1))}
          >
            <ChevronDown className="size-4" aria-hidden />
            {naBase ? "Na base" : (modo.leave ?? "voltar")}
          </Button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="panel p-3.5 text-sm">
        <span className="font-medium">{modo.name}</span> — prompt{" "}
        <span className="font-mono">{modo.prompt}</span>. {modo.allows}
        {modo.denies && (
          <>
            {" "}
            <span className="text-muted-foreground">{modo.denies}</span>
          </>
        )}
      </p>
    </div>
  );
}

export function GuiVsCli({ className }: { className?: string }) {
  const comparacao = TASK_COMPARISONS[0]!;
  const [passo, setPasso] = useState(0);
  const total = Math.max(comparacao.gui.length, comparacao.cli.length);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="panel overflow-hidden">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rail bg-panel-sunken px-3 py-2">
          <span className="silkscreen">Mesma tarefa</span>
          <span className="text-sm font-medium">{comparacao.task}</span>
        </p>

        <div className="grid gap-px bg-rail sm:grid-cols-2">
          <Coluna
            icone={<MousePointerClick className="size-3.5" aria-hidden />}
            titulo="Interface gráfica"
            passos={comparacao.gui}
            ate={passo}
            tom="fiber"
          />
          <Coluna
            icone={<Terminal className="size-3.5" aria-hidden />}
            titulo="Linha de comando"
            passos={comparacao.cli}
            ate={passo}
            tom="copper"
            mono
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-rail px-3 py-2.5">
          <Button
            size="sm"
            variant="outline"
            className="hit-44"
            disabled={passo === 0}
            onClick={() => setPasso((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            className="hit-44"
            disabled={passo >= total}
            onClick={() => setPasso((p) => Math.min(total, p + 1))}
          >
            {passo === 0 ? "Começar" : "Próximo passo"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hit-44"
            disabled={passo === 0}
            onClick={() => setPasso(0)}
          >
            Reiniciar
          </Button>
          <span
            className="ml-auto font-mono text-2xs tabular-nums text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {Math.min(passo, comparacao.gui.length)} de {comparacao.gui.length} telas
            {" · "}
            {Math.min(passo, comparacao.cli.length)} de {comparacao.cli.length} comandos
          </span>
        </div>
      </div>

      {passo >= total && (
        <p className="panel border-copper/40 bg-copper-soft p-3.5 text-sm">
          {comparacao.lesson}
        </p>
      )}
    </div>
  );
}

function Coluna({
  icone,
  titulo,
  passos,
  ate,
  tom,
  mono = false,
}: {
  icone: React.ReactNode;
  titulo: string;
  passos: Array<{ action: string; detail: string }>;
  ate: number;
  tom: "fiber" | "copper";
  mono?: boolean;
}) {
  return (
    <div className="bg-panel">
      <p
        className={cn(
          "flex items-center gap-1.5 border-b border-rail px-3 py-2",
          tom === "fiber" ? "text-fiber" : "text-copper",
        )}
      >
        {icone}
        <span className="silkscreen">{titulo}</span>
        <span className="ml-auto font-mono text-2xs text-muted-foreground">
          {passos.length} passos
        </span>
      </p>
      <ol className="divide-y divide-rail">
        {passos.map((p, i) => {
          const feito = i < ate;
          const atual = i === ate - 1;
          return (
            <li
              key={p.action}
              aria-current={atual ? "step" : undefined}
              className={cn(
                "px-3 py-2 transition-opacity",
                feito ? "opacity-100" : "opacity-40",
                atual && (tom === "fiber" ? "bg-fiber-soft" : "bg-copper-soft"),
              )}
            >
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-2xs tabular-nums text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={cn("min-w-0 flex-1 text-sm", mono && "font-mono text-xs")}>
                  {p.action}
                </span>
              </p>
              {atual && (
                <p className="mt-0.5 pl-6 text-xs text-muted-foreground">{p.detail}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
