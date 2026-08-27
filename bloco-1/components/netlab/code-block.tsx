"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CodeLineExplanation {
  line: string;
  explanation: string;
}

export function CodeBlock({
  title,
  code,
  caption,
  explanations,
  collapsedLines = 12,
}: {
  title?: string;
  code: string;
  caption?: string;
  explanations?: CodeLineExplanation[];
  collapsedLines?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [explaining, setExplaining] = useState(false);

  const lines = code.trimEnd().split("\n");
  const isLong = lines.length > collapsedLines;
  const visible = expanded || !isLong ? lines : lines.slice(0, collapsedLines);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="panel overflow-hidden">
      <figcaption className="flex flex-wrap items-center gap-2 border-b border-rail bg-panel-sunken px-3 py-2">
        <span className="silkscreen min-w-0 flex-1 truncate">
          {title ?? "Configuração"}
        </span>
        {explanations && explanations.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            aria-expanded={explaining}
            onClick={() => setExplaining((v) => !v)}
          >
            <HelpCircle className="size-3.5" aria-hidden />
            Explicar
          </Button>
        )}
        {isLong && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 px-2 text-xs"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
              aria-hidden
            />
            {expanded ? "Recolher" : `Expandir (${lines.length} linhas)`}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={copy}
        >
          {copied ? (
            <Check className="size-3.5 text-signal" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </figcaption>

      <div
        className="scroll-x"
        tabIndex={0}
        role="region"
        aria-label={`Bloco de código: ${title ?? "Configuração"}`}
      >
        <pre className="min-w-fit px-4 py-3 text-sm leading-relaxed">
          <code>
            {visible.map((line, index) => (
              <span key={index} className="block whitespace-pre">
                {line.startsWith("!") ? (
                  <span className="text-muted-foreground">{line}</span>
                ) : line.includes("#") || line.includes(">") ? (
                  <>
                    <span className="text-copper">
                      {line.slice(0, Math.max(line.indexOf("#"), line.indexOf(">")) + 1)}
                    </span>
                    <span>
                      {line.slice(Math.max(line.indexOf("#"), line.indexOf(">")) + 1)}
                    </span>
                  </>
                ) : (
                  line
                )}
              </span>
            ))}
            {isLong && !expanded && (
              <span className="block text-muted-foreground">
                {`… mais ${lines.length - collapsedLines} ${lines.length - collapsedLines === 1 ? "linha" : "linhas"}`}
              </span>
            )}
          </code>
        </pre>
      </div>

      {explaining && explanations && (
        <div className="border-t border-rail bg-panel-sunken px-4 py-3">
          <p className="silkscreen mb-2">Linha a linha</p>
          <dl className="space-y-2.5">
            {explanations.map((item) => (
              <div key={item.line}>
                <dt className="font-mono text-xs text-copper">{item.line}</dt>
                <dd className="mt-0.5 text-sm text-muted-foreground">
                  {item.explanation}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {caption && (
        <p className="border-t border-rail px-4 py-2 text-sm text-muted-foreground">
          {caption}
        </p>
      )}
    </figure>
  );
}
