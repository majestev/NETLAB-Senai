"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { KIND_LABEL, SEARCH_INDEX, search, type SearchKind } from "@/lib/search";

const GROUP_ORDER: SearchKind[] = [
  "aula",
  "modulo",
  "simulador",
  "laboratorio",
  "termo",
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setQuery("");
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const grouped = useMemo(() => {
    const docs = query.trim()
      ? search(query)
      : SEARCH_INDEX.filter(
          (d) => d.kind === "modulo" || d.kind === "simulador",
        ).map((d) => ({ ...d, score: 0 }));

    return GROUP_ORDER.map((kind) => ({
      kind,
      items: docs.filter((d) => d.kind === kind).slice(0, 6),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  function go(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Buscar no NETLAB"
      description="Busque aulas, simuladores, laboratórios e termos do glossário"
    >

      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Buscar aulas, simuladores, VLAN, RIP, VLSM…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
        <CommandEmpty>
          <span className="text-sm text-muted-foreground">
            Nada encontrado para{" "}
            <span className="font-mono text-foreground">{query}</span>. Tente
            VLAN, RIP, CAM ou sub-rede.
          </span>
        </CommandEmpty>
        {grouped.map((group) => (
          <CommandGroup key={group.kind} heading={KIND_LABEL[group.kind]}>
            {group.items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={() => go(item.href)}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="text-sm font-medium">{item.title}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {item.description}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
