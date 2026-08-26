import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutTone = "info" | "atencao" | "erro" | "dica";

const TONE = {
  info: { icon: Info, className: "border-info/40 bg-info-soft", accent: "text-info" },
  atencao: {
    icon: AlertTriangle,
    className: "border-caution/40 bg-caution-soft",
    accent: "text-caution",
  },
  erro: {
    icon: AlertTriangle,
    className: "border-fault/40 bg-fault-soft",
    accent: "text-fault",
  },
  dica: {
    icon: Lightbulb,
    className: "border-signal/40 bg-signal-soft",
    accent: "text-signal",
  },
} as const;

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone;
  title: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, className, accent } = TONE[tone];
  return (
    <aside className={cn("panel p-4", className)}>
      <p className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", accent)} aria-hidden />
        <span className="text-sm font-semibold">{title}</span>
      </p>
      <div className="mt-2 text-sm text-muted-foreground [&>p+p]:mt-2">
        {children}
      </div>
    </aside>
  );
}
