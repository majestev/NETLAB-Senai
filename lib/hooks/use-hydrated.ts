"use client";

import { useSyncExternalStore } from "react";

const naoAssina = () => () => {};
const noCliente = () => true;
const noServidor = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(naoAssina, noCliente, noServidor);
}
