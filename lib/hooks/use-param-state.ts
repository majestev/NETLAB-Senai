"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

const naoAssina = () => () => {};
const noCliente = () => true;
const noServidor = () => false;

export function useParamState(
  chave: string,
  padrao: string,
): [string, (valor: string) => void] {
  const hidratado = useSyncExternalStore(naoAssina, noCliente, noServidor);

  const [escolhido, setEscolhido] = useState<string | null>(null);

  const daUrl = hidratado
    ? new URLSearchParams(window.location.search).get(chave)
    : null;

  const valor = escolhido ?? daUrl ?? padrao;

  const definir = useCallback(
    (novo: string) => {
      setEscolhido(novo);

      const atuais = new URLSearchParams(window.location.search);

      if (!novo || novo === padrao) atuais.delete(chave);
      else atuais.set(chave, novo);

      const query = atuais.toString();

      window.history.replaceState(
        null,
        "",
        query ? `${window.location.pathname}?${query}` : window.location.pathname,
      );
    },
    [chave, padrao],
  );

  return [valor, definir];
}
