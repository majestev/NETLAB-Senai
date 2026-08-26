import type { MetadataRoute } from "next";
import { ALL_LESSONS, CURRICULUM } from "@/lib/content/curriculum";
import { LABS, SIMULATORS } from "@/lib/content/practice";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${SITE.url}${path}`;

  const fixas = [
    { path: "/", priority: 1 },
    { path: "/curso", priority: 0.9 },
    { path: "/simuladores", priority: 0.8 },
    { path: "/laboratorios", priority: 0.8 },
    { path: "/exercicios", priority: 0.7 },
    { path: "/quiz", priority: 0.7 },
    { path: "/glossario", priority: 0.6 },
    { path: "/referencias", priority: 0.4 },
    { path: "/busca", priority: 0.3 },
    { path: "/progresso", priority: 0.3 },
  ];

  return [
    ...fixas.map((f) => ({
      url: url(f.path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: f.priority,
    })),
    ...CURRICULUM.map((m) => ({
      url: url(m.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...ALL_LESSONS.map((l) => ({
      url: url(l.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...SIMULATORS.map((s) => ({
      url: url(s.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...LABS.map((l) => ({
      url: url(l.href),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
