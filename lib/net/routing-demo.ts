import { parseIpv4 } from "./ipv4";
import type { RouteEntry } from "./routing";

function ip(v: string): number {
  const r = parseIpv4(v);
  if (!r.ok) throw new Error(`endereço inválido na tabela de exemplo: ${v}`);
  return r.value;
}

export const DEMO_ROUTES: RouteEntry[] = [
  { id: "r1", network: ip("0.0.0.0"), prefix: 0, source: "padrão", ad: 1, metric: 0, nextHop: ip("203.0.113.1"), iface: "Gi0/2" },
  { id: "r2", network: ip("10.0.0.0"), prefix: 8, source: "RIP", ad: 120, metric: 4, nextHop: ip("10.0.12.2"), iface: "Gi0/0" },
  { id: "r3", network: ip("10.1.0.0"), prefix: 16, source: "OSPF", ad: 110, metric: 20, nextHop: ip("10.0.12.2"), iface: "Gi0/0" },
  { id: "r4", network: ip("10.1.1.0"), prefix: 24, source: "estática", ad: 1, metric: 0, nextHop: ip("10.0.13.2"), iface: "Gi0/1" },
  { id: "r5", network: ip("10.1.1.0"), prefix: 24, source: "RIP", ad: 120, metric: 2, nextHop: ip("10.0.12.2"), iface: "Gi0/0" },
  { id: "r6", network: ip("172.16.0.0"), prefix: 16, source: "OSPF", ad: 110, metric: 30, nextHop: ip("10.0.12.2"), iface: "Gi0/0" },
  { id: "r7", network: ip("172.16.0.0"), prefix: 16, source: "OSPF", ad: 110, metric: 30, nextHop: ip("10.0.13.2"), iface: "Gi0/1" },
  { id: "r8", network: ip("192.168.1.0"), prefix: 24, source: "conectada", ad: 0, metric: 0, nextHop: null, iface: "Gi0/3" },
];

export interface DemoScenario {
  ip: string;

  porque: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  { ip: "10.1.1.5", porque: "casa com três entradas — mostra os três critérios em sequência" },
  { ip: "172.16.4.9", porque: "empata em tudo: instala ECMP" },
  { ip: "10.1.9.9", porque: "o /16 vence o /8" },
  { ip: "192.168.1.20", porque: "rede diretamente conectada" },
  { ip: "8.8.8.8", porque: "só a rota padrão casa" },
];
