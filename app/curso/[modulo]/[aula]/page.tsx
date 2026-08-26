import type { Metadata } from "next";
import { LessonPage } from "@/components/netlab/lesson-page";
import { CURRICULUM, getLessonByHref } from "@/lib/content/curriculum";
import { getLessonContent } from "@/lib/content/lessons";

export function generateStaticParams() {
  return CURRICULUM.flatMap((m) =>
    m.lessons.map((l) => ({
      modulo: m.id,
      aula: l.href.split("/").pop()!,
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/curso/[modulo]/[aula]">): Promise<Metadata> {
  const { modulo, aula } = await params;
  const href = `/curso/${modulo}/${aula}`;
  const lesson = getLessonByHref(href);
  const content = getLessonContent(href);
  if (!lesson) return {};
  return {
    title: lesson.title,
    description: content?.whatIs ?? lesson.objective,
    alternates: { canonical: href },
  };
}

export default async function Page({ params }: PageProps<"/curso/[modulo]/[aula]">) {
  const { modulo, aula } = await params;
  return <LessonPage href={`/curso/${modulo}/${aula}`} />;
}
