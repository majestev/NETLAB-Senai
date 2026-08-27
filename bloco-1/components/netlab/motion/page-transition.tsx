"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useHydrated } from "@/lib/hooks/use-hydrated";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return <Quadro key={pathname}>{children}</Quadro>;
}

function Quadro({ children }: { children: React.ReactNode }) {
  const hidratado = useHydrated();
  const [animar] = useState(hidratado);

  return <div className={animar ? "entrada-rota" : undefined}>{children}</div>;
}
