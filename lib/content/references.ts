import { LESSON_CONTENT } from "./lessons";
import { getLessonByHref } from "./curriculum";

export interface ReferenceEntry {
  code: string;
  title: string;
  organization: "IETF" | "IEEE";
  url: string;

  lessons: Array<{ href: string; title: string }>;
}

const CATALOG: Array<Omit<ReferenceEntry, "lessons">> = [
  { code: "RFC 791", title: "Internet Protocol", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc791" },
  { code: "RFC 826", title: "An Ethernet Address Resolution Protocol", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc826" },
  { code: "RFC 1058", title: "Routing Information Protocol", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc1058" },
  { code: "RFC 1518", title: "An Architecture for IP Address Allocation with CIDR", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc1518" },
  { code: "RFC 1519", title: "Classless Inter-Domain Routing (CIDR)", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc1519" },
  { code: "RFC 1812", title: "Requirements for IP Version 4 Routers", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc1812" },
  { code: "RFC 1918", title: "Address Allocation for Private Internets", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc1918" },
  { code: "RFC 2328", title: "OSPF Version 2", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc2328" },
  { code: "RFC 2080", title: "RIPng for IPv6", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc2080" },
  { code: "RFC 2453", title: "RIP Version 2", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc2453" },
  { code: "RFC 3021", title: "Using 31-Bit Prefixes on IPv4 Point-to-Point Links", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc3021" },
  { code: "RFC 3927", title: "Dynamic Configuration of IPv4 Link-Local Addresses", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc3927" },
  { code: "RFC 5737", title: "IPv4 Address Blocks Reserved for Documentation", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc5737" },
  { code: "RFC 9293", title: "Transmission Control Protocol (TCP)", organization: "IETF", url: "https://www.rfc-editor.org/rfc/rfc9293" },
  { code: "IEEE 802", title: "Overview and Architecture — define o formato do endereço MAC de 48 bits", organization: "IEEE", url: "https://standards.ieee.org/ieee/802/" },
  { code: "IEEE 802.1D", title: "MAC Bridges e Spanning Tree", organization: "IEEE", url: "https://standards.ieee.org/ieee/802.1D/" },
  { code: "IEEE 802.1Q", title: "Bridges and Bridged Networks — VLAN", organization: "IEEE", url: "https://standards.ieee.org/ieee/802.1Q/" },
  { code: "IEEE 802.3", title: "Ethernet", organization: "IEEE", url: "https://standards.ieee.org/ieee/802.3/" },
  { code: "IEEE 802.11", title: "Wireless LAN MAC and PHY Specifications", organization: "IEEE", url: "https://standards.ieee.org/ieee/802.11/" },
  { code: "IEEE 802.11i", title: "Medium Access Control Security Enhancements", organization: "IEEE", url: "https://standards.ieee.org/ieee/802.11i/" },
];

export function referenceCode(citation: string): string {
  return citation.split(" (")[0].trim();
}

export const REFERENCES: ReferenceEntry[] = CATALOG.map((entry) => ({
  ...entry,
  lessons: LESSON_CONTENT.filter((lesson) =>
    lesson.references?.some((r) => referenceCode(r) === entry.code),
  )
    .map((lesson) => {
      const meta = getLessonByHref(lesson.href);
      return meta ? { href: meta.href, title: meta.title } : null;
    })
    .filter((v): v is { href: string; title: string } => v !== null),
})).sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));
