"use client";

import dynamic from "next/dynamic";

const TopologyBuilder = dynamic(
  () => import("./topology-builder").then((m) => m.TopologyBuilder),
  {
    ssr: false,
    loading: () => (
      <div
        className="panel flex h-[26rem] items-center justify-center bg-panel-sunken"
        role="status"
      >
        <span className="text-sm text-muted-foreground">
          Carregando o construtor de topologia…
        </span>
      </div>
    ),
  },
);

export function TopologyBuilderLoader() {
  return <TopologyBuilder />;
}
