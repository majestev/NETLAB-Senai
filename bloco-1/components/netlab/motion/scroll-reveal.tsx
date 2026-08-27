"use client";

import { useCallback, useRef, useState } from "react";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useMotionOk } from "./use-motion-ok";
import { cn } from "@/lib/utils";

type Tag = "div" | "section" | "ul" | "ol";

export function ScrollReveal({
  children,
  stagger = false,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  stagger?: boolean;
  delay?: number;
  className?: string;
  as?: Tag;
}) {
  const motionOk = useMotionOk();
  const hidratado = useHydrated();
  const [revelar] = useState(motionOk && hidratado);
  const [visivel, setVisivel] = useState(false);
  const observador = useRef<IntersectionObserver | null>(null);

  const ancorar = useCallback(
    (no: HTMLElement | null) => {
      observador.current?.disconnect();
      observador.current = null;
      if (!no || !revelar) return;

      if (typeof IntersectionObserver === "undefined") {
        setVisivel(true);
        return;
      }

      observador.current = new IntersectionObserver(
        (entradas) => {
          if (!entradas.some((e) => e.isIntersecting)) return;
          setVisivel(true);
          observador.current?.disconnect();
          observador.current = null;
        },
        { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
      );
      observador.current.observe(no);
    },
    [revelar],
  );

  const Componente = as;

  return (
    <Componente
      ref={ancorar}
      className={cn(
        className,
        revelar && !stagger && "revelar",
        revelar && stagger && "revelar-cascata",
        revelar && visivel && "revelar-visivel",
      )}
      style={revelar && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Componente>
  );
}

export function ScrollRevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Componente = as;
  return (
    <Componente data-revelar-item className={className}>
      {children}
    </Componente>
  );
}
