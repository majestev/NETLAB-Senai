import { test, expect } from "@playwright/test";
import {
  ENCAP_LAYERS,
  ENCAP_STEPS,
  PAYLOAD_BYTES,
  buildEncapSteps,
} from "@/lib/net/encapsulation";

test("a descida vai da aplicação à física, e a subida desfaz na ordem inversa", () => {
  const descida = ENCAP_STEPS.filter((s) => s.direction === "descendo");
  const subida = ENCAP_STEPS.filter((s) => s.direction === "subindo");

  expect(descida.map((s) => s.layer)).toEqual([7, 4, 3, 2, 1]);
  expect(subida.map((s) => s.layer)).toEqual([1, 2, 3, 4, 7]);
  expect(subida.map((s) => s.layer)).toEqual(
    descida.map((s) => s.layer).reverse(),
  );
});

test("o total de bytes sobe monotonicamente e depois desce monotonicamente", () => {
  const descida = ENCAP_STEPS.filter((s) => s.direction === "descendo");
  const subida = ENCAP_STEPS.filter((s) => s.direction === "subindo");

  for (let i = 1; i < descida.length; i += 1) {
    expect(descida[i]!.totalBytes, `desce ${descida[i]!.id}`).toBeGreaterThanOrEqual(
      descida[i - 1]!.totalBytes,
    );
  }
  for (let i = 1; i < subida.length; i += 1) {
    expect(subida[i]!.totalBytes, `sobe ${subida[i]!.id}`).toBeLessThanOrEqual(
      subida[i - 1]!.totalBytes,
    );
  }
});

test("a aplicação recebe exatamente os bytes que enviou", () => {
  const primeiro = ENCAP_STEPS[0]!;
  const ultimo = ENCAP_STEPS.at(-1)!;
  expect(primeiro.layer).toBe(7);
  expect(ultimo.layer).toBe(7);
  expect(ultimo.totalBytes).toBe(PAYLOAD_BYTES);
  expect(ultimo.totalBytes).toBe(primeiro.totalBytes);

  expect(ultimo.wrapped).toEqual([]);
});

test("cada camada retira exatamente o que sua par adicionou", () => {
  for (const camada of ENCAP_LAYERS) {
    const desce = ENCAP_STEPS.find(
      (s) => s.direction === "descendo" && s.layer === camada.layer,
    )!;
    const sobe = ENCAP_STEPS.find(
      (s) => s.direction === "subindo" && s.layer === camada.layer,
    )!;
    const antesDeDescer =
      ENCAP_STEPS[desce.index - 1]?.totalBytes ?? PAYLOAD_BYTES;
    const adicionado = desce.totalBytes - antesDeDescer;
    const depoisDeSubir = sobe.totalBytes;
    const antesDeSubir = ENCAP_STEPS[sobe.index - 1]!.totalBytes;
    expect(adicionado, `L${camada.layer}`).toBe(camada.headerBytes);
    expect(antesDeSubir - depoisDeSubir, `L${camada.layer}`).toBe(
      camada.headerBytes,
    );
  }
});

test("o empilhamento é coerente: a camada que acabou de envolver é a mais externa", () => {
  for (const passo of ENCAP_STEPS.filter((s) => s.direction === "descendo")) {
    expect(passo.wrapped[0], passo.id).toBe(passo.layer);
  }
});

test("nenhuma camada aparece duas vezes na pilha ao mesmo tempo", () => {
  for (const passo of ENCAP_STEPS) {
    expect(new Set(passo.wrapped).size, passo.id).toBe(passo.wrapped.length);
  }
});

test("a sequência é determinística", () => {
  expect(buildEncapSteps()).toEqual(ENCAP_STEPS);
  ENCAP_STEPS.forEach((s, i) => expect(s.index).toBe(i));
});
