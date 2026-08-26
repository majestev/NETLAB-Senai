function resolverUrl(): string {
  const informado = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (informado) return informado.replace(/\/+$/, "");

  const dono = process.env.GITHUB_REPOSITORY_OWNER?.trim();
  if (dono) return `https://${dono.toLowerCase()}.github.io`;

  return "http://localhost:3000";
}

export const SITE = {
  name: "NETLAB",
  title: "Redes de Computadores",
  subtitle: "Roteamento, Comutação e Redes Sem Fio",
  description:
    "Plataforma de estudo de redes de computadores: roteamento IP, comutação, VLANs e redes sem fio, com visualizações interativas, simuladores e laboratórios práticos.",
  url: resolverUrl(),
  locale: "pt-BR",
} as const;
