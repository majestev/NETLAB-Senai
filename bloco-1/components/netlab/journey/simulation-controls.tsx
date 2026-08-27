"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const VELOCIDADES = [0.5, 1, 2, 4] as const;
export type Velocidade = (typeof VELOCIDADES)[number];

export function SimulationControls({
  tocando,
  onTocar,
  onPassoAtras,
  onPassoFrente,
  onReiniciar,
  podeVoltar,
  podeAvancar,
  velocidade,
  onVelocidade,
  passoLabel = "Passo",
  className,
}: {
  tocando: boolean;
  onTocar: (tocar: boolean) => void;
  onPassoAtras: () => void;
  onPassoFrente: () => void;
  onReiniciar: () => void;
  podeVoltar: boolean;
  podeAvancar: boolean;
  velocidade: Velocidade;
  onVelocidade: (v: Velocidade) => void;

  passoLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="hit-44 size-9"
          onClick={onPassoAtras}
          disabled={!podeVoltar}
          aria-label="Evento anterior"
        >
          <SkipBack className="size-4" aria-hidden />
        </Button>

        <Button
          size="sm"
          className="hit-44 min-w-[6.5rem] gap-1.5"
          onClick={() => onTocar(!tocando)}
          aria-label={tocando ? "Pausar a simulação" : "Executar a simulação"}
        >
          {tocando ? (
            <Pause className="size-4" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
          {tocando ? "Pausar" : "Executar"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="hit-44 gap-1.5"
          onClick={onPassoFrente}
          disabled={!podeAvancar}
        >
          <SkipForward className="size-4" aria-hidden />
          {passoLabel}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hit-44 size-9"
          onClick={onReiniciar}
          disabled={!podeVoltar}
          aria-label="Reiniciar a simulação"
        >
          <RotateCcw className="size-4" aria-hidden />
        </Button>
      </div>

      <fieldset className="ml-auto flex items-center gap-1">
        <legend className="sr-only">Velocidade da simulação</legend>
        <span className="silkscreen mr-1" aria-hidden>
          Velocidade
        </span>
        {VELOCIDADES.map((v) => (
          <Button
            key={v}
            size="sm"
            variant={v === velocidade ? "default" : "ghost"}
            className="hit-44 h-8 px-2 font-mono text-xs"
            aria-pressed={v === velocidade}
            aria-label={`Velocidade ${v} vezes`}
            onClick={() => onVelocidade(v)}
          >
            {v}x
          </Button>
        ))}
      </fieldset>
    </div>
  );
}
