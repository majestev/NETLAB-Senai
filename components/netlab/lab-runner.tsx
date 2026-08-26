"use client";

import { useMemo, useState } from "react";
import { Check, CircleAlert, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProgress } from "@/components/progress-provider";
import { checkStaticRoute } from "@/lib/net/cisco";
import { parseCidr, prefixForHosts } from "@/lib/net/ipv4";
import { validateManualAllocation, type ManualSubnet } from "@/lib/net/vlsm";
import type { LabDefinition, LabTask } from "@/lib/content/labs-data";
import { cn } from "@/lib/utils";

type Respostas = Record<string, string | string[]>;

function normalizar(valor: string): string {
  return valor.trim().toLowerCase().replace(/\s+/g, " ");
}

interface Avaliacao {
  correta: boolean;
  detalhes: Array<{ texto: string; ok: boolean }>;
}

function avaliar(task: LabTask, resposta: string | string[] | undefined): Avaliacao | null {
  if (resposta === undefined) return null;

  switch (task.kind) {
    case "choice": {
      const escolha = task.options.find((o) => o.id === resposta);
      if (!escolha) return null;
      return {
        correta: escolha.correct,
        detalhes: [{ texto: escolha.why, ok: escolha.correct }],
      };
    }
    case "multi": {
      const marcadas = new Set(Array.isArray(resposta) ? resposta : []);
      const detalhes = task.options.map((o) => {
        const acertou = marcadas.has(o.id) === o.correct;
        return {
          texto: `${o.label} — ${o.why}`,
          ok: acertou,
        };
      });
      return { correta: detalhes.every((d) => d.ok), detalhes };
    }
    case "input": {
      const texto = normalizar(String(resposta));
      const correta = task.answers.some((a) => normalizar(a) === texto);
      return { correta, detalhes: [{ texto: task.why, ok: correta }] };
    }
    case "comando-rota": {
      const v = checkStaticRoute(String(resposta), task.expected);
      const detalhes = [{ texto: v.correct ? task.why : v.message, ok: v.correct }];

      if (v.nuance) detalhes.push({ texto: v.nuance, ok: true });
      return { correta: v.correct, detalhes };
    }
    case "vlsm":
      return null;
  }
}

function TarefaVlsm({
  task,
  onResultado,
}: {
  task: Extract<LabTask, { kind: "vlsm" }>;
  onResultado: (correta: boolean) => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(task.requirements.map((r) => [r.id, ""])),
  );
  const [verificado, setVerificado] = useState(false);

  const bloco = parseCidr(task.block);

  const analise = useMemo(() => {
    if (!bloco.ok) return null;
    const subnets: ManualSubnet[] = [];
    const erros: Array<{ id: string; message: string }> = [];

    for (const req of task.requirements) {
      const bruto = valores[req.id]?.trim();
      if (!bruto) {
        erros.push({ id: req.id, message: `${req.label} ainda não foi alocada.` });
        continue;
      }
      const parsed = parseCidr(bruto);
      if (!parsed.ok) {
        erros.push({ id: req.id, message: `${req.label}: ${parsed.error}` });
        continue;
      }
      subnets.push({
        id: req.id,
        label: req.label,
        requiredHosts: req.hosts,
        network: parsed.value.address,
        prefix: parsed.value.prefix,
      });
    }

    const issues = validateManualAllocation(bloco.value, subnets);
    return { erros, issues, completo: subnets.length === task.requirements.length };
  }, [valores, task.requirements, bloco]);

  const correta =
    analise !== null &&
    analise.completo &&
    analise.erros.length === 0 &&
    analise.issues.length === 0;

  return (
    <div>
      <p className="mb-3 text-sm">{task.prompt}</p>
      <p className="mb-4 text-sm text-muted-foreground">
        Bloco disponível:{" "}
        <span className="font-mono text-foreground">{task.block}</span>
      </p>

      <ul className="space-y-2.5">
        {task.requirements.map((req) => {
          const problema =
            verificado &&
            (analise?.erros.some((e) => e.id === req.id) ||
              analise?.issues.some(
                (i) => i.subnetId === req.id || i.otherSubnetId === req.id,
              ));
          return (
            <li key={req.id} className="flex flex-wrap items-end gap-3">
              <div className="min-w-40">
                <Label htmlFor={`vlsm-${req.id}`} className="text-sm">
                  {req.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {req.hosts} hosts{prefixoExigido(req.hosts)}
                </p>
              </div>
              <Input
                id={`vlsm-${req.id}`}
                value={valores[req.id]}
                onChange={(e) => {
                  setValores((v) => ({ ...v, [req.id]: e.target.value }));
                  setVerificado(false);
                }}

                placeholder="endereço/prefixo"
                className={cn(
                  "max-w-52 font-mono",
                  problema && "border-fault",
                )}
                spellCheck={false}
                aria-invalid={problema ? true : undefined}
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            setVerificado(true);
            onResultado(correta);
          }}
        >
          Validar alocação
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => {
            setValores(Object.fromEntries(task.requirements.map((r) => [r.id, ""])));
            setVerificado(false);
          }}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Limpar
        </Button>
      </div>

      {verificado && analise && (
        <div
          className={cn(
            "panel mt-4 p-4",
            correta ? "border-signal/40 bg-signal-soft" : "border-fault/40 bg-fault-soft",
          )}
          role="status"
        >
          {correta ? (
            <p className="flex items-center gap-2 text-sm font-medium text-signal">
              <Check className="size-4" aria-hidden />
              Alocação válida: sem sobreposição, sem bloco pequeno demais e
              tudo dentro de {task.block}.
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-medium">
                <CircleAlert className="size-4 text-fault" aria-hidden />
                Ainda há problemas:
              </p>
              <ul className="mt-2 space-y-1.5">
                {analise.erros.map((e) => (
                  <li key={e.id} className="text-sm text-muted-foreground">
                    {e.message}
                  </li>
                ))}
                {analise.issues.map((i, index) => (
                  <li key={`${i.kind}-${index}`} className="text-sm text-muted-foreground">
                    {i.message}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function LabRunner({ lab }: { lab: LabDefinition }) {
  const { recordLab } = useProgress();
  const [respostas, setRespostas] = useState<Respostas>({});
  const [verificadas, setVerificadas] = useState<Record<string, boolean>>({});
  const [vlsmOk, setVlsmOk] = useState<Record<string, boolean>>({});

  const avaliacoes = useMemo(() => {
    const mapa: Record<string, Avaliacao | null> = {};
    for (const task of lab.tasks) {
      mapa[task.id] =
        task.kind === "vlsm"
          ? vlsmOk[task.id] === undefined
            ? null
            : { correta: vlsmOk[task.id], detalhes: [] }
          : verificadas[task.id]
            ? avaliar(task, respostas[task.id])
            : null;
    }
    return mapa;
  }, [lab.tasks, respostas, verificadas, vlsmOk]);

  const respondidas = lab.tasks.filter((t) => avaliacoes[t.id] !== null);
  const acertos = respondidas.filter((t) => avaliacoes[t.id]?.correta).length;
  const concluido = respondidas.length === lab.tasks.length;

  function marcar(id: string) {
    setVerificadas((v) => ({ ...v, [id]: true }));
    const total = lab.tasks.length;
    const proximos = { ...verificadas, [id]: true };
    const feitos = lab.tasks.filter(
      (t) => t.kind === "vlsm" ? vlsmOk[t.id] !== undefined : proximos[t.id],
    );
    if (feitos.length === total) {
      const pontos = lab.tasks.filter((t) => {
        if (t.kind === "vlsm") return vlsmOk[t.id];
        const a = avaliar(t, respostas[t.id]);
        return a?.correta;
      }).length;
      recordLab(lab.href, pontos, total);
    }
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-6">
        {lab.tasks.map((task, index) => {
          const avaliacao = avaliacoes[task.id];
          return (
            <li key={task.id} className="panel p-5">
              <p className="silkscreen mb-3">
                Tarefa {index + 1} de {lab.tasks.length}
              </p>

              {task.kind === "vlsm" ? (
                <TarefaVlsm
                  task={task}
                  onResultado={(ok) => {
                    setVlsmOk((v) => ({ ...v, [task.id]: ok }));
                    marcar(task.id);
                  }}
                />
              ) : (
                <>
                  <p className="text-sm font-medium">{task.prompt}</p>
                  {task.kind === "multi" && task.help && (
                    <p className="mt-1 text-xs text-muted-foreground">{task.help}</p>
                  )}

                  {task.kind === "choice" && (
                    <fieldset className="mt-4">
                      <legend className="sr-only">{task.prompt}</legend>
                      <div className="space-y-2">
                        {task.options.map((option) => (
                          <label
                            key={option.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors",
                              respostas[task.id] === option.id
                                ? "border-copper bg-copper-soft"
                                : "border-rail hover:border-rail-strong",
                            )}
                          >
                            <input
                              type="radio"
                              name={task.id}
                              value={option.id}
                              checked={respostas[task.id] === option.id}
                              onChange={() => {
                                setRespostas((r) => ({ ...r, [task.id]: option.id }));
                                setVerificadas((v) => ({ ...v, [task.id]: false }));
                              }}
                              className="mt-0.5 size-4 shrink-0 accent-[var(--copper)]"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {task.kind === "multi" && (
                    <fieldset className="mt-4">
                      <legend className="sr-only">{task.prompt}</legend>
                      <div className="space-y-2">
                        {task.options.map((option) => {
                          const marcadas = (respostas[task.id] as string[]) ?? [];
                          const checked = marcadas.includes(option.id);
                          return (
                            <label
                              key={option.id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors",
                                checked
                                  ? "border-copper bg-copper-soft"
                                  : "border-rail hover:border-rail-strong",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setRespostas((r) => ({
                                    ...r,
                                    [task.id]: checked
                                      ? marcadas.filter((m) => m !== option.id)
                                      : [...marcadas, option.id],
                                  }));
                                  setVerificadas((v) => ({ ...v, [task.id]: false }));
                                }}
                                className="mt-0.5 size-4 shrink-0 accent-[var(--copper)]"
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {(task.kind === "input" || task.kind === "comando-rota") && (
                    <div className="mt-4">
                      <Label htmlFor={task.id} className="sr-only">
                        {task.prompt}
                      </Label>
                      <Input
                        id={task.id}
                        value={(respostas[task.id] as string) ?? ""}
                        placeholder={task.placeholder}
                        onChange={(e) => {
                          setRespostas((r) => ({ ...r, [task.id]: e.target.value }));
                          setVerificadas((v) => ({ ...v, [task.id]: false }));
                        }}
                        className="max-w-xl font-mono"
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                      />
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="hit-44 mt-4"
                    disabled={respostas[task.id] === undefined}
                    onClick={() => marcar(task.id)}
                  >
                    Verificar
                  </Button>

                  <div role="status" aria-live="polite">
                  {avaliacao && (
                    <div
                      className={cn(
                        "panel mt-4 p-4",
                        avaliacao.correta
                          ? "border-signal/40 bg-signal-soft"
                          : "border-fault/40 bg-fault-soft",
                      )}
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        {avaliacao.correta ? (
                          <>
                            <Check className="size-4 text-signal" aria-hidden />
                            Correto
                          </>
                        ) : (
                          <>
                            <X className="size-4 text-fault" aria-hidden />
                            Ainda não
                          </>
                        )}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {avaliacao.detalhes.map((d, i) => (
                          <li
                            key={i}
                            className={cn(
                              "text-sm",
                              d.ok ? "text-muted-foreground" : "text-foreground",
                            )}
                          >
                            {d.texto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>

      <div role="status" aria-live="polite">
      {concluido && (
        <div className="panel border-copper/40 bg-copper-soft p-5">
          <p className="silkscreen mb-2">Resultado</p>
          <p className="text-lg font-semibold">
            {acertos} de {lab.tasks.length} tarefas corretas
          </p>
          <p className="mt-3 text-sm">O que este laboratório demonstra:</p>
          <ul className="mt-2 space-y-1.5">
            {lab.conclusion.map((c) => (
              <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-copper" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
}

function prefixoExigido(hosts: number): string {
  const r = prefixForHosts(hosts);
  return r.ok ? ` · precisa de /${r.value}` : "";
}
