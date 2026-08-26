import { test, expect } from "@playwright/test";
import { countDomains, type TopologyDevice, type TopologyLink } from "@/lib/net/domains";

const d = (id: string, kind: TopologyDevice["kind"]): TopologyDevice => ({
  id,
  kind,
  label: id,
});
const l = (id: string, source: string, target: string): TopologyLink => ({
  id,
  source,
  target,
});

test("hub com 4 hosts: 1 domínio de colisão e 1 de broadcast", () => {
  const r = countDomains(
    [d("hub", "hub"), d("a", "host"), d("b", "host"), d("c", "host"), d("d", "host")],
    [l("1", "hub", "a"), l("2", "hub", "b"), l("3", "hub", "c"), l("4", "hub", "d")],
  );
  expect(r.collision).toBe(1);
  expect(r.broadcast).toBe(1);
});

test("switch com 4 hosts: 4 domínios de colisão e 1 de broadcast", () => {
  const r = countDomains(
    [d("sw", "switch"), d("a", "host"), d("b", "host"), d("c", "host"), d("d", "host")],
    [l("1", "sw", "a"), l("2", "sw", "b"), l("3", "sw", "c"), l("4", "sw", "d")],
  );
  expect(r.collision).toBe(4);
  expect(r.broadcast).toBe(1);
});

test("roteador com 3 interfaces: 3 domínios de colisão e 3 de broadcast", () => {
  const r = countDomains(
    [d("r", "router"), d("a", "host"), d("b", "host"), d("c", "host")],
    [l("1", "r", "a"), l("2", "r", "b"), l("3", "r", "c")],
  );
  expect(r.collision).toBe(3);
  expect(r.broadcast).toBe(3);
});

test("roteador entre dois switches: 2 domínios de broadcast", () => {
  const r = countDomains(
    [
      d("r", "router"),
      d("sw1", "switch"), d("sw2", "switch"),
      d("a", "host"), d("b", "host"), d("c", "host"), d("e", "host"),
    ],
    [
      l("1", "r", "sw1"), l("2", "r", "sw2"),
      l("3", "sw1", "a"), l("4", "sw1", "b"),
      l("5", "sw2", "c"), l("6", "sw2", "e"),
    ],
  );

  expect(r.collision).toBe(6);

  expect(r.broadcast).toBe(2);
});

test("hub pendurado num switch funde só os enlaces do hub", () => {
  const r = countDomains(
    [
      d("sw", "switch"), d("hub", "hub"),
      d("a", "host"), d("b", "host"), d("c", "host"),
    ],
    [
      l("1", "sw", "hub"),
      l("2", "hub", "a"), l("3", "hub", "b"),
      l("4", "sw", "c"),
    ],
  );

  expect(r.collision).toBe(2);
  expect(r.broadcast).toBe(1);
});

test("dois switches ligados entre si continuam num único domínio de broadcast", () => {
  const r = countDomains(
    [d("sw1", "switch"), d("sw2", "switch"), d("a", "host"), d("b", "host")],
    [l("1", "sw1", "sw2"), l("2", "sw1", "a"), l("3", "sw2", "b")],
  );
  expect(r.collision).toBe(3);
  expect(r.broadcast).toBe(1);
});

test("topologia vazia não quebra", () => {
  const r = countDomains([], []);
  expect(r.collision).toBe(0);
  expect(r.broadcast).toBe(0);
});

test("enlace para equipamento inexistente é ignorado e sinalizado", () => {
  const r = countDomains(
    [d("sw", "switch"), d("a", "host")],
    [l("1", "sw", "a"), l("2", "sw", "fantasma")],
  );
  expect(r.collision).toBe(1);
  expect(r.invalidLinks).toEqual(["2"]);
});

test("enlace de um equipamento para ele mesmo é ignorado", () => {
  const r = countDomains([d("sw", "switch")], [l("1", "sw", "sw")]);
  expect(r.collision).toBe(0);
  expect(r.invalidLinks).toEqual(["1"]);
});
