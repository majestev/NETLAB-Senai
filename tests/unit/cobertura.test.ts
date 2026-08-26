import { test, expect } from "@playwright/test";
import { SYLLABUS, SYLLABUS_LEAVES } from "@/lib/content/syllabus";
import { ALL_LESSONS, CURRICULUM } from "@/lib/content/curriculum";
import { LESSON_CONTENT, getLessonContent } from "@/lib/content/lessons";
import { lessonOutline, slugify } from "@/lib/content/outline";
import { QUIZ } from "@/lib/content/quiz";
import { LAB_DEFINITIONS } from "@/lib/content/labs-data";
import { GLOSSARY } from "@/lib/content/glossary";
import { LABS, SIMULATORS } from "@/lib/content/practice";
import { REFERENCES, referenceCode } from "@/lib/content/references";
import { DISCIPLINE_MATERIAL_INTEGRATED } from "@/lib/content/source";

test("toda seção folha do programa tem uma aula correspondente no site", () => {
  const semAula: string[] = [];
  for (const secao of SYLLABUS_LEAVES) {
    const existe =
      ALL_LESSONS.some((l) => l.href === secao.lesson) ||
      secao.lesson === "/glossario";
    if (!existe) semAula.push(`${secao.code} ${secao.title} → ${secao.lesson}`);
  }
  expect(semAula, semAula.join("\n")).toEqual([]);
});

test("toda aula do currículo tem conteúdo escrito", () => {
  const semConteudo = ALL_LESSONS.filter((l) => !getLessonContent(l.href)).map(
    (l) => l.href,
  );
  expect(semConteudo, semConteudo.join("\n")).toEqual([]);
});

test("toda aula responde a estrutura pedagógica obrigatória", () => {
  const incompletas: string[] = [];
  for (const c of LESSON_CONTENT) {
    if (c.whatIs.trim().length < 40) incompletas.push(`${c.href}: "o que é" curto demais`);
    if (c.whyExists.trim().length < 40) incompletas.push(`${c.href}: "por que existe" curto demais`);
    if (c.sections.length < 2) incompletas.push(`${c.href}: menos de 2 seções`);
    if (c.commonErrors.length < 2) incompletas.push(`${c.href}: menos de 2 erros comuns`);
    if (c.summary.length < 3) incompletas.push(`${c.href}: resumo com menos de 3 pontos`);
  }
  expect(incompletas, incompletas.join("\n")).toEqual([]);
});

test("toda questão do quiz é rastreável a uma seção existente do programa", () => {
  const orfas = QUIZ.filter(
    (q) => !SYLLABUS.some((s) => s.code === q.section),
  ).map((q) => `${q.id} → seção "${q.section}"`);
  expect(orfas, orfas.join("\n")).toEqual([]);
});

test("toda questão aponta para uma aula existente e tem exatamente uma correta", () => {
  const problemas: string[] = [];
  for (const q of QUIZ) {
    if (!ALL_LESSONS.some((l) => l.href === q.lesson)) {
      problemas.push(`${q.id}: aula inexistente ${q.lesson}`);
    }
    const corretas = q.options.filter((o) => o.correct).length;
    if (corretas !== 1) {
      problemas.push(`${q.id}: ${corretas} alternativas corretas`);
    }
    const semExplicacao = q.options.filter((o) => o.why.trim().length < 20);
    if (semExplicacao.length > 0) {
      problemas.push(`${q.id}: alternativa sem explicação suficiente`);
    }
  }
  expect(problemas, problemas.join("\n")).toEqual([]);
});

test("cada subseção com aula própria tem ao menos uma questão", () => {
  const semQuestao = SYLLABUS_LEAVES.filter(
    (s) => s.lesson !== "/glossario" && !QUIZ.some((q) => q.section === s.code),
  ).map((s) => `${s.code} ${s.title}`);
  expect(semQuestao, semQuestao.join("\n")).toEqual([]);
});

test("todo laboratório está ligado a uma aula real e tem tarefas validáveis", () => {
  const problemas: string[] = [];
  for (const lab of LAB_DEFINITIONS) {
    const meta = LABS.find((l) => l.href === lab.href);
    if (!meta) {
      problemas.push(`${lab.href}: sem entrada no registro de laboratórios`);
      continue;
    }
    if (meta.lesson && !ALL_LESSONS.some((l) => l.href === meta.lesson)) {
      problemas.push(`${lab.href}: aponta para aula inexistente ${meta.lesson}`);
    }
    if (lab.tasks.length < 3) problemas.push(`${lab.href}: menos de 3 tarefas`);
    if (lab.conclusion.length < 2) problemas.push(`${lab.href}: conclusão rasa`);
    for (const task of lab.tasks) {
      if (task.kind === "choice" || task.kind === "multi") {
        const corretas = task.options.filter((o) => o.correct).length;
        if (task.kind === "choice" && corretas !== 1) {
          problemas.push(`${lab.href}/${task.id}: ${corretas} corretas numa escolha única`);
        }
        if (task.kind === "multi" && corretas === 0) {
          problemas.push(`${lab.href}/${task.id}: nenhuma alternativa correta`);
        }
      }
    }
  }
  expect(problemas, problemas.join("\n")).toEqual([]);
});

test("todo simulador aponta para uma aula existente", () => {
  const orfaos = SIMULATORS.filter(
    (s) => s.lesson && !ALL_LESSONS.some((l) => l.href === s.lesson),
  ).map((s) => s.href);
  expect(orfaos, orfaos.join("\n")).toEqual([]);
});

test("todo verbete do glossário aponta para uma aula existente", () => {
  const orfaos = GLOSSARY.filter(
    (g) => g.lesson && !ALL_LESSONS.some((l) => l.href === g.lesson),
  ).map((g) => g.term);
  expect(orfaos, orfaos.join("\n")).toEqual([]);
});

test("toda norma citada numa aula existe no catálogo de referências", () => {
  const faltando: string[] = [];
  for (const c of LESSON_CONTENT) {
    for (const ref of c.references ?? []) {
      const codigo = referenceCode(ref);
      if (!REFERENCES.some((r) => r.code === codigo)) {
        faltando.push(`${c.href}: ${codigo}`);
      }
    }
  }
  expect(faltando, faltando.join("\n")).toEqual([]);
});

test("nenhum conteúdo declara origem na disciplina enquanto ela não estiver integrada", () => {
  if (DISCIPLINE_MATERIAL_INTEGRATED) {
    test.skip(true, "material integrado: esta invariante deixa de valer");
    return;
  }
  const indevidos: string[] = [];
  for (const c of LESSON_CONTENT) {
    if (c.source === "disciplina") indevidos.push(`aula ${c.href}`);
  }
  for (const g of GLOSSARY) {
    if (g.source === "disciplina") indevidos.push(`verbete ${g.term}`);
  }
  for (const q of QUIZ) {
    if (q.source === "disciplina") indevidos.push(`questão ${q.id}`);
  }
  for (const l of LAB_DEFINITIONS) {
    if (l.source === "disciplina") indevidos.push(`laboratório ${l.href}`);
  }
  expect(
    indevidos,
    `conteúdo marcado como vindo da disciplina sem o documento no projeto:\n${indevidos.join("\n")}`,
  ).toEqual([]);
});

test("o currículo cobre os seis módulos do programa", () => {
  expect(CURRICULUM).toHaveLength(6);
  const numeros = CURRICULUM.map((m) => m.number);
  expect(numeros).toEqual(["01", "02", "03", "04", "05", "06"]);
});

test("o exemplo de VLSM do curso usa o bloco e as sub-redes do programa", async () => {
  const { VLSM_BLOCO, VLSM_REQUISITOS } = await import(
    "@/components/netlab/vlsm-worked-example"
  );
  expect(VLSM_BLOCO).toBe("192.168.10.0/24");
  expect(VLSM_REQUISITOS.map((r) => r.label)).toEqual([
    "LAN A",
    "LAN B",
    "LAN C",
    "LAN D",
    "WAN 1",
    "WAN 2",
  ]);

  const lab = LAB_DEFINITIONS.find((l) => l.href === "/laboratorios/vlsm")!;
  const tarefa = lab.tasks.find((t) => t.kind === "vlsm");
  expect(tarefa).toBeDefined();
  if (tarefa?.kind === "vlsm") {
    expect(tarefa.block).toBe(VLSM_BLOCO);
    expect(tarefa.requirements.map((r) => r.label)).toEqual(
      VLSM_REQUISITOS.map((r) => r.label),
    );
    expect(tarefa.requirements.map((r) => r.hosts)).toEqual(
      VLSM_REQUISITOS.map((r) => r.hosts),
    );
  }
});

test("todo termo relacionado do glossário aponta para um verbete que existe", () => {
  const termos = new Set(GLOSSARY.map((g) => g.term));
  const quebrados: string[] = [];

  for (const entrada of GLOSSARY) {
    for (const relacionado of entrada.related ?? []) {
      if (!termos.has(relacionado)) {
        quebrados.push(`${entrada.term} → ${relacionado}`);
      }
    }
  }

  expect(quebrados, `relacionados sem verbete: ${quebrados.join("; ")}`).toEqual([]);
});

test("nenhum verbete se relaciona consigo mesmo", () => {
  const auto = GLOSSARY.filter((g) => (g.related ?? []).includes(g.term));
  expect(auto.map((g) => g.term)).toEqual([]);
});

const KINDS_VISUAIS = [
  "prefix-match",
  "vlsm-split",
  "encapsulation",
  "cam-story",
  "dot1q",
  "wireless-assoc",
  "wireless-spectrum",
  "cli-modes",
  "gui-vs-cli",
] as const;

test("nenhuma aula tem duas seções com o mesmo título", () => {
  const colisoes: string[] = [];
  for (const aula of LESSON_CONTENT) {
    const vistos = new Map<string, number>();
    for (const secao of aula.sections) {
      const titulo = "title" in secao ? secao.title : undefined;
      if (!titulo) continue;
      const slug = slugify(titulo);
      vistos.set(slug, (vistos.get(slug) ?? 0) + 1);
    }

    for (const fixa of ["o-que-e", "por-que-existe", "erros-comuns", "resumo"]) {
      if (vistos.has(fixa)) colisoes.push(`${aula.href}: "${fixa}" colide com a seção fixa`);
    }
    for (const [slug, n] of vistos) {
      if (n > 1) colisoes.push(`${aula.href}: "${slug}" aparece ${n} vezes`);
    }
  }
  expect(colisoes, colisoes.join("\n")).toEqual([]);
});

test("o sumário de toda aula é navegável: sem âncora repetida e sem item vazio", () => {
  for (const aula of LESSON_CONTENT) {
    const itens = lessonOutline(aula, true);
    const ids = itens.map((i) => i.id);
    expect(new Set(ids).size, `${aula.href}: âncora repetida`).toBe(ids.length);
    for (const item of itens) {
      expect(item.id.length, `${aula.href}: âncora vazia`).toBeGreaterThan(0);
      expect(item.title.trim().length, `${aula.href}: item sem título`).toBeGreaterThan(0);
    }
  }
});

test("toda visualização está ancorada em uma aula, e nenhuma aula repete a mesma", () => {
  const usos = new Map<string, string[]>();
  for (const aula of LESSON_CONTENT) {
    for (const secao of aula.sections) {
      if (!(KINDS_VISUAIS as readonly string[]).includes(secao.kind)) continue;
      usos.set(secao.kind, [...(usos.get(secao.kind) ?? []), aula.href]);
    }
  }

  const semUso = KINDS_VISUAIS.filter((k) => !usos.has(k));
  expect(semUso, `visualização declarada e nunca usada: ${semUso.join(", ")}`).toEqual([]);

  for (const [kind, rotas] of usos) {
    expect(new Set(rotas).size, `${kind} repetida numa aula`).toBe(rotas.length);
  }
});

test("todo aprofundamento entrega o que o chamariz promete", () => {
  const magros: string[] = [];
  for (const aula of LESSON_CONTENT) {
    for (const secao of aula.sections) {
      if (secao.kind !== "deep-dive") continue;
      if (secao.teaser.trim().length < 40) {
        magros.push(`${aula.href}: chamariz curto em "${secao.title}"`);
      }
      if (secao.paragraphs.length < 3) {
        magros.push(`${aula.href}: "${secao.title}" tem menos de 3 parágrafos`);
      }
      const corpo = secao.paragraphs.join(" ");
      if (corpo.length < 600) {
        magros.push(
          `${aula.href}: "${secao.title}" tem ${corpo.length} caracteres — raso demais para valer um clique a mais`,
        );
      }
    }
  }
  expect(magros, magros.join("\n")).toEqual([]);
});
