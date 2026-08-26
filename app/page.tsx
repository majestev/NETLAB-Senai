import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { WebSiteJsonLd } from "@/components/netlab/structured-data";
import { PacketJourney } from "@/components/netlab/journey/packet-journey";
import { HeroNetwork } from "@/components/netlab/hero-network";
import { HomeContinue } from "@/components/netlab/home-continue";
import { ModuleCard } from "@/components/netlab/module-card";
import {
  ScrollReveal,
  ScrollRevealItem,
} from "@/components/netlab/motion/scroll-reveal";
import { Button } from "@/components/ui/button";
import { ALL_LESSONS, CURRICULUM, TOTAL_LESSONS } from "@/lib/content/curriculum";
import { EXERCISE_KINDS } from "@/lib/content/exercises";
import { LABS, SIMULATORS } from "@/lib/content/practice";
import { QUIZ } from "@/lib/content/quiz";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.title}`,
  description: SITE.description,
  alternates: { canonical: "/" },
};

const primeiraAula = ALL_LESSONS[0];

const MODOS = [
  {
    titulo: "Simuladores",
    href: "/simuladores",
    contagem: SIMULATORS.length,
    promessa:
      "Mexa nos valores e acompanhe o cálculo. Nenhum devolve só o resultado.",
    exemplos: SIMULATORS.slice(0, 3).map((s) => s.title),
    verTudo: `Ver os ${SIMULATORS.length} simuladores`,
  },
  {
    titulo: "Laboratórios",
    href: "/laboratorios",
    contagem: LABS.length,
    promessa:
      "Um cenário pede uma decisão sua. O site corrige e explica por quê.",
    exemplos: LABS.slice(0, 3).map((l) => l.title),
    verTudo: `Ver os ${LABS.length} laboratórios`,
  },
  {
    titulo: "Verificação",
    href: "/quiz",
    contagem: QUIZ.length,
    promessa:
      "Cada alternativa vem com o motivo de estar certa ou errada. O feedback é a aula.",
    exemplos: [
      `${QUIZ.length} questões rastreadas ao programa`,
      `${EXERCISE_KINDS.length} tipos de exercício com enunciado novo a cada rodada`,
      "Gabarito calculado pela mesma biblioteca dos simuladores",
    ],
    verTudo: "Abrir o quiz",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <WebSiteJsonLd />

      <section className="relative overflow-hidden border-b border-rail">
        <div className="relative mx-auto max-w-[1600px] px-4 pb-10 pt-16 sm:px-6 lg:pt-20">
          <p className="silkscreen">Laboratório interativo de redes</p>

          <h1 className="mt-5 max-w-[30ch] text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.5rem]">
            Rede não é apenas conexão.
            <br />
            <span className="text-copper">É decisão.</span>
          </h1>

          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-foreground/85">
            Cada roteador decide por onde o pacote sai; cada switch decide se
            encaminha ou inunda. Aqui você vê essas decisões acontecerem e
            depois toma você mesmo.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-4">

            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={primeiraAula.href} />}
            >
              Começar pela aula 01
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/simuladores" />}
            >
              Ir direto às ferramentas
            </Button>
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
            <span className="tabular-nums text-copper">{TOTAL_LESSONS}</span> aulas
            <span aria-hidden>·</span>
            <span className="tabular-nums text-copper">{SIMULATORS.length}</span>{" "}
            simuladores
            <span aria-hidden>·</span>
            <span className="tabular-nums text-copper">{LABS.length}</span>{" "}
            laboratórios
          </p>

          <div className="mt-12 lg:mt-16">
            <HeroNetwork />
          </div>
        </div>
      </section>

      <section className="border-b border-rail">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
          <HomeContinue />
        </div>
      </section>

      <ScrollReveal as="section" className="border-b border-rail">
        <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:py-16">
          <div className="mb-6">
            <p className="silkscreen">A viagem de um pacote</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Do PC ao servidor, evento a evento
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm text-muted-foreground">
              O IP de destino nunca muda; o MAC muda a cada salto e o TTL cai
              de um em um. Execute ou avance passo a passo e observe qual
              campo se altera em cada evento.
            </p>
          </div>

          <PacketJourney />
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" className="border-b border-rail" stagger>
        <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:py-16">
          <p className="silkscreen">Trilha do curso</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Seis módulos, do endereçamento à rede sem fio
          </h2>
          <p className="mt-2 max-w-[62ch] text-sm text-muted-foreground">
            Feitos para serem lidos na ordem: cada módulo supõe o anterior
            resolvido.
          </p>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CURRICULUM.map((module) => (
              <ScrollRevealItem key={module.id} as="li">
                <ModuleCard module={module} />
              </ScrollRevealItem>
            ))}
          </ul>

          <p className="mt-6">
            <Link href="/curso" className="link-inline text-sm text-fiber">
              Ver o programa completo, aula por aula
            </Link>
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal as="section" stagger>
        <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:py-16">
          <p className="silkscreen">Depois de ler</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Três formas de exercitar a mesma aula
          </h2>

          <ul className="mt-8 grid gap-3 lg:grid-cols-3">
            {MODOS.map((modo) => (
              <ScrollRevealItem key={modo.href} as="li">
                <div className="flex h-full flex-col rounded-md border border-rail bg-panel p-5">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-semibold">{modo.titulo}</span>
                    <span
                      aria-hidden
                      className="font-mono text-xs tabular-nums text-copper"
                    >
                      {String(modo.contagem).padStart(2, "0")}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {modo.promessa}
                  </p>
                  <ul className="mt-4 space-y-1.5 border-t border-rail pt-4">
                    {modo.exemplos.map((exemplo) => (
                      <li
                        key={exemplo}
                        className="flex gap-2.5 text-sm text-foreground/85"
                      >
                        <span
                          aria-hidden
                          className="mt-2 size-1 shrink-0 rounded-full bg-fiber"
                        />
                        {exemplo}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-4">
                    <Link
                      href={modo.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-fiber"
                    >
                      {modo.verTudo}
                      <ArrowRight
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </p>
                </div>
              </ScrollRevealItem>
            ))}
          </ul>
        </div>
      </ScrollReveal>
    </>
  );
}
