"use client";

import dynamic from "next/dynamic";

export const CommandPaletteLazy = dynamic(
  () => import("./command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function prefetchCommandPalette() {
  void import("./command-palette");
}
