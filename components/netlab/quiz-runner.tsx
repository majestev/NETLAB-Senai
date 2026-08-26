"use client";

import { useMemo, useState } from "react";
import { useParamState } from "@/lib/hooks/use-param-state";
import Link from "next/link";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/components/progress-provider";
import { CURRICULUM } from "@/lib/content/curriculum";
import { QUIZ } from "@/lib/content/quiz";
import { sectionLabel } from "@/lib/content/syllabus";
import { cn } from "@/lib/utils";

export function QuizRunner() {
  const { recordQuiz } = useProgress();

  const [moduleId, setModuleId] = useParamState("modulo", "todos");
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  const questoes = useMemo(
    () => (moduleId === "todos" ? QUIZ : QUIZ.filter((q) => q.moduleId === moduleId)),
    [moduleId],
  );

  const respondidas = questoes.filter((q) => respostas[q.id] !== undefined);
  const acertos = respondidas.filter(
    (q) => q.options.find((o) => o.id === respostas[q.id])?.correct,
  ).length;
  const concluido = respondidas.length === questoes.length && questoes.length > 0;

  function responder(questionId: string, optionId: string) {
    const proximas = { ...respostas, [questionId]: optionId };
    setRespostas(proximas);

    const feitas = questoes.filter((q) => proximas[q.id] !== undefined);
    if (feitas.length === questoes.length) {
      const pontos = questoes.filter(
        (q) => q.options.find((o) => o.id === proximas[q.id])?.correct,
      ).length;
      recordQuiz(`quiz:${moduleId}`, pontos, questoes.length);
    }
  }

  function reiniciar() {
    setRespostas({});
  }

  return (
    <div className="space-y-6">

      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <span className="silkscreen">Módulo</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar questões por módulo">
          <Button
            size="sm"
            variant={moduleId === "todos" ? "default" : "outline"}
            className="h-7 text-xs"
            aria-pressed={moduleId === "todos"}
            onClick={() => {
              setModuleId("todos");
              setRespostas({});
            }}
          >
            Todos
          </Button>
          {CURRICULUM.map((m) => (
            <Button
              key={m.id}
              size="sm"
              variant={moduleId === m.id ? "default" : "outline"}
              className="h-7 text-xs"
              aria-pressed={moduleId === m.id}
              onClick={() => {
                setModuleId(m.id);
                setRespostas({});
              }}
            >
              {m.short}
            </Button>
          ))}
        </div>
      </div>

      <div
        className="panel sticky top-[var(--header-h)] z-10 flex flex-wrap items-center gap-4 p-4"
        aria-live="polite"
      >
        <p className="text-sm">
          {respondidas.length === 0 ? (
            <>
              <span className="silkscreen mr-2">Questões</span>
              <span className="font-mono tabular-nums">{questoes.length}</span>
              <span className="ml-2 text-muted-foreground">
                nenhuma respondida ainda
              </span>
            </>
          ) : (
            <>
              <span className="silkscreen mr-2">Acertos</span>
              <span className="font-mono text-lg tabular-nums text-copper">
                {acertos}
              </span>
              <span className="font-mono text-muted-foreground">
                {" "}de {respondidas.length} respondidas
              </span>
              <span className="ml-2 text-muted-foreground">
                ({questoes.length} no total)
              </span>
            </>
          )}
        </p>
        <div className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-panel-sunken">
          <div
            className="h-full bg-copper transition-[width]"
            style={{
              width: `${questoes.length === 0 ? 0 : (respondidas.length / questoes.length) * 100}%`,
            }}
          />
        </div>
        {respondidas.length > 0 && (
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={reiniciar}>
            <RotateCcw className="size-3.5" aria-hidden />
            Recomeçar
          </Button>
        )}
      </div>

      <div role="status" aria-live="polite">
      {concluido && (
        <div className="panel border-copper/40 bg-copper-soft p-5">
          <p className="text-lg font-semibold">
            {acertos} de {questoes.length} corretas —{" "}
            {Math.round((acertos / questoes.length) * 100)}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {acertos === questoes.length
              ? "Todas corretas. Vale revisar as explicações mesmo assim: elas dizem por que as outras alternativas falham."
              : "Releia a explicação de cada erro antes de refazer: é ali que está o aprendizado."}
          </p>
        </div>
      )}
      </div>

      <ol className="space-y-5">
        {questoes.map((questao, index) => {
          const escolhida = respostas[questao.id];
          const respondida = escolhida !== undefined;
          const selecionada = questao.options.find((o) => o.id === escolhida);

          return (
            <li key={questao.id} className="panel p-5">
              <p className="silkscreen mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Questão {index + 1} de {questoes.length}
                </span>
                <span className="text-copper">
                  Seção {sectionLabel(questao.section)}
                </span>
              </p>
              <fieldset>
                <legend className="text-base font-medium">{questao.prompt}</legend>
                <div className="mt-4 space-y-2">
                  {questao.options.map((option) => {
                    const marcada = escolhida === option.id;
                    const revelar = respondida;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors",
                          !revelar && "border-rail hover:border-rail-strong",
                          revelar && option.correct && "border-signal/50 bg-signal-soft",
                          revelar && marcada && !option.correct && "border-fault/50 bg-fault-soft",
                          revelar && !marcada && !option.correct && "border-rail opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          name={questao.id}
                          value={option.id}
                          checked={marcada}
                          disabled={respondida}
                          onChange={() => responder(questao.id, option.id)}
                          className="mt-0.5 size-4 shrink-0 accent-[var(--copper)]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start gap-2 text-sm">
                            {revelar && option.correct && (
                              <Check className="mt-0.5 size-4 shrink-0 text-signal" aria-label="Correta" />
                            )}
                            {revelar && marcada && !option.correct && (
                              <X className="mt-0.5 size-4 shrink-0 text-fault" aria-label="Sua resposta, incorreta" />
                            )}
                            {option.label}
                          </span>
                          {revelar && (
                            <span className="mt-1.5 block text-sm text-muted-foreground">
                              {option.why}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {respondida && (
                <p className="mt-4 flex flex-wrap items-center gap-2 border-t border-rail pt-3 text-sm">
                  <span
                    className={cn(
                      "silkscreen",
                      selecionada?.correct ? "text-signal" : "text-fault",
                    )}
                  >
                    {selecionada?.correct ? "Correto" : "Incorreto"}
                  </span>
                  <Link
                    href={questao.lesson}
                    className="text-fiber underline-offset-4 hover:underline"
                  >
                    Revisar a aula
                  </Link>
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
