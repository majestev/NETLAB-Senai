import { test, expect } from "@playwright/test";
import {
  BROADCAST_MAC,
  isMulticast,
  processFrame,
  type CamEntry,
  type SwitchPort,
} from "@/lib/net/switching";

const PORTAS: SwitchPort[] = [
  { id: "fa1", label: "Fa0/1", mode: "access", vlan: 1 },
  { id: "fa2", label: "Fa0/2", mode: "access", vlan: 1 },
  { id: "fa3", label: "Fa0/3", mode: "access", vlan: 1 },
  { id: "fa4", label: "Fa0/4", mode: "access", vlan: 1 },
];

const PC1 = "00:11:11:11:11:11";
const PC2 = "00:22:22:22:22:22";

test("primeiro quadro: aprende a origem e inunda porque o destino é desconhecido", () => {
  const r = processFrame([], PORTAS, {
    sourceMac: PC1,
    destinationMac: PC2,
    ingressPort: "fa1",
    vlan: 1,
    tagged: false,
  }, 1);

  expect(r.action).toBe("inundar");
  expect(r.learned?.mac).toBe(PC1);
  expect(r.learned?.port).toBe("fa1");
  expect(r.egressPorts.sort()).toEqual(["fa2", "fa3", "fa4"]);
  expect(r.egressPorts).not.toContain("fa1");
});

test("a resposta ensina a segunda porta e o encaminhamento vira unicast", () => {
  const passo1 = processFrame([], PORTAS, {
    sourceMac: PC1, destinationMac: PC2, ingressPort: "fa1", vlan: 1, tagged: false,
  }, 1);

  const passo2 = processFrame(passo1.cam, PORTAS, {
    sourceMac: PC2, destinationMac: PC1, ingressPort: "fa2", vlan: 1, tagged: false,
  }, 2);

  expect(passo2.action).toBe("encaminhar");
  expect(passo2.egressPorts).toEqual(["fa1"]);

  const passo3 = processFrame(passo2.cam, PORTAS, {
    sourceMac: PC1, destinationMac: PC2, ingressPort: "fa1", vlan: 1, tagged: false,
  }, 3);
  expect(passo3.action).toBe("encaminhar");
  expect(passo3.egressPorts).toEqual(["fa2"]);
  expect(passo3.cam).toHaveLength(2);
});

test("broadcast sempre vai para toda a VLAN", () => {
  const cam: CamEntry[] = [{ mac: PC2, port: "fa2", vlan: 1, learnedAt: 0 }];
  const r = processFrame(cam, PORTAS, {
    sourceMac: PC1, destinationMac: BROADCAST_MAC, ingressPort: "fa1", vlan: 1, tagged: false,
  }, 1);
  expect(r.action).toBe("inundar");
  expect(r.egressPorts).toHaveLength(3);
});

test("quadro cujo destino está na porta de entrada é filtrado", () => {
  const cam: CamEntry[] = [
    { mac: PC1, port: "fa1", vlan: 1, learnedAt: 0 },
    { mac: PC2, port: "fa1", vlan: 1, learnedAt: 0 },
  ];
  const r = processFrame(cam, PORTAS, {
    sourceMac: PC1, destinationMac: PC2, ingressPort: "fa1", vlan: 1, tagged: false,
  }, 1);
  expect(r.action).toBe("filtrar");
  expect(r.egressPorts).toEqual([]);
});

test("host que muda de porta atualiza a entrada em vez de duplicar", () => {
  const cam: CamEntry[] = [{ mac: PC1, port: "fa1", vlan: 1, learnedAt: 0 }];
  const r = processFrame(cam, PORTAS, {
    sourceMac: PC1, destinationMac: PC2, ingressPort: "fa3", vlan: 1, tagged: false,
  }, 5);
  expect(r.cam.filter((e) => e.mac === PC1)).toHaveLength(1);
  expect(r.cam.find((e) => e.mac === PC1)!.port).toBe("fa3");
});

test.describe("VLAN e 802.1Q", () => {
  const COM_VLAN: SwitchPort[] = [
    { id: "fa1", label: "Fa0/1", mode: "access", vlan: 10 },
    { id: "fa2", label: "Fa0/2", mode: "access", vlan: 20 },
    { id: "fa3", label: "Fa0/3", mode: "access", vlan: 10 },
    { id: "gi1", label: "Gi0/1", mode: "trunk", allowed: [10, 20], nativeVlan: 1 },
  ];

  test("o quadro não sai por porta de outra VLAN", () => {
    const r = processFrame([], COM_VLAN, {
      sourceMac: PC1, destinationMac: PC2, ingressPort: "fa1", vlan: 10, tagged: false,
    }, 1);
    expect(r.egressPorts).toContain("fa3");
    expect(r.egressPorts).toContain("gi1");
    expect(r.egressPorts).not.toContain("fa2");
  });

  test("ao sair pelo trunk o quadro é marcado; a VLAN nativa não é", () => {
    const r = processFrame([], COM_VLAN, {
      sourceMac: PC1, destinationMac: PC2, ingressPort: "fa1", vlan: 10, tagged: false,
    }, 1);
    expect(r.taggedEgressPorts).toContain("gi1");

    const nativo = processFrame([], COM_VLAN, {
      sourceMac: PC1, destinationMac: PC2, ingressPort: "gi1", vlan: 1, tagged: false,
    }, 2);
    expect(nativo.taggedEgressPorts).not.toContain("gi1");
  });

  test("VLAN não permitida no trunk é descartada", () => {
    const r = processFrame([], COM_VLAN, {
      sourceMac: PC1, destinationMac: PC2, ingressPort: "gi1", vlan: 99, tagged: true,
    }, 1);
    expect(r.action).toBe("descartar");
  });

  test("a CAM é por VLAN: mesmo MAC em VLANs diferentes são entradas distintas", () => {
    const cam: CamEntry[] = [{ mac: PC2, port: "fa2", vlan: 20, learnedAt: 0 }];
    const r = processFrame(cam, COM_VLAN, {
      sourceMac: PC1, destinationMac: PC2, ingressPort: "fa1", vlan: 10, tagged: false,
    }, 1);

    expect(r.action).toBe("inundar");
  });
});

test("detecta endereço multicast pelo bit menos significativo do 1º octeto", () => {
  expect(isMulticast("01:00:5e:00:00:01")).toBe(true);
  expect(isMulticast("00:11:11:11:11:11")).toBe(false);
  expect(isMulticast(BROADCAST_MAC)).toBe(false);
});
