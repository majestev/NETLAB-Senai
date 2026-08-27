import { SITE } from "@/lib/site";

function Json({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"

      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function CourseJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "Course",
        name,
        description,
        url: `${SITE.url}${url}`,
        inLanguage: "pt-BR",
        provider: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
        },
      }}
    />
  );
}

export function LearningResourceJsonLd({
  name,
  description,
  url,
  module,
}: {
  name: string;
  description: string;
  url: string;
  module: string;
}) {
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name,
        description,
        url: `${SITE.url}${url}`,
        inLanguage: "pt-BR",
        learningResourceType: "Aula",
        educationalLevel: "Ensino técnico",
        about: module,
        isPartOf: {
          "@type": "Course",
          name: `${SITE.title} — ${SITE.subtitle}`,
          url: `${SITE.url}/curso`,
        },
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  trail,
}: {
  trail: Array<{ href: string; label: string }>;
}) {
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: trail.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.label,
          item: `${SITE.url}${crumb.href}`,
        })),
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE.name,
        alternateName: `${SITE.name} — ${SITE.title}`,
        description: SITE.description,
        url: SITE.url,
        inLanguage: "pt-BR",
        author: {
          "@type": "Person",
          name: SITE.author.name,
          url: SITE.author.github,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE.url}/busca?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}
