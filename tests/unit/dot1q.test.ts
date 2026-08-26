import { test, expect } from "@playwright/test";
import {
  UNTAGGED_FIELDS,
  buildTagStages,
  fieldsAtStage,
  tagFields,
} from "@/lib/net/dot1q";

test("só o trecho de trunk carrega a etiqueta", () => {
  const estagios = buildTagStages(10);
  const marcados = estagios.filter((e) => e.tagged).map((e) => e.id);
  expect(marcados).toEqual(["trunk"]);
});

test("nenhum dos dois hosts vê a etiqueta", () => {
  const estagios = buildTagStages(20);
  const origem = estagios.find((e) => e.id === "host-origem")!;
  const destino = estagios.find((e) => e.id === "host-destino")!;
  expect(origem.tagged).toBe(false);
  expect(destino.tagged).toBe(false);
  expect(fieldsAtStage(origem, 20)).toEqual(UNTAGGED_FIELDS);
  expect(fieldsAtStage(destino, 20)).toEqual(UNTAGGED_FIELDS);
});

test("a etiqueta é inserida uma vez e removida uma vez", () => {
  const mudancas = buildTagStages(30)
    .map((e) => e.changed)
    .filter((c) => c !== null);
  expect(mudancas).toEqual(["inserida", "removida"]);
});

test("o quadro sai e volta ao mesmo tamanho, e cresce 4 bytes no trunk", () => {
  const estagios = buildTagStages(10);
  const trunk = estagios.find((e) => e.id === "trunk")!;
  const semEtiqueta = estagios.filter((e) => !e.tagged);
  for (const e of semEtiqueta) expect(e.maxBytes, e.id).toBe(1518);
  expect(trunk.maxBytes).toBe(1522);
});

test("a etiqueta entra entre o MAC de origem e o EtherType", () => {
  const trunk = buildTagStages(10).find((e) => e.tagged)!;
  const ids = fieldsAtStage(trunk, 10).map((f) => f.id);
  expect(ids).toEqual(["dst", "src", "tpid", "pcp", "dei", "vid", "type", "payload", "fcs"]);
});

test("o TPID é fixo e o VID carrega a VLAN escolhida", () => {
  for (const vlan of [1, 10, 20, 4094]) {
    const campos = tagFields(vlan);
    expect(campos.find((c) => c.id === "tpid")?.value).toBe("0x8100");
    expect(campos.find((c) => c.id === "vid")?.value).toBe(String(vlan));
  }
});

test("todo campo da etiqueta está marcado como tal, e nenhum outro está", () => {
  const trunk = buildTagStages(10).find((e) => e.tagged)!;
  const campos = fieldsAtStage(trunk, 10);
  const marcados = campos.filter((c) => c.tag).map((c) => c.id);
  expect(marcados).toEqual(["tpid", "pcp", "dei", "vid"]);
});

test("os estágios são cinco e vêm indexados na ordem do percurso", () => {
  const estagios = buildTagStages(10);
  expect(estagios).toHaveLength(5);
  estagios.forEach((e, i) => expect(e.index).toBe(i));
  expect(estagios.map((e) => e.id)).toEqual([
    "host-origem",
    "porta-acesso-entrada",
    "trunk",
    "porta-acesso-saida",
    "host-destino",
  ]);
});
