import { DEVICE_SYMBOL, DeviceSymbols } from "./device-symbols";

type Kind = "roteamento" | "vlsm" | "rip" | "switching" | "vlan" | "wireless";

interface Node {
  x: number;
  y: number;
  kind: keyof typeof DEVICE_SYMBOL;
  name: string;
  sub?: string;
}

interface Link {
  from: number;
  to: number;
  label?: string;
  dashed?: boolean;
  tone?: "normal" | "wan";
}

interface Spec {
  width: number;
  height: number;
  nodes: Node[];
  links: Link[];
  title: string;
  desc: string;

  table: Array<[string, string, string]>;
}

const SPECS: Record<Kind, Spec> = {
  roteamento: {
    width: 620,
    height: 190,
    title: "Duas LANs ligadas por dois roteadores",
    desc: "PC-A na LAN 192.168.1.0/24 conecta-se a R1. R1 liga-se a R2 pelo enlace 10.0.12.0/30. R2 atende a LAN 192.168.3.0/24, onde está PC-B.",
    nodes: [
      { x: 70, y: 80, kind: "host", name: "PC-A", sub: "192.168.1.10" },
      { x: 230, y: 80, kind: "router", name: "R1", sub: "Gi0/0 10.0.12.1" },
      { x: 390, y: 80, kind: "router", name: "R2", sub: "Gi0/0 10.0.12.2" },
      { x: 550, y: 80, kind: "host", name: "PC-B", sub: "192.168.3.10" },
    ],
    links: [
      { from: 0, to: 1, label: "192.168.1.0/24" },
      { from: 1, to: 2, label: "10.0.12.0/30", tone: "wan" },
      { from: 2, to: 3, label: "192.168.3.0/24" },
    ],
    table: [
      ["PC-A – R1", "192.168.1.0/24", "LAN de origem, gateway 192.168.1.1"],
      ["R1 – R2", "10.0.12.0/30", "enlace ponto a ponto, R1 usa .1 e R2 usa .2"],
      ["R2 – PC-B", "192.168.3.0/24", "LAN de destino, gateway 192.168.3.1"],
    ],
  },
  vlsm: {
    width: 620,
    height: 230,
    title: "Rede a ser endereçada com VLSM",
    desc: "Quatro LANs (A, B, C e D) atendidas por dois roteadores ligados entre si e a um terceiro por dois enlaces WAN. Todo o endereçamento sai do bloco 192.168.10.0/24.",
    nodes: [
      { x: 90, y: 60, kind: "switch", name: "LAN A", sub: "60 hosts" },
      { x: 90, y: 160, kind: "switch", name: "LAN B", sub: "28 hosts" },
      { x: 250, y: 110, kind: "router", name: "R1", sub: "" },
      { x: 410, y: 110, kind: "router", name: "R2", sub: "" },
      { x: 550, y: 60, kind: "switch", name: "LAN C", sub: "12 hosts" },
      { x: 550, y: 160, kind: "switch", name: "LAN D", sub: "10 hosts" },
    ],
    links: [
      { from: 0, to: 2 },
      { from: 1, to: 2 },
      { from: 2, to: 3, label: "WAN 1 · 2 hosts", tone: "wan" },
      { from: 3, to: 4 },
      { from: 3, to: 5 },
    ],
    table: [
      ["LAN A", "60 hosts", "precisa de /26"],
      ["LAN B", "28 hosts", "precisa de /27"],
      ["LAN C", "12 hosts", "precisa de /28"],
      ["LAN D", "10 hosts", "precisa de /28"],
      ["WAN 1 e WAN 2", "2 hosts cada", "precisam de /30"],
    ],
  },
  rip: {
    width: 620,
    height: 190,
    title: "Três roteadores em linha com RIP",
    desc: "R1, R2 e R3 em linha. R1 atende a LAN 192.168.1.0/24 e R3 atende a LAN 192.168.3.0/24. Os enlaces entre roteadores são 10.0.12.0/30 e 10.0.23.0/30.",
    nodes: [
      { x: 80, y: 80, kind: "switch", name: "LAN 1", sub: "192.168.1.0/24" },
      { x: 230, y: 80, kind: "router", name: "R1" },
      { x: 380, y: 80, kind: "router", name: "R2" },
      { x: 530, y: 80, kind: "router", name: "R3" },
    ],
    links: [
      { from: 0, to: 1 },
      { from: 1, to: 2, label: "10.0.12.0/30", tone: "wan" },
      { from: 2, to: 3, label: "10.0.23.0/30", tone: "wan" },
    ],
    table: [
      ["R1", "192.168.1.0/24 conectada", "aprende a LAN de R3 com 2 saltos"],
      ["R2", "os dois enlaces conectados", "aprende as duas LANs com 1 salto"],
      ["R3", "192.168.3.0/24 conectada", "aprende a LAN de R1 com 2 saltos"],
    ],
  },
  switching: {
    width: 620,
    height: 200,
    title: "Switch com quatro hosts",
    desc: "Um switch SW1 com quatro hosts, PC1 a PC4, nas portas Fa0/1 a Fa0/4. Todos na mesma VLAN.",
    nodes: [
      { x: 310, y: 50, kind: "switch", name: "SW1" },
      { x: 100, y: 150, kind: "host", name: "PC1", sub: "Fa0/1" },
      { x: 240, y: 150, kind: "host", name: "PC2", sub: "Fa0/2" },
      { x: 380, y: 150, kind: "host", name: "PC3", sub: "Fa0/3" },
      { x: 520, y: 150, kind: "host", name: "PC4", sub: "Fa0/4" },
    ],
    links: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
    ],
    table: [
      ["PC1", "Fa0/1", "00:11:11:11:11:11"],
      ["PC2", "Fa0/2", "00:22:22:22:22:22"],
      ["PC3", "Fa0/3", "00:33:33:33:33:33"],
      ["PC4", "Fa0/4", "00:44:44:44:44:44"],
    ],
  },
  vlan: {
    width: 620,
    height: 210,
    title: "Switch segmentado em VLAN 10 e VLAN 20 com trunk",
    desc: "SW1 com PC1 e PC3 na VLAN 10 e PC2 e PC4 na VLAN 20. A porta Gi0/1 é um trunk 802.1Q que transporta as duas VLANs até SW2.",
    nodes: [
      { x: 250, y: 50, kind: "switch", name: "SW1" },
      { x: 90, y: 155, kind: "host", name: "PC1", sub: "VLAN 10" },
      { x: 210, y: 155, kind: "host", name: "PC2", sub: "VLAN 20" },
      { x: 330, y: 155, kind: "host", name: "PC3", sub: "VLAN 10" },
      { x: 450, y: 155, kind: "host", name: "PC4", sub: "VLAN 20" },
      { x: 540, y: 50, kind: "switch", name: "SW2" },
    ],
    links: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 },
      { from: 0, to: 5, label: "trunk 802.1Q · 10,20", dashed: true, tone: "wan" },
    ],
    table: [
      ["PC1 e PC3", "VLAN 10", "portas de acesso, quadros sem marcação"],
      ["PC2 e PC4", "VLAN 20", "portas de acesso, quadros sem marcação"],
      ["SW1 – SW2", "trunk Gi0/1", "802.1Q, VLANs 10 e 20 marcadas, nativa 1"],
    ],
  },
  wireless: {
    width: 620,
    height: 190,
    title: "Cliente sem fio, ponto de acesso e rede cabeada",
    desc: "Um notebook associa-se por rádio a um ponto de acesso, que se conecta por cabo a um switch e daí ao restante da rede.",
    nodes: [
      { x: 90, y: 90, kind: "host", name: "Cliente", sub: "802.11" },
      { x: 260, y: 90, kind: "ap", name: "AP1", sub: "SSID NETLAB" },
      { x: 420, y: 90, kind: "switch", name: "SW1" },
      { x: 550, y: 90, kind: "router", name: "R1" },
    ],
    links: [
      { from: 0, to: 1, label: "enlace sem fio", dashed: true },
      { from: 1, to: 2, label: "cabeado" },
      { from: 2, to: 3 },
    ],
    table: [
      ["Cliente – AP1", "sem fio, 802.11", "protegido por WPA2 ou WPA3"],
      ["AP1 – SW1", "cabeado", "o AP faz a ponte entre o rádio e o cabo"],
      ["SW1 – R1", "cabeado", "saída para outras redes"],
    ],
  },
};

export function LabTopology({ kind }: { kind: Kind }) {
  const spec = SPECS[kind];
  const titleId = `topo-${kind}-title`;
  const descId = `topo-${kind}-desc`;

  return (
    <figure className="panel overflow-hidden bg-panel-sunken">
      <DeviceSymbols />
      <div className="scroll-x" tabIndex={0} role="region" aria-label={spec.title}>
        <svg
          viewBox={`0 0 ${spec.width} ${spec.height}`}
          className="h-auto w-full"
          style={{ minWidth: `${spec.width / 20}rem` }}
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
        >
          <title id={titleId}>{spec.title}</title>
          <desc id={descId}>{spec.desc}</desc>

          {spec.links.map((link, i) => {
            const a = spec.nodes[link.from];
            const b = spec.nodes[link.to];
            return (
              <g key={i}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={link.tone === "wan" ? "var(--copper)" : "var(--rail-strong)"}
                  strokeWidth="1.75"
                  strokeDasharray={link.dashed ? "6 4" : undefined}
                />
                {link.label && (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2 - 8}
                    textAnchor="middle"
                    className="font-mono"
                    fontSize="10"
                    fill="var(--muted-foreground)"
                  >
                    {link.label}
                  </text>
                )}
              </g>
            );
          })}

          {spec.nodes.map((node) => (
            <g key={node.name}>
              <rect
                x={node.x - 24}
                y={node.y - 24}
                width="48"
                height="48"
                rx="5"
                fill="var(--panel)"
                stroke="var(--rail-strong)"
                strokeWidth="1.25"
              />
              <use
                href={DEVICE_SYMBOL[node.kind]}
                x={node.x - 15}
                y={node.y - 15}
                width="30"
                height="30"
                stroke="var(--foreground)"
                fill="none"
              />
              <text
                x={node.x}
                y={node.y + 40}
                textAnchor="middle"
                className="font-mono"
                fontSize="11"
                fontWeight="600"
                fill="var(--foreground)"
              >
                {node.name}
              </text>
              {node.sub && (
                <text
                  x={node.x}
                  y={node.y + 53}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="9"
                  fill="var(--muted-foreground)"
                >
                  {node.sub}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      <details className="border-t border-rail">
        <summary className="cursor-pointer px-4 py-2.5 text-sm">
          Ver a topologia em tabela
        </summary>
        <div className="scroll-x border-t border-rail" tabIndex={0} role="region" aria-label={`${spec.title} em tabela`}>
          <table className="w-full min-w-max text-sm">
            <caption className="sr-only">{spec.title}</caption>
            <thead>
              <tr className="border-b border-rail text-left">
                <th scope="col" className="px-4 py-2 font-medium">Elemento</th>
                <th scope="col" className="px-4 py-2 font-medium">Rede / porta</th>
                <th scope="col" className="px-4 py-2 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody>
              {spec.table.map((row) => (
                <tr key={row[0]} className="border-b border-rail last:border-b-0">
                  <td className="px-4 py-2 font-mono text-xs">{row[0]}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row[1]}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
