"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const subscribeNothing = () => () => {};

export function SearchTrigger({
  onOpen,
  onPrefetch,
  className,
}: {
  onOpen: () => void;
  onPrefetch?: () => void;
  className?: string;
}) {
  const isApple = useSyncExternalStore(
    subscribeNothing,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
  const shortcut = isApple ? "⌘ K" : "Ctrl K";

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      aria-label={`Buscar no NETLAB (atalho ${shortcut})`}
      className={cn(
        "group flex h-9 items-center gap-2 rounded-sm border border-rail bg-panel-sunken px-3 text-sm text-muted-foreground transition-colors hover:border-rail-strong hover:text-foreground",
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span aria-hidden className="hidden sm:inline">
        Buscar
      </span>
      <kbd
        aria-hidden
        className="ml-2 hidden shrink-0 rounded-sm border border-rail bg-panel px-1.5 py-0.5 font-mono text-2xs text-muted-foreground lg:inline"
      >
        {shortcut}
      </kbd>
    </button>
  );
}
