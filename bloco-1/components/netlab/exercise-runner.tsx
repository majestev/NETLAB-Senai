"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Eye, Lightbulb, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EXERCISE_KINDS,
  generateExercise,
  matchesAnswer,
  type ExerciseKind,
} from "@/lib/content/exercises";
import { cn } from "@/lib/utils";

interface Estado {
  valor: string;
  verificado: boolean;
  revelado: boolean;
  dica: boolean;
}

const VAZIO: Estado = { valor: "", verificado: false, revelado: false, dica: false };

export function ExerciseRunner({ initialSeed }: { initialSeed: number }) {
  const [seed, setSeed] = useState(initialSeed);
  const [tipos, setTipos] = useState<ExerciseKind[]>(
    EXERCISE_KINDS.map((k) => k.kind),
  );
  const [estados, setEstados] = useState<Record<string, Estado>>({});

  const exercicios = useMemo(
    () =>
      EXERCISE_KINDS.filter((k) => tipos.includes(k.kind)).map((k, i) =>
        generateExercise(k.kind, seed + i * 7919),
      ),
    [seed, tipos],
  );

  const acertos = exercicios.filter((e) => {
    const estado = estados[e.id];
    return estado?.verificado && matchesAnswer(e, estado.valor);
  }).length;

  const verificados = exercicios.filter((e) => estados[e.id]?.verificado).length;

  function atualizar(id: string, patch: Partial<Estado>) {
    setEstados((atual) => ({ ...atual, [id]: { ...VAZIO, ...atual[id], ...patch } }));
  }

  function novaRodada() {
    setSeed(Math.floor(Math.random() * 1_000_000));
    setEstados({});
  }

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <span className="silkscreen">Tipos</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar tipos de exercício">
          {EXERCISE_KINDS.map((k) => {
            const ativo = tipos.includes(k.kind);
            return (
              <Button
                key={k.kind}
                size="sm"
                variant={ativo ? "default" : "outline"}
                className="h-7 text-xs"
                aria-pressed={ativo}
                onClick={() =>
                  setTipos((atual) =>
                    ativo
                      ? atual.length > 1
                        ? atual.filter((t) => t !== k.kind)
                        : atual
                      : [...atual, k.kind],
                  )
                }
              >
                {k.label}
              </Button>
            );
          })}
        </div>
        <Button size="sm" variant="outline" className="ml-auto gap-1.5" onClick={novaRodada}>
          <RefreshCw className="size-3.5" aria-hidden />
          Novos exercícios
        </Button>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        <span className="silkscreen mr-2">Progresso</span>
        {verificados === 0
          ? "Responda os exercícios abaixo. Os enunciados mudam a cada rodada."
          : `${acertos} corretos de ${verificados} verificados.`}
      </p>

      <ol className="space-y-4" aria-label="Exercícios">
        {exercicios.map((exercicio) => {
          const estado = estados[exercicio.id] ?? VAZIO;
          const correta = estado.verificado && matchesAnswer(exercicio, estado.valor);
          const tipo = EXERCISE_KINDS.find((k) => k.kind === exercicio.kind)!;

          return (
            <li key={exercicio.id} className="panel p-5">
              <p className="silkscreen mb-2">{tipo.label}</p>
              <p className="text-base">{exercicio.prompt}</p>

              <div className="mt-4 flex flex-wrap items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={exercicio.id} className="sr-only">
                    Resposta
                  </Label>
                  <Input
                    id={exercicio.id}
                    value={estado.valor}
                    onChange={(e) =>
                      atualizar(exercicio.id, { valor: e.target.value, verificado: false })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && estado.valor.trim()) {
                        atualizar(exercicio.id, { verificado: true });
                      }
                    }}
                    placeholder="Sua resposta"
                    className={cn(
                      "max-w-sm font-mono",
                      estado.verificado && (correta ? "border-signal" : "border-fault"),
                    )}
                    spellCheck={false}
                    aria-invalid={estado.verificado && !correta}
                    aria-describedby={estado.verificado ? `${exercicio.id}-fb` : undefined}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!estado.valor.trim()}
                  onClick={() => atualizar(exercicio.id, { verificado: true })}
                >
                  Verificar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  aria-expanded={estado.dica}
                  onClick={() => atualizar(exercicio.id, { dica: !estado.dica })}
                >
                  <Lightbulb className="size-3.5" aria-hidden />
                  Dica
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  onClick={() => atualizar(exercicio.id, { revelado: true })}
                >
                  <Eye className="size-3.5" aria-hidden />
                  Ver resposta
                </Button>
              </div>

              {estado.dica && !estado.revelado && (
                <p className="mt-3 text-sm text-muted-foreground">{exercicio.hint}</p>
              )}

              {(estado.verificado || estado.revelado) && (
                <div
                  id={`${exercicio.id}-fb`}
                  role="status"
                  className={cn(
                    "panel mt-4 p-4",
                    estado.revelado && !correta
                      ? "border-caution/40 bg-caution-soft"
                      : correta
                        ? "border-signal/40 bg-signal-soft"
                        : "border-fault/40 bg-fault-soft",
                  )}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {correta ? (
                      <>
                        <Check className="size-4 text-signal" aria-hidden />
                        Correto
                      </>
                    ) : estado.revelado ? (
                      <>Resposta: <span className="font-mono">{exercicio.answer}</span></>
                    ) : (
                      <>
                        <X className="size-4 text-fault" aria-hidden />
                        Ainda não
                      </>
                    )}
                  </p>
                  {(correta || estado.revelado) && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {exercicio.explanation}
                    </p>
                  )}
                  <p className="mt-2 text-sm">
                    <Link
                      href={exercicio.lesson}
                      className="text-fiber underline-offset-4 hover:underline"
                    >
                      Revisar a aula
                    </Link>
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
