"use client";

import { useId } from "react";
import { useMotionOk } from "./use-motion-ok";

export function NetworkPulse({
  path,
  duration = 3.2,
  delay = 0,
  color = "var(--fiber)",
  size = 2.6,

  count = 1,
}: {
  path: string;
  duration?: number;
  delay?: number;
  color?: string;
  size?: number;
  count?: number;
}) {
  const animar = useMotionOk();
  const id = useId();
  if (!animar) return null;

  return (
    <g aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} r={size} fill={color} opacity={0}>
          <animateMotion
            id={`${id}-${i}`}
            dur={`${duration}s`}
            begin={`${delay + (duration / count) * i}s`}
            repeatCount="indefinite"
            path={path}
            keyPoints="0;1"
            keyTimes="0;1"
            calcMode="linear"
          />
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            keyTimes="0;0.12;0.88;1"
            dur={`${duration}s`}
            begin={`${delay + (duration / count) * i}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );
}

export function linePath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}
