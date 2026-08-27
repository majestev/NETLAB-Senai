"use client";

import { useEffect } from "react";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/components/progress-provider";

export function LessonProgress({ href }: { href: string }) {
  const { isCompleted, toggleLesson, markVisited, loading } = useProgress();

  useEffect(() => {
    if (!loading) markVisited(href);
  }, [href, loading, markVisited]);

  const done = isCompleted(href);

  return (
    <Button
      variant={done ? "secondary" : "outline"}
      size="sm"
      className="gap-2"
      aria-pressed={done}
      onClick={() => toggleLesson(href)}
    >
      {done ? (
        <Check className="size-4 text-signal" aria-hidden />
      ) : (
        <Circle className="size-4" aria-hidden />
      )}
      {done ? "Aula concluída" : "Marcar como concluída"}
    </Button>
  );
}
