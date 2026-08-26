import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5 rounded-sm font-panel",
        className,
      )}
      aria-label="NETLAB — página inicial"
    >
      <span
        aria-hidden
        className="relative flex size-2 shrink-0 items-center justify-center"
      >
        <span className="absolute size-2 rounded-full bg-signal/30" />
        <span className="size-1 rounded-full bg-signal" />
      </span>
      <span className="text-base font-bold tracking-[0.16em] text-foreground">
        NETLAB
      </span>
    </Link>
  );
}
